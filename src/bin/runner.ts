import * as v from 'valibot';
import type { Day, Result } from '@lib/types';
import { buildCalendar } from '@lib/builder';
import { parseTransfers } from '@lib/parser';
import { fetchEoNumber } from '@lib/document-finder';
import { ParseResultSchema, type ParseResult } from '@lib/schemas';

export interface RunOptions {
  transfersOnly?: boolean | undefined;
  pretty?: boolean | undefined;
  specialOnly?: boolean | undefined;
  inputTransfers?: boolean | undefined;
  getLink?: number | undefined;
}

export function parseTransfersJson(raw: string): Result<ParseResult, string> {
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      error: 'Невалидный JSON',
    };
  }

  const result = v.safeParse(ParseResultSchema, rawJson);
  if (!result.success) {
    return { ok: false, error: v.summarize(result.issues) };
  }
  return { ok: true, value: result.output };
}

async function getLink(options: RunOptions): Promise<Result<string, string>> {
  const { getLink, pretty: format, specialOnly: withReasonOnly, inputTransfers: json, transfersOnly: parserOnly } = options;

  if (!getLink) {
    return { ok: false, error: '--get-link is not passed' };
  }
  if (format || withReasonOnly || json || parserOnly) {
    return {
      ok: false,
      error: '--get-link cannot be used with any other flag',
    };
  }

  const actualPravoGovURL =
    'http://actual.pravo.gov.ru/content/content.html#pnum=';

  const eoNumber = await fetchEoNumber(getLink);

  if (!eoNumber.ok) {
    return eoNumber;
  }

  return { ok: true, value: actualPravoGovURL + eoNumber.value };
}

export async function execute(
  reader: NodeJS.ReadableStream,
  writer: NodeJS.WritableStream,
  options?: RunOptions,
): Promise<void> {
  if (options?.getLink) {
    const link = await getLink(options);
    if (!link.ok) {
      throw link.error;
    }
    writer.end(link.value + '\n');
    return;
  }

  if (
    options &&
    options.transfersOnly &&
    (options.specialOnly || options.inputTransfers)
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
    options?.inputTransfers ? parseTransfersJson(inputText) : parseTransfers(inputText);

  if (!result.ok) {
    throw Error(result.error);
  }

  let outputData: Day[] | ParseResult = result.value;
  if (!options?.transfersOnly) {
    const { year, transfers } = result.value;
    outputData = buildCalendar(year, transfers);
  }

  if (Array.isArray(outputData) && options?.specialOnly) {
    outputData = outputData.filter((day) => day.reason).filter(d => new Date(d.date));
  }

  const space = options?.pretty ? 2 : undefined;
  const jsonString = JSON.stringify(outputData, null, space);

  writer.end(jsonString + '\n');
}
