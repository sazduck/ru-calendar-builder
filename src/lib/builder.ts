import { HOLIDAYS, WEEKDAYS } from './constants';
import type {
  Day,
  DayOffTransfer,
  HolydayMeta,
  PreholidayMeta,
  PureWeekendMeta,
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
  switch (weekday) {
    case 0:
    case 6:
      return true;
    default:
      return false;
  }
};

export const getCalendarDay = (
  date: Date,
  transfers: DayOffTransfer[],
): Day => {
  const isoDate = date.toISOString().substring(0, 10);
  const mmdd = isoDate.substring(5);
  const weekday = (isWeekend(date) && WEEKDAYS[date.getDay()]) || undefined;

  const transferredTo = transfers.find(
    (tr) => tr.originalDate === isoDate,
  )?.newDate;

  const holidayName = HOLIDAYS[mmdd];
  if (holidayName) {
    return {
      date: isoDate,
      type: 'dayOff',
      meta: {
        reason: 'holiday',
        holidayName,
        ...(transferredTo && { transferredTo }),
        ...(weekday && { weekday }),
      } satisfies HolydayMeta,
    };
  }

  const transferredFrom = transfers.find(
    (tr) => tr.newDate === isoDate,
  )?.originalDate;

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
        ...(weekday && { weekday }),
      } satisfies TransferMeta,
    };
  }

  const tomorrowHolidayName =
    transferredTo ?
      HOLIDAYS[getNextDayMmdd(transferredTo)]
    : HOLIDAYS[getNextDayMmdd(date)];

  if (tomorrowHolidayName) {
    return {
      date: isoDate,
      type: 'shortened',
      meta: {
        reason: 'preholiday',
        holidayName: tomorrowHolidayName,
        ...(transferredTo && { transferredTo }),
        ...(weekday && { weekday }),
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
        ...(weekday && { weekday }),
      } satisfies TransferMeta,
    };
  }

  if (transferredTo) {
    const isToWeekend = isWeekend(transferredTo);
    if (!isToWeekend) {
      return {
        date: isoDate,
        type: 'working',
        meta: {
          reason: 'transfer',
          transferredTo,
          ...(weekday && { weekday }),
        } satisfies TransferMeta,
      };
    }
  }
  if (weekday) {
    return {
      date: isoDate,
      type: 'dayOff',
      meta: {
        weekday,
      } satisfies PureWeekendMeta,
    };
  }

  return { date: isoDate, type: 'working' };
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
