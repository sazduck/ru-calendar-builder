import type { Result, DayOffTransfer } from './types';

const MONTHS: Record<string, string> = {
  января: '01',
  февраля: '02',
  марта: '03',
  апреля: '04',
  мая: '05',
  июня: '06',
  июля: '07',
  августа: '08',
  сентября: '09',
  октября: '10',
  ноября: '11',
  декабря: '12',
} as const;

interface ParseResult {
  year: number;
  transfers: DayOffTransfer[];
}
export const parseTransfers = (str: string): Result<ParseResult, string> => {
  const yearMatch = str.match(/\d{4}/);
  if (!yearMatch) {
    return {
      ok: false,
      error: 'не найден год',
    };
  }
  const year = yearMatch[0];

  const matches = str.matchAll(
    /с\s+[а-я]+\s+(\d{1,2})\s+([а-я]+)\sна\s+[а-я]+\s+(\d{1,2})\s+([а-я]+)/gm,
  );

  const transfers: DayOffTransfer[] = [];
  for (let m of matches) {
    const dayFrom = m[1] ?? '';
    const isDayFromLegal = Number(dayFrom) <= 0 || Number(dayFrom) > 31;
    if (isDayFromLegal) {
      return { ok: false, error: `неверное число: ${m[1]}` };
    }
    const rawMonthFrom = m[2]?.toLowerCase();
    const dayTo = m[3] ?? '';
    const isDayToLegal = Number(dayTo) <= 0 || Number(dayTo) > 31;
    if (isDayToLegal) {
      return { ok: false, error: `неверное число: ${m[1]}` };
    }
    const rawMonthTo = m[4]?.toLowerCase();

    if (!rawMonthFrom || !rawMonthTo) {
      return {
        ok: false,
        error: 'ошибка структуры совпадения в регулярном выражении',
      };
    }
    const monthFrom = MONTHS[rawMonthFrom];
    const monthTo = MONTHS[rawMonthTo];

    if (!monthFrom || !monthTo) {
      return {
        ok: false,
        error: `неизвестный месяц в тексте: "${!monthFrom ? rawMonthFrom : rawMonthTo}"`,
      };
    }

    transfers.push({
      originalDate: year + '-' + monthFrom + '-' + dayFrom.padStart(2, '0'),
      newDate: year + '-' + monthTo + '-' + dayTo.padStart(2, '0'),
    });
  }
  return {
    ok: true,
    value: {
      year: Number(year),
      transfers,
    },
  };
};
