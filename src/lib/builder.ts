import { HOLIDAYS } from './constants';
import {
  type CalendarStatus,
  type Day,
  type DayOffTransfer,
  type DayType,
  type TransferReason,
} from './types';

export function isWeekend(date: Date): boolean {
  return date.getUTCDay() === 0 || date.getUTCDay() === 6;
}
export function getDayType(
  reason?: Exclude<CalendarStatus, TransferReason>,
): DayType {
  switch (reason?.type) {
    case 'holiday':
    case 'weekend':
      return 'dayOff';
    case 'preholiday':
      return 'shortened';
    default:
      return 'working';
  }
}

export function getStatus(
  dateSrc: Date,
): Exclude<CalendarStatus, TransferReason> | undefined {
  const date = new Date(dateSrc);
  const mmdd = date.toISOString().substring(5, 10);
  if (HOLIDAYS[mmdd]) {
    return { type: 'holiday', holidayName: HOLIDAYS[mmdd] };
  }

  if (isWeekend(date)) {
    return { type: 'weekend' };
  }

  date.setDate(date.getUTCDate() + 1);
  const tomorrowMmdd = date.toISOString().substring(5, 10);
  if (HOLIDAYS[tomorrowMmdd]) {
    return { type: 'preholiday', holidayName: HOLIDAYS[tomorrowMmdd] };
  }
}

export function getCalendarDay(date: Date, transfers: DayOffTransfer[]): Day {
  const isoDate = date.toISOString().substring(0, 10);

  const transferredTo = transfers.find((t) => t.from == isoDate)?.to;
  const transferredFrom = transfers.find((t) => t.to == isoDate)?.from;

  if (transferredFrom) {
    return {
      date: isoDate,
      type: 'dayOff',
      reason: {
        type: 'transfer',
        dir: 'from',
        src: transferredFrom,
      },
    };
  }

  const status = getStatus(date);
  if (status?.type === 'holiday') {
    return { date: isoDate, type: 'dayOff', reason: status };
  }

  if (transferredTo) {
    const transferDate = new Date(transferredTo);
    const transferStatus = getStatus(transferDate);
    const transferType = getDayType(transferStatus);
    return {
      date: isoDate,
      type: transferType,
      reason: {
        type: 'transfer',
        dir: 'from',
        src: transferredTo,
      },
    };
  }

  if (status?.type == 'preholiday') {
    return { date: isoDate, type: 'shortened', reason: status };
  }
  if (status?.type == 'weekend') {
    return { date: isoDate, type: 'dayOff', reason: status };
  }
  return { date: isoDate, type: 'working' };
}

export function buildCalendar(
  year: number,
  transfers: DayOffTransfer[] | never[],
) {
  const calendar: Day[] = [];

  const startDate = new Date(year + '-01-01');
  const endDate = new Date(year + '-12-31');

  for (let d = startDate; d <= endDate; d.setDate(d.getUTCDate() + 1)) {
    const currentDay = getCalendarDay(d, transfers);
    calendar.push(currentDay);
  }
  return calendar;
}
