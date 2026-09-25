import type { Day, DayOffTransfer, ParseResult, Result } from '@lib/types';
import { buildCalendar } from '@lib/builder';
import { parseTransfers } from '@lib/parser';

export interface RunOptions {
  parserOnly?: boolean;
  format?: boolean;
  withReasonOnly?: boolean;
  json?: boolean;
}

function isDayOffTransfer(value: unknown): value is DayOffTransfer {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).from === 'string' &&
    typeof (value as any).to === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test((value as any).from) &&
    /^\d{4}-\d{2}-\d{2}$/.test((value as any).to)
  );
}

function parseTransfersJson(raw: string): Result<ParseResult, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Невалидный JSON' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Ожидается объект' };
  }

  const { year, transfers } = parsed as any;

  if (typeof year !== 'number' || !Number.isInteger(year)) {
    return { ok: false, error: 'year должен быть числом' };
  }

  if (!Array.isArray(transfers) || !transfers.every(isDayOffTransfer)) {
    return { ok: false, error: 'transfers должен быть массивом DayOffTransfer' };
  }

  return { ok: true, value: { year, transfers } };
}

export async function run(
  reader: NodeJS.ReadableStream,
  writer: NodeJS.WritableStream,
  options: RunOptions = {
    parserOnly: false,
    format: false,
    withReasonOnly: false,
    json: false,
  },
): Promise<void> {
  if (
    options.parserOnly &&
    (options.withReasonOnly || options.json)
  ) {
    throw Error(
      '--parser-only cannot be used with --with-reason-only or --transfers',
    );
  }

  const chunks: Buffer[] = [];

  reader.setEncoding('utf-8');
  for await (const chunk of reader) {
    chunks.push(Buffer.from(chunk));
  }
  const inputText = Buffer.concat(chunks).toString('utf8');
  const result =
    options.json ?
      parseTransfersJson(inputText)
    : parseTransfers(inputText);

  if (!result.ok) {
    throw Error(result.error);
  }

  let outputData: Day[] | ParseResult = result.value;
  if (!options.parserOnly) {
    const { year, transfers } = result.value;
    outputData = buildCalendar(year, transfers);
  }


  if (Array.isArray(outputData) && options.withReasonOnly) {
    outputData = outputData.filter((day) => day.meta?.reason);
  }

  const space = options.format ? 2 : undefined;
  const jsonString = JSON.stringify(outputData, null, space);

  writer.write(jsonString);
  writer.write('\n');
}
