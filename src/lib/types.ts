import type { WEEKDAYS } from './constants';

type Weekday = (typeof WEEKDAYS)[number];

export interface ParseResult {
  year: number;
  transfers: DayOffTransfer[];
}

export interface HolydayMeta {
  reason: 'holiday';
  holidayName: string;
  transferredTo?: string;
  weekday?: Weekday;
}

export interface PreholidayMeta {
  reason: 'preholiday';
  holidayName: string;
  transferredTo?: string;
  weekday?: Weekday;
}

export type TransferMeta = {
  reason: 'transfer';
  holidayName?: string;
  weekday?: Weekday;
} & ({ transferredTo: string } | { transferredFrom: string });

export interface PureWeekendMeta {
  weekday: Weekday;
}

export type Day = { date: string } & (
  | {
      type: 'dayOff';
      meta: TransferMeta | HolydayMeta | PureWeekendMeta;
    }
  | {
      type: 'shortened';
      meta: PreholidayMeta;
    }
  | {
      type: 'working';
      meta?: TransferMeta;
    }
);

export interface DayOffTransfer {
  from: string;
  to: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
