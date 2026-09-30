import { HOLIDAYS } from './constants';
import {
  type CalendarStatus,
  type Day,
  type DayOffTransfer,
  type DayType,
  type Transfer,
  type TransferStatus,
} from './types';

export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}
export function getDayType(reason?: Exclude<CalendarStatus, TransferStatus>): DayType {
  switch (reason?.type) {
    case 'holiday':
    case 'weekend':
      return 'dayOff';
    case 'preholiday':
      return 'shortened';
    default:
      return 'working'
  }
}
export function getStatus(dateSrc: Date): Exclude<CalendarStatus, TransferStatus> | undefined {
  const date = new Date(dateSrc);
  const mmdd = date.toISOString().substring(5, 10);
  if (HOLIDAYS[mmdd]) {
    return { type: 'holiday', holidayName: HOLIDAYS[mmdd] };
  }

  if (isWeekend(date)) {
    return { type: 'weekend' };
  }

  date.setDate(date.getDate() + 1);
  const tomorrowMmdd = date.toISOString().substring(5, 10);
  if (HOLIDAYS[tomorrowMmdd]) {
    return { type: 'preholiday', holidayName: HOLIDAYS[tomorrowMmdd] };
  }
}

export function getCalendarDay(
  date: Date,
  transfers: DayOffTransfer[] | never[],
): Day {
  const isoDate = date.toISOString().substring(0, 10);
  const transfferedTo = transfers.find(
    (transfer) => transfer.from == isoDate,
  )?.to;
  const transfferedFrom = transfers.find(
    (transfer) => transfer.to == isoDate,
  )?.from;

  let status: undefined | CalendarStatus = getStatus(date);

  let transfer: Transfer | undefined
  if (transfferedTo) {
    transfer= { origin: 'sent', to: transfferedTo }
  } else if (transfferedFrom) {
    transfer= { origin: 'received', from: transfferedFrom }
  }

  if (status?.type === 'holiday') {
    return { date: isoDate, status, type: 'dayOff' };
  }

  if (transfer) {
    status = {
      type: 'transfer',
      detail: transfer,
    }
  }

  if (status?.type == 'transfer' && transfer?.origin === 'sent') {
    const transferDate = new Date(transfer!.to)
    const transferStatus = getStatus(transferDate)
    const transferType = getDayType(transferStatus)
    return { date: isoDate, status, type: transferType }
  }

  if (status?.type == 'preholiday') {
    return { date: isoDate, status, type: 'shortened' }
  }
  if (status?.type == 'weekend') {
    return { date: isoDate, status, type: 'dayOff' }
  }
  return { date: isoDate, type: 'working' }
}

export function buildCalendar(
  year: number,
  transfers: DayOffTransfer[] | never[],
) {
  const calendar: Day[] = [];

  const startDate = new Date(year + '-01-01');
  const endDate = new Date(year + '-12-31');

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentDay = getCalendarDay(d, transfers);
    calendar.push(currentDay);
  }
  return calendar;
}
