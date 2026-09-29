import { HOLIDAYS } from './constants';
import type {
  Day,
  DayOffTransfer,
  HolydayMeta,
  PreholidayMeta,
  Transfer,
  TransferDirection,
  TransferMeta,
  TrasnferType,
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
  if (HOLIDAYS[mmdd]) {
    return {
      type: 'dayOff',
      date: isoDate,
      meta: {
        reason: 'holiday',
        holidayName: HOLIDAYS[mmdd],
        ...(transferredTo && { transferredTo })
      }
    }
  }
  const transferredFrom = transfers.find((tr) => tr.to === isoDate)?.from;

  let transfer: | undefined | Transfer = undefined;

  const getTrasnferType = (transferDate: string): {
    type: TrasnferType;
    holidayName?: string | never;

  } => {
    let holidayName = HOLIDAYS[transferDate.substring(5)]
    if (holidayName) return {
      type: 'holiday',
      holidayName,
    };
    if (isWeekend(transferDate)) return {
      type: 'weekend'
    };
    holidayName = HOLIDAYS[getNextDayMmdd(transferDate)]
    if (holidayName) return {
      type: 'preholiday',
      holidayName,
    };
    return {
      type: 'working',
    }
  }

  const getTransfer = (transferDate: string, direction: TransferDirection='from'): Transfer => {
    const { type, holidayName } = getTrasnferType(transferDate);
    let transfer: Transfer = {
      date: transferDate,
      type,
      direction,
    }
    if (holidayName){
      transfer.holidayName = holidayName
    }
    return transfer;
  };

  if (transferredFrom) {
    transfer = getTransfer(transferredFrom)
  } else if (transferredTo) {
    transfer = getTransfer(transferredTo, 'to')
  }

  if (transfer) {

    if (transfer.type === 'holiday' || transfer.type === 'weekend') {
      return {
        date: isoDate,
        type: 'dayOff',
        meta: {
          reason: 'transfer',
          ...(transfer.holidayName && {holidayName: transfer.holidayName}),
          ...(
            transfer.direction === 'from' && { transferredFrom: transfer.date } ||
            {transferredTo: transfer.date}
          )
        }
      }
    }

    if (transfer.type === 'preholiday') {
      return {
        date: isoDate,
        type: 'shortened',
        meta: {
          reason: 'transfer',
          ...(
            transfer.direction === 'from' && { transferredFrom: transfer.date } ||
            {transferredTo: transfer.date}
          ),
          ...(transfer.holidayName && {holidayName: transfer.holidayName})
        }
      }
    }

    return {
      date: isoDate,
      type: 'working',
      meta: {
        reason: 'transfer',
        ...(
          transfer.direction === 'from' && { transferredFrom: transfer.date } ||
          {transferredTo: transfer.date}
        ),
      }
    }
  }


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

  if (isWeekend(date)) {
    return {
      date: isoDate,
      type: 'dayOff',
    }
  }

  const tomorrowHolidayName = HOLIDAYS[getNextDayMmdd(date)];
  if (tomorrowHolidayName) {
    return {
      date: isoDate,
      type: 'shortened',
      meta: {
        reason: 'preholiday',
        holidayName: tomorrowHolidayName,
      } satisfies PreholidayMeta,
    };
  }

  return {
    date: isoDate,
    type: 'working',
  }

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
