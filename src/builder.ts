import { nextDay } from 'date-fns/fp';
import type { Day, Transfer } from './types';

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

export const getCalendarDay = (date: Date, transfers: Transfer[]) => {
  const mmdd = date.toISOString().substring(5, 10);
  const year = date.getFullYear();
  const currentDay: Day = {
    // default
    date: `${year}-${mmdd}`,
    type: 'working',
  };
  const isCurrentDayHoliday = mmdd in HOLIDAYS;
  const transferedTo = transfers.find(tr => tr.from === `${year}-${mmdd}`)?.to;
  const transferedFrom = transfers.find((tr) => tr.to === `${year}-${mmdd}`)?.from;

  const isCurrentDayWeekend = [6, 0].includes(date.getDay());

  if (isCurrentDayHoliday) {
    currentDay.type = 'non_working';
    currentDay.meta = {
      holidayName: HOLIDAYS[mmdd],
    };
    return currentDay;
  }

  if (transferedFrom) {
    currentDay.meta = {
      transferedFrom: transferedFrom,
    };

    const isTransferedDayHoliday = transferedFrom.substring(5) in HOLIDAYS
    if (isTransferedDayHoliday) {
      currentDay.type = 'non_working';
      currentDay.meta!.holidayName = HOLIDAYS[transferedFrom!.substring(5)]
      return currentDay;
    }

    const isTransferedDayWeekend = [6, 0].includes(new Date(transferedFrom).getDay());
    if (isTransferedDayWeekend) {
      currentDay.type = 'non_working';
      return currentDay
    }
  }


  if (transferedTo) {
    currentDay.meta = {
      transferedTo: transferedTo,
    };
  } else if (isCurrentDayWeekend) {
    currentDay.type = 'non_working';
  }

  const getNextDayMmdd = (date: Date | string) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().substring(5, 10);
  }

  const nextMmdd = getNextDayMmdd(date)

  const tomorrowHoliday = HOLIDAYS[nextMmdd];

  if (tomorrowHoliday ||
    transferedFrom && getNextDayMmdd(transferedFrom) in HOLIDAYS ||
    transferedTo && getNextDayMmdd(transferedTo) in HOLIDAYS

  ) {
    currentDay.type = 'shortened';
    currentDay.meta = {
      ...currentDay.meta,
      holidayName: tomorrowHoliday,
    };
  }

  return currentDay;
};

export const buildCalendar = (year: string, transfers?: Transfer[] | []) => {
  const calendar: Day[] = [];

  const startDate = new Date(year + '-01-01');
  const endDate = new Date(year + '-12-31');

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentDay = getCalendarDay(d, transfers ?? []);
    calendar.push(currentDay);
  }
  return calendar;
};
