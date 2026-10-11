import { MONTHS } from './constants';
import type { ParseResult } from './schemas';
import type { DayOffTransfer, Result } from './types';
import { err, ok } from './helper';
const TRANSFERS_REGEX =
  /с\s+[а-я]+\s+(?<fromDay>\d{1,2})\s+(?<fromMonth>[а-я]+).*?на\s+[а-я]+\s+(?<toDay>\d{1,2})\s+(?<toMonth>[а-я]+)/gm;
const YEAR_REGEX = /\d{4}/;

export const parseTransfers = (str: string): Result<ParseResult, string> => {
  const yearMatch = str.match(YEAR_REGEX);
  if (!yearMatch) {
    return err('Не найден год');
  }
  const year = Number(yearMatch[0]);

  try {
    const transfers: DayOffTransfer[] = str.matchAll(TRANSFERS_REGEX).map(m => {
      const dayFrom = m.groups?.fromDay ?? '';
      const isDayFromLegal = Number(dayFrom) <= 0 || Number(dayFrom) > 31;
      if (isDayFromLegal) {
        throw `Неверное число: ${m[1]}`;
      }
      const rawMonthFrom = m[2]?.toLowerCase();
      const dayTo = m[3] ?? '';
      const isDayToLegal = Number(dayTo) <= 0 || Number(dayTo) > 31;
      if (isDayToLegal) {
        throw `Неверное число: ${m[3]}`;
      }
      const rawMonthTo = m[4]?.toLowerCase();

      if (!rawMonthFrom || !rawMonthTo) {
        throw 'Ошибка структуры совпадения в регулярном выражении';
      }
      const monthFrom = MONTHS[rawMonthFrom];
      const monthTo = MONTHS[rawMonthTo];

      if (!monthFrom || !monthTo) {
        throw `Неизвестный месяц в тексте: ${!monthFrom ? rawMonthFrom : rawMonthTo}`;
      }

      const from = year + '-' + monthFrom + '-' + dayFrom.padStart(2, '0');
      const to = year + '-' + monthTo + '-' + dayTo.padStart(2, '0');

      return { from, to };
    })
    .toArray();

    return ok({ year, transfers });
  } catch (error) {
    return (
      typeof error === 'string' ? err(error)
      : error instanceof Error ? err(error.message)
      : err('unknown error')
    );
  }
};
