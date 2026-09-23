import { buildCalendar } from './builder';
import { parseTransfers } from './parser';

export async function run(
  r: NodeJS.ReadableStream,
  w: NodeJS.WritableStream,
  e: NodeJS.WritableStream,
): Promise<void> {
  try {
    const chunks: Buffer[] = [];

    for await (const chunk of r) {
      chunks.push(Buffer.from(chunk));
    }
    const inputText = Buffer.concat(chunks).toString('utf8');
    const result = parseTransfers(inputText);
    if (!result.ok) {
      throw result.error;
    }
    const { year, transfers } = result.value;
    w.write(
      JSON.stringify(buildCalendar(year, transfers)),
    );
    w.write('\n');
  } catch (error) {
    e.write(error instanceof Error ? error.message : String(error));
    e.write('\n');
    throw error;
  }
}
