export interface ParseResult {
  year: number;
  transfers: DayOffTransfer[];
}

export type DayType = 'working' | 'shortened' | 'dayOff';

export interface HolidayReason {
  type: 'holiday';
  holidayName: string;
}
export interface PreholidayReason {
  type: 'preholiday';
  holidayName: string;
}
export interface WeekendReason {
  type: 'weekend';
}
export interface TransferReason {
  type: 'transfer';
  dir: 'to' | 'from';
  /** @format date */
  src: string;
}

export type CalendarStatus =
  WeekendReason | HolidayReason | PreholidayReason | TransferReason;

export type Day =
  | {
      /** @format date */
      date: string;
      type: 'working';
      reason?: TransferReason;
    }
  | {
      /** @format date */
      date: string;
      type: 'shortened';
      reason: PreholidayReason | TransferReason;
    }
  | {
      /** @format date */
      date: string;
      type: 'dayOff';
      reason: HolidayReason | WeekendReason | TransferReason;
    };

export interface DayOffTransfer {
  /** @format date */
  from: string;
  /** @format date */
  to: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
