import { describe, it, expect } from 'vitest';
import { Readable, Writable } from 'node:stream';
import { execute, parseTransfersJson, type RunOptions } from '@bin/runner';
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

describe('execute', () => {
  it('возвращает результат parser в режиме parser-only', async () => {
    const input = '2024 с субботы 27 апреля на понедельник 29 апреля';

    const { writer, getOutput } = createWriter();

    const reader = createReader(input);
    await execute(reader, writer, { parserOnly: true });

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

  it('возвращает календарь из результата parser', async () => {
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
    await execute(reader, writer, {
      json: true,
    });

    const outputRaw = getOutput();
    const output = JSON.parse(outputRaw);

    expect(output).toBeInstanceOf(Array);
    expect(output).toHaveLength(366);

    expect(output).toContainEqual({
      date: '2024-01-07',
      type: 'dayOff',
      reason: {
        type: 'holiday',
        holidayName: 'Рождество Христово',
      },
    } satisfies Day);
  });
  it('возвращает только дни со reason при with-reason-only', async () => {
    const input = '2024';

    const { writer, getOutput } = createWriter();

    const reader = createReader(input);
    const opts = {
      withReasonOnly: true,
    };

    await execute(reader, writer, opts);

    const output = JSON.parse(getOutput());

    expect(output).toBeInstanceOf(Array);
    expect(output.length).toBeGreaterThan(0);

    expect(output.every((day: Day) => day.reason)).toBe(true);
  });


});

describe('praseJsonTransfers', () => {

  it('успешно парсит валидный JSON переносов', () => {
    const validJson = JSON.stringify({
      year: 2026,
      transfers: [
        { from: '2026-01-03', to: '2026-05-08' }
      ]
    });

    const result = parseTransfersJson(validJson);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.year).toBe(2026);
      expect(result.value.transfers).toHaveLength(1);
    }
  });

  it('возвращает ошибку, если передан сломанный JSON', () => {
    const brokenJson = '{ year: 2026, transfers: '; // Синтаксическая ошибка

    const result = parseTransfersJson(brokenJson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('невалидный JSON');
    }
  });

  it('возвращает ошибку, если год меньше 2001', () => {
    const invalidJson = JSON.stringify({
      year: 2000, // Граничное значение
      transfers: []
    });

    const result = parseTransfersJson(invalidJson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('year'); // Проверяем, что Valibot ругнулся на год
    }
  });

  it('возвращает ошибку, если дата не в формате ISO', () => {
    const invalidJson = JSON.stringify({
      year: 2026,
      transfers: [
        { from: '03.01.2026', to: '2026-05-08' } // Неверный формат 'from'
      ]
    });

    const result = parseTransfersJson(invalidJson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('формате yyyy-mm-dd');
    }
  });
})
