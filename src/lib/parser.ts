import { MONTHS } from './constants';
import type { ParseResult } from './schemas';
import type { DayOffTransfer, Result } from './types';
import { err, ok } from './helper';
const TRANSFERS_REGEX =
  /с\s+[а-я]+\s+(?<dayFrom>\d{1,2})\s+(?<monthFrom>[а-я]+).*?на\s+[а-я]+\s+(?<dayTo>\d{1,2})\s+(?<monthTo>[а-я]+)/gm;
const YEAR_REGEX = /\d{4}/;

export const parseTransfers = (str: string): Result<ParseResult, string> => {
  const yearMatch = str.match(YEAR_REGEX);
  if (!yearMatch) {
    return err('Не найден год');
  }
  const year = Number(yearMatch[0]);

  const transfers: DayOffTransfer[] = [];
  for (const m of str.matchAll(TRANSFERS_REGEX)) {
    const dayFrom = m.groups?.dayFrom;
    if (!dayFrom) {
      return err(`Не найдена дата "с"`);
    }
    const isDayFromLegal = Number(dayFrom) <= 0 || Number(dayFrom) > 31;
    if (isDayFromLegal) {
      return err(`Неверное число: ${dayFrom}`);
    }
    const dayTo = m.groups?.dayTo;
    if (!dayTo) {
      return err(`Не найдена дата "на"`);
    }
    const isDayToLegal = Number(dayTo) <= 0 || Number(dayTo) > 31;
    if (isDayToLegal) {
      return err(`Неверное число: ${dayTo}`);
    }

    const rawMonthFrom = m.groups?.monthFrom;
    const rawMonthTo = m.groups?.monthTo;

    if (!rawMonthFrom || !rawMonthTo) {
      return err('Ошибка структуры совпадения в регулярном выражении');
    }
    const monthFrom = MONTHS[rawMonthFrom];
    const monthTo = MONTHS[rawMonthTo];

    if (!monthFrom || !monthTo) {
      return err(
        `Неизвестный месяц в тексте: ${!monthFrom ? rawMonthFrom : rawMonthTo}`,
      );
    }

    const from = year + '-' + monthFrom + '-' + dayFrom.padStart(2, '0');
    const to = year + '-' + monthTo + '-' + dayTo.padStart(2, '0');

    transfers.push({ from, to });
  }
  return ok({ year, transfers });
};
