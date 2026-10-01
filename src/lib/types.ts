export interface ParseResult {
  year: number;
  transfers: DayOffTransfer[];
}

export type DayType = 'working' | 'shortened' | 'dayOff';

export type Transfer =
  | {
      origin: 'received';
      from: string;
    }
  | {
      origin: 'sent';
      to: string;
    };
export type HolidayStatus = { type: 'holiday'; holidayName: string };
export type PreholidayStatus = { type: 'preholiday'; holidayName: string };
export type WeekendStatus = { type: 'weekend' };
export type TransferStatus = { type: 'transfer', detail: Transfer}

export type CalendarStatus = WeekendStatus | HolidayStatus | PreholidayStatus | TransferStatus;

export type Day =
  | {
    date: string;
    type: 'working';
    status?: TransferStatus;
  } | {
    date: string;
    type: 'shortened';
    status: PreholidayStatus | TransferStatus
  } | {
    date: string;
    type: 'dayOff';
    status: HolidayStatus | WeekendStatus | TransferStatus
  }

export interface DayOffTransfer {
  from: string;
  to: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
