import { WEEKDAYS, type Day, type DayOffTransfer } from './types';

const HOLIDAYS: Record<string, string> = {
  '01-01': 'Новый год',
  '01-02': 'Новогодние каникулы',
  '01-03': 'Новогодние каникулы',
  '01-04': 'Новогодние каникулы',
  '01-05': 'Новогодние каникулы',
  '01-06': 'Новогодние каникулы',
  '01-07': 'Рождество Христово',
  '01-08': 'Новогодние каникулы',
  '02-23': 'День защитника отечества',
  '03-08': 'Международный женский день',
  '05-01': 'День труда',
  '05-09': 'День победы',
  '06-12': 'День России',
  '11-04': 'День народного единства',
} as const;

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
  const weekday =
    (isWeekend(date) && WEEKDAYS[date.getDay()]) || undefined;

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
      },
    };
  }

  const transferredFrom = transfers.find(
    (tr) => tr.newDate === isoDate,
  )?.originalDate;

  const fromHolidayName = transferredFrom && HOLIDAYS[transferredFrom.substring(5)];
  if (fromHolidayName) {
    return {
      date: isoDate,
      type: 'dayOff',
      meta: {
        reason: 'transfer',
        transferredFrom,
        holidayName: fromHolidayName,
        ...(weekday && { weekday }),
      },
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
      },
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
      },
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
        },
      };
    }
  }

  return {
    date: isoDate,
    type: weekday ? 'dayOff' : 'working',
    ...(weekday && {
      meta: {
        weekday,
      },
    }),
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
