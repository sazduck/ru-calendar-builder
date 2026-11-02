import { HOLIDAYS } from './constants';
import {
  type CalendarStatus,
  type Day,
  type DayOffTransfer,
  type DayType,
  type TransferReason,
} from './types';

export function isWeekend(date: Temporal.PlainDate): boolean {
  return date.dayOfWeek === 6 || date.dayOfWeek === 7;
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

export function getReason(
  date: Temporal.PlainDate,
): Exclude<CalendarStatus, TransferReason> | undefined {
  const mmdd = date.toPlainMonthDay().toString();
  if (HOLIDAYS[mmdd]) {
    return { type: 'holiday', holidayName: HOLIDAYS[mmdd] };
  }

  if (isWeekend(date)) {
    return { type: 'weekend' };
  }

  const tomrrow = date.add({days: 1})
  const tomorrowMmdd = tomrrow.toPlainMonthDay().toString();
  if (HOLIDAYS[tomorrowMmdd]) {
    return { type: 'preholiday', holidayName: HOLIDAYS[tomorrowMmdd] };
  }
}

export function getCalendarDay(date: Temporal.PlainDate, transfers: DayOffTransfer[]): Day {
  const isoDate = date.toString();

  const foundTransfer = transfers
    .find(tr => tr.from === isoDate || tr.to == isoDate)

  const transferReason: TransferReason | undefined = foundTransfer
    ? {
        type: "transfer",
        dir: foundTransfer.from === isoDate ? 'from' : 'to',
        src: foundTransfer.from === isoDate ? foundTransfer.to : foundTransfer.from,
      }
    : undefined;

  if (transferReason?.dir == 'to') {
    return {
      date: isoDate,
      type: 'dayOff',
      reason: transferReason
    };
  }

  const reason = getReason(date);
  if (reason?.type === 'holiday') {
    return { date: isoDate, type: 'dayOff', reason };
  }

  if (transferReason?.dir === 'from') {
    const transferDate = Temporal.PlainDate.from(transferReason.src);
    const transferStatus = getReason(transferDate);
    const transferType = getDayType(transferStatus);
    return {
      date: isoDate,
      type: transferType,
      reason: transferReason,
    };
  }

  if (reason?.type == 'preholiday') {
    return { date: isoDate, type: 'shortened', reason: reason };
  }
  if (reason?.type == 'weekend') {
    return { date: isoDate, type: 'dayOff', reason: reason };
  }
  return { date: isoDate, type: 'working' };
}

export function buildCalendar(
  year: number,
  transfers: DayOffTransfer[] | never[],
) {
  const calendar: Day[] = [];

  const startOfYear = new Temporal.PlainDate(year, 1, 1);
  const totalDays = startOfYear.daysInYear

  for (let i = 0; i < totalDays; i++) {

    const currentDay = startOfYear.add({ days: i });
    const calendarDay = getCalendarDay(currentDay, transfers);
    calendar.push(calendarDay);
  }
  return calendar;
}
