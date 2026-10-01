import { describe, it, expect } from 'vitest';
import { Readable, Writable } from 'node:stream';
import { run } from '@bin/runner';
import type { Day } from '@lib/types';

function createReader(input: string): Readable {
  return Readable.from([input]);
}

function createWriter() {
  let output = '';

  const writer = new Writable({
    write(chunk, _encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  return {
    writer,
    getOutput: () => output,
  };
}

describe('run', () => {
  it('возвращает результат parser в режиме parser-only', async () => {
    const input = '2024 с субботы 27 апреля на понедельник 29 апреля';

    const { writer, getOutput } = createWriter();

    await run(createReader(input), writer, { parserOnly: true });

    expect(JSON.parse(getOutput())).toEqual({
      year: 2024,
      transfers: [
        {
          from: '2024-04-27',
          to: '2024-04-29',
        },
      ],
    });
  });

  it('строит календарь из результата parser', async () => {
    const input = JSON.stringify({
      year: 2024,
      transfers: [
        { from: '2024-01-06', to: '2024-05-10' },
        { from: '2024-01-07', to: '2024-12-31' },
        { from: '2024-04-27', to: '2024-04-29' },
        { from: '2024-11-02', to: '2024-04-30' },
        { from: '2024-12-28', to: '2024-12-30' },
      ],
    });

    const { writer, getOutput } = createWriter();
    const reader = createReader(input);
    await run(reader, writer, {
      json: true,
    });

    const outputRaw = getOutput();
    const output = JSON.parse(outputRaw);

    expect(output).toBeInstanceOf(Array);
    expect(output).toHaveLength(366);

    expect(output).toContainEqual({
      date: '2024-01-07',
      type: 'dayOff',
      status: {
        type: 'holiday',
        holidayName: 'Рождество Христово',
      },
    } satisfies Day);
  });
});

it('выводит только дни со status при withStatusOnly', async () => {
  const input = '2024';

  const { writer, getOutput } = createWriter();

  await run(createReader(input), writer, {
    withStatusOnly: true,
  });

  const output = JSON.parse(getOutput());

  expect(output).toBeInstanceOf(Array);
  expect(output.length).toBeGreaterThan(0);

  expect(output.every((day: { status?: string }) => day.status)).toBe(true);
});
