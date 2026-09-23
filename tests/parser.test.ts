import { parseTransfers } from '@/parser';
import type { DayOffTransfer } from '@/types'
import { describe, expect, it } from 'vitest';


describe('parseTransfers', () => {
  it('должна вернуть корректные данные', async () => {
    const str = `Перенести в 2026 году следующие выходные дни:
с субботы 3 января на пятницу 9 января;
с воскресенья 4 января на четверг 31 декабря.`;
    const result = parseTransfers(str);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.transfers).toEqual([
        { originalDate: '2026-01-03', newDate: '2026-01-09' },
        { originalDate: '2026-01-04', newDate: '2026-12-31' },
      ] satisfies DayOffTransfer[]);
      expect(result.value.year).toEqual(2026);
    }
  });

  it('должна вернуть ошибку при отсутствии года', () => {
    const result = parseTransfers('Текст без года');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('год');
    }
  });
  it('должна вернуть ошибку при отсутствии совпадений переносов', () => {
    const result = parseTransfers('1337 год');
    expect(result.ok).toBe(true);
  });
  it('должна вернуть ошибку при нахождении неверного числа', () => {
    const result = parseTransfers('1337 год с мурзика 42 мямуня на ковырика 10 мяубря');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('неверное число');
    }
  });
  it('должна вернуть ошибку при нахождении неизвестного месяца', () => {
    const result = parseTransfers('1337 год с мурзика 31 мямуня на ковырика 10 мяубря');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('неизвестный месяц');
    }
  });
});
