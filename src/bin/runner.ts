import type { Day, ParseResult } from "@lib/types";
import { buildCalendar } from "@lib/builder";
import { parseTransfers } from "@lib/parser";

export interface RunOptions {
  parserOnly: boolean;
  format: boolean;
}

export async function run(
  reader: NodeJS.ReadableStream,
  writer: NodeJS.WritableStream,
  options: RunOptions
): Promise<void> {
  const chunks: Buffer[] = [];

  reader.setEncoding('utf-8');
  for await (const chunk of reader) {
    chunks.push(Buffer.from(chunk));
  }
  const inputText = Buffer.concat(chunks).toString('utf8');
  const result = parseTransfers(inputText);
  if (!result.ok) {
    throw Error(result.error);
  }

  let outputData: Day[] | ParseResult;
  if (options.parserOnly) {
    outputData = result.value;
  } else {
    const { year, transfers } = result.value;
    outputData = buildCalendar(year, transfers);
  }

  const space = options.format ? 2 : undefined;
  const jsonString = JSON.stringify(outputData, null, space);

  writer.write(jsonString)
  writer.write('\n');
}
