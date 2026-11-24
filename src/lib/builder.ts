import { HOLIDAYS } from './constants';
import {
  type Day,
  type DayOffTransfer,
  type Reason,
} from './types';

export function isWeekend(date: Temporal.PlainDate): boolean {
  return date.dayOfWeek === 6 || date.dayOfWeek === 7;
}

export function getReason(date: Temporal.PlainDate): Reason | undefined {
  const mmdd = date.toPlainMonthDay().toString();
  if (HOLIDAYS[mmdd]) {
    return { type: 'holiday', holidayName: HOLIDAYS[mmdd] };
  }

  if (isWeekend(date)) {
    return { type: 'weekend' };
  }

  const tomrrow = date.add({ days: 1 });
  const tomorrowMmdd = tomrrow.toPlainMonthDay().toString();
  if (HOLIDAYS[tomorrowMmdd]) {
    return { type: 'preholiday', holidayName: HOLIDAYS[tomorrowMmdd] };
  }
}

export function getCalendarDay(
  date: Temporal.PlainDate,
  transfers: DayOffTransfer[],
): Day {
  const isoDate = date.toString();

  const reason = getReason(date);
  if (reason?.type === 'holiday') {
    return { date: isoDate, type: 'dayOff', reason };
  }

  const foundTransfer = transfers.find(
    tr => tr.from === isoDate || tr.to == isoDate,
  );

  const transferDate =
    foundTransfer && foundTransfer.from == isoDate ?
      isoDate
    : foundTransfer?.from;

  if (transferDate) {
    const date = Temporal.PlainDate.from(transferDate);
    const transferReason = getReason(date);
    if (!transferReason) {
      return { date: isoDate, type: 'working' };
    }

    if (transferReason.type === 'holiday') {
      return { date: isoDate, type: 'dayOff', reason: { type: 'transfer', from: transferDate } };
    }
    if (transferReason.type === 'preholiday') {
      return { date: isoDate, type: 'shortened', reason: { type: 'transfer', to: transferDate } };
    }
    return { date: isoDate, type: 'working', reason: { type: 'transfer', to: transferDate } };

  }

  if (reason?.type == 'preholiday') {
    return { date: isoDate, type: 'shortened', reason };
  }
  if (reason?.type == 'weekend') {
    return { date: isoDate, type: 'dayOff', reason };
  }
  return { date: isoDate, type: 'working' };
}

export function buildCalendar(
  year: number,
  transfers: DayOffTransfer[] | never[],
) {
  const calendar: Day[] = [];

  const startOfYear = new Temporal.PlainDate(year, 1, 1);
  const totalDays = startOfYear.daysInYear;

  for (let i = 0; i < totalDays; i++) {
    const currentDay = startOfYear.add({ days: i });
    const calendarDay = getCalendarDay(currentDay, transfers);
    calendar.push(calendarDay);
  }
  return calendar;
}
