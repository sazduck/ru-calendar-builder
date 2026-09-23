import type { Day, DayOffTransfer } from './types';

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

export const getCalendarDay = (date: Date, transfers: DayOffTransfer[]) => {
  const isoDate = date.toISOString().substring(0, 10);
  const mmdd = isoDate.substring(5);
  const curDay: Day = {
    date: isoDate,
    type: 'working', // default
  };

  const isCurDayWeekend = [6, 0].includes(date.getDay());

  const transferredTo = transfers.find((tr) => tr.originalDate === isoDate)?.newDate;
  if (transferredTo) {
    curDay.meta = { transferredTo };

    const toHolidayName =
      HOLIDAYS[transferredTo.substring(5)];
    if (toHolidayName) {
      curDay.meta.holidayName = toHolidayName;
    }
  }

  const transferredFrom = transfers.find((tr) => tr.newDate === isoDate)?.originalDate;
  if (transferredFrom) {
    curDay.meta = { transferredFrom };

    const fromHolidayName =
      HOLIDAYS[transferredFrom.substring(5)];
    if (fromHolidayName) {
      curDay.type = 'dayOff';
      curDay.meta.holidayName = fromHolidayName;
      return curDay;
    }

    const isFromWeekend = [6, 0].includes(
      new Date(transferredFrom).getDay(),
    );
    if (isFromWeekend) {
      curDay.type = 'dayOff';
      return curDay;
    }
  }

  if (mmdd in HOLIDAYS) {
    curDay.type = 'dayOff';
    curDay.meta = {
      ...curDay.meta,
      holidayName: HOLIDAYS[mmdd],
    };
    return curDay;
  }

  let holidayName = HOLIDAYS[getNextDayMmdd(date)];
  if (transferredTo) {
    holidayName = HOLIDAYS[getNextDayMmdd(transferredTo)];
  } else if (isCurDayWeekend) {
    curDay.type = 'dayOff';
    return curDay;
  }
  if (holidayName) {
    curDay.type = 'shortened';
    curDay.meta = {
      ...curDay.meta,
      holidayName
    };
  }

  return curDay;
};

export const buildCalendar = (year: string, transfers?: DayOffTransfer[] | []) => {
  const calendar: Day[] = [];

  const startDate = new Date(year + '-01-01');
  const endDate = new Date(year + '-12-31');

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentDay = getCalendarDay(d, transfers ?? []);
    calendar.push(currentDay);
  }
  return calendar;
};
