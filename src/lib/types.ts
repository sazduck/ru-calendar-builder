import type { WEEKDAYS } from "./constants";

type DayType = 'working' | 'dayOff' | 'shortened';

type DayTypeReason = 'holiday' | 'transfer' | 'preholiday';

type Weekday = (typeof WEEKDAYS)[number];

export interface ParseResult {
  year: number;
  transfers: DayOffTransfer[];
}

export interface HolydayMeta {
  reason: Extract<DayTypeReason, 'holiday'>;
  holidayName: string;
  transferredTo?: string;
  weekday?: Weekday;
}

export interface PreholidayMeta {
  reason: Extract<DayTypeReason, 'preholiday'>;
  holidayName: string;
  transferredTo?: string;
  weekday?: Weekday;
}

export type TransferMeta = {
  reason: Extract<DayTypeReason, 'transfer'>;
  holidayName?: string;
  weekday?: Weekday;
} & ({ transferredTo: string } | { transferredFrom: string });

export interface PureWeekendMeta {
  weekday: Weekday;
  reason?: never;
  holidayName?: never;
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
  originalDate: string;
  newDate: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
