import { HOLIDAYS } from './constants';
import type {
  Day,
  DayOffTransfer,
  HolydayMeta,
  PreholidayMeta,
  TransferMeta,
} from './types';

const getNextDayMmdd = (date: Date | string) => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString().substring(5, 10);
};

const isWeekend = (date: Date | string) => {
  const newDate = typeof date === 'string' ? new Date(date) : date;
  const weekday = newDate.getDay();
  return weekday === 0 || weekday === 6;
};

export const getCalendarDay = (
  date: Date,
  transfers: DayOffTransfer[],
): Day => {
  const isoDate = date.toISOString().substring(0, 10);
  const mmdd = isoDate.substring(5);

  const transferredTo = transfers.find((tr) => tr.from === isoDate)?.to;

  const holidayName = HOLIDAYS[mmdd];
  if (holidayName) {
    return {
      date: isoDate,
      type: 'dayOff',
      meta: {
        reason: 'holiday',
        holidayName,
        ...(transferredTo && { transferredTo }),
      } satisfies HolydayMeta,
    };
  }

  const transferredFrom = transfers.find((tr) => tr.to === isoDate)?.from;

  const fromHolidayName =
    transferredFrom && HOLIDAYS[transferredFrom.substring(5)];
  if (fromHolidayName) {
    return {
      date: isoDate,
      type: 'dayOff',
      meta: {
        reason: 'transfer',
        transferredFrom,
        holidayName: fromHolidayName,
      } satisfies TransferMeta,
    };
  }

  // если перенесенный день предепрездник то тоже сегодня сокращенный
  const tomorrowHolidayName = HOLIDAYS[getNextDayMmdd(transferredTo ?? date)]
  if (tomorrowHolidayName) {
    return {
      date: isoDate,
      type: 'shortened',
      meta: {
        reason: 'preholiday',
        holidayName: tomorrowHolidayName,
        ...(transferredTo && { transferredTo }),
      } satisfies PreholidayMeta,
    };
  }

  if (transferredFrom) {
    const isFromWeekend = isWeekend(transferredFrom);
    return {
      type: isFromWeekend ? 'dayOff' : 'working',
      date: isoDate,
      meta: {
        reason: 'transfer',
        transferredFrom,
      } satisfies TransferMeta,
    };
  }

  if (transferredTo) {
    return {
      date: isoDate,
      type: 'working',
      meta: {
        reason: 'transfer',
        transferredTo,
      } satisfies TransferMeta,
    };
  }

  return {
    date: isoDate,
    type: isWeekend(date) ? 'dayOff' : 'working',
  };
};

export const buildCalendar = (
  year: number,
  transfers?: DayOffTransfer[] | [],
) => {
  const calendar: Day[] = [];

  const startDate = new Date(year + '-01-01');
  const endDate = new Date(year + '-12-31');

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentDay = getCalendarDay(d, transfers ?? []);
    calendar.push(currentDay);
  }
  return calendar;
};
