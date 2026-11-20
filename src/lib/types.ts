export type DayType = 'working' | 'shortened' | 'dayOff';

export type Holiday =
  | 'Новый год'
  | 'Новогодние каникулы'
  | 'Рождество Христово'
  | 'День защитника Отечества'
  | 'Международный женский день'
  | 'Праздник Весны и Труда'
  | 'День Победы'
  | 'День России'
  | 'День народного единства';

export interface HolidayReason {
  type: 'holiday';
  holidayName: Holiday;
}
export interface PreholidayReason {
  type: 'preholiday';
  holidayName: Holiday;
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
