import { err, ok } from './helpers';
import type {
  DayOffTransfer,
  DocumentItem,
  PravoGovDocumentResponse,
  Result,
  YearTransfers,
} from './types';

// --- predicates ---

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function isIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) return false;
  try {
    Temporal.PlainDate.from(value);
    return true;
  } catch {
    return false;
  }
}

// --- validators ---

export function parseDayOffTransfer(
  data: unknown,
): Result<DayOffTransfer, string> {
  if (!isRecord(data)) {
    return err(`ожидался объект переноса, получено: ${describeType(data)}`);
  }

  if (typeof data.from !== 'string') {
    return err(
      `дата должна быть строкой, получено: ${describeType(data.from)}`,
    );
  }
  if (!isIsoDate(data.from)) {
    return err('дата должен быть в формате yyyy-mm-dd');
  }

  if (typeof data.to !== 'string') {
    return err(`дата должна быть строкой, получено: ${describeType(data.to)}`);
  }
  if (!isIsoDate(data.to)) {
    return err('дата должен быть в формате yyyy-mm-dd');
  }

  return ok({ from: data.from, to: data.to });
}

export function parseYearTransfers(
  data: unknown,
): Result<YearTransfers, string> {
  if (!isRecord(data)) {
    return err(`ожидался объект, получено: ${describeType(data)}`);
  }

  if (typeof data.year !== 'number' || Number.isNaN(data.year)) {
    return err(`год должен быть числом, пришло: ${describeType(data.year)}`);
  }
  if (data.year < 2001) {
    return err('минимальный год 2001');
  }

  if (!Array.isArray(data.transfers)) {
    return err('переносы должны быть массивом');
  }

  const transfers: DayOffTransfer[] = [];
  for (let i = 0; i < data.transfers.length; i++) {
    const itemResult = parseDayOffTransfer(data.transfers[i]);
    if (!itemResult.ok) {
      return err(`transfers[${i}]: ${itemResult.error}`);
    }
    transfers.push(itemResult.value);
  }

  return ok({
    year: data.year,
    transfers,
  });
}

function isDocumentItem(value: unknown): value is DocumentItem {
  if (!isRecord(value)) return false;

  const stringFields = [
    'id',
    'eoNumber',
    'name',
    'number',
    'title',
    'complexName',
    'documentDate',
    'publishDateShort',
    'viewDate',
    'signatoryAuthorityId',
    'documentTypeId',
  ] as const;

  const numberFields = ['pagesCount', 'pdfFileLength'] as const;

  const nullableStringFields = [
    'zipFileLength',
    'jdRegNumber',
    'jdRegDate',
  ] as const;

  return (
    stringFields.every(key => typeof value[key] === 'string') &&
    numberFields.every(
      key => typeof value[key] === 'number' && !Number.isNaN(value[key]),
    ) &&
    typeof value.hasSvg === 'boolean' &&
    nullableStringFields.every(
      key => value[key] === null || typeof value[key] === 'string',
    )
  );
}

export function parsePravoGovResponse(
  data: unknown,
): Result<PravoGovDocumentResponse, string> {
  if (!isRecord(data)) {
    return err(`ожидался объект ответа API, получено: ${describeType(data)}`);
  }

  const numberFields = [
    'itemsTotalCount',
    'itemsPerPage',
    'currentPage',
    'pagesTotalCount',
  ] as const;

  for (const key of numberFields) {
    if (typeof data[key] !== 'number' || Number.isNaN(data[key])) {
      return err(`поле "${key}" должно быть числом`);
    }
  }

  if (!Array.isArray(data.items) || !data.items.every(isDocumentItem)) {
    return err('поле "items" содержит некорректные элементы документа');
  }

  return ok({
    items: data.items,
    itemsTotalCount: data.itemsTotalCount as number,
    itemsPerPage: data.itemsPerPage as number,
    currentPage: data.currentPage as number,
    pagesTotalCount: data.pagesTotalCount as number,
  });
}
