import * as v from 'valibot';
import type { Day, Result } from '@lib/types';
import { buildCalendar } from '@lib/builder';
import { parseTransfers } from '@lib/parser';
import { fetchEoNumber } from '@lib/document-finder';
import { YearTransfersSchema, type YearTransfers } from '@lib/schemas';
import { err, ok } from '@lib/helper';

export type DayFilter = 'all' | 'special-only';

export type OutputMode =
  { type: 'calendar'; filter: DayFilter } | { type: 'transfers-only' };

export type OutputFormat = 'raw' | 'pretty' | 'compact';

export interface GetLinkOptions {
  year: number;
}

export interface ParseOptions {
  transfersInput: boolean;
  mode: OutputMode;
  format: OutputFormat;
}

export type RunConfig =
  | { command: 'get-link'; options: GetLinkOptions }
  | { command: 'parse'; options: ParseOptions };

export const DEFAULT_PARSE_OPTIONS: ParseOptions = {
  transfersInput: false,
  mode: { type: 'calendar', filter: 'all' },
  format: 'raw',
}

export function createRunConfig(
  command: 'get-link',
  options: GetLinkOptions,
): Extract<RunConfig, { command: 'get-link' }>;

export function createRunConfig(
  command?: 'parse',
  options?: Partial<ParseOptions>,
): Extract<RunConfig, { command: 'parse' }>;

export function createRunConfig(
  command: RunConfig['command'] = 'parse',
  options: Partial<ParseOptions> | GetLinkOptions = {},
): RunConfig {
  if (command === 'get-link') {
    return {
      command: 'get-link',
      options: options as GetLinkOptions,
    };
  }

  return {
    command: 'parse',
    options: {
      ...DEFAULT_PARSE_OPTIONS,
      ...(options as Partial<ParseOptions>),
    },
  };
}

export function parseTransfersJson(raw: string): Result<YearTransfers, string> {
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(raw);
  } catch {
    return err('Невалидный JSON');
  }

  const result = v.safeParse(YearTransfersSchema, rawJson);
  if (!result.success) {
    return err(v.summarize(result.issues));
  }
  return ok(result.output);
}

async function getLink(
  options: GetLinkOptions,
): Promise<Result<string, string>> {
  const eoNumber = await fetchEoNumber(options.year);

  if (!eoNumber.ok) {
    return eoNumber;
  }

  return ok(`http://publication.pravo.gov.ru/document/${eoNumber.value}`);
}

function isDaySpecial(day: Day): boolean {
  return day.reason && day.reason.type !== 'weekend' ? true : false;
}

function compact(data: any) {
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return `[\n  ${data.map(item => JSON.stringify(item)).join(',\n  ')}\n]`;
  }

  return JSON.stringify(data, null, 2).replace(
    /\{\n\s+([^{}[\]]+?)\n\s+\}/g,
    (_, content) => {
      return `{ ${content.replace(/\n\s+/g, ' ')} }`;
    },
  );
}

function formatOutput(data: any, format: OutputFormat) {
  switch (format) {
    case 'compact':
      return compact(data);
    case 'pretty':
      return JSON.stringify(data, null, 2);
    case 'raw':
      return JSON.stringify(data);
  }
}

async function getLinkComand(
  writer: NodeJS.WritableStream,
  options: GetLinkOptions,
) {
  const link = await getLink(options);
  if (!link.ok) {
    throw link.error;
  }
  writer.end(link.value + '\n');
  return;
}

async function parseCommand(
  reader: NodeJS.ReadableStream,
  writer: NodeJS.WritableStream,
  options: ParseOptions,
) {
  const chunks: Buffer[] = [];

  reader.setEncoding('utf-8');
  for await (const chunk of reader) {
    chunks.push(Buffer.from(chunk));
  }
  const inputText = Buffer.concat(chunks).toString('utf8');
  const yearTransfers =
    options.transfersInput ?
      parseTransfersJson(inputText)
    : parseTransfers(inputText);

  if (!yearTransfers.ok) {
    throw Error(yearTransfers.error);
  }

  const format = options.format;

  if (options.mode.type === 'transfers-only') {
    const formated = formatOutput(yearTransfers.value, format);
    writer.end(formated + '\n');
    return;
  }

  const { year, transfers } = yearTransfers.value;
  const calendar = buildCalendar(year, transfers);

  const isSpecialOnly = options.mode.filter === 'special-only';
  const filtered = isSpecialOnly ? calendar.filter(isDaySpecial) : calendar;
  const formated = formatOutput(filtered, format);
  writer.end(formated + '\n');
}

export async function execute(
  reader: NodeJS.ReadableStream,
  writer: NodeJS.WritableStream,
  config: RunConfig,
): Promise<void> {
  switch (config.command) {
    case 'get-link':
      return getLinkComand(writer, config.options);
    case 'parse':
      return parseCommand(reader, writer, config.options);
  }
}
