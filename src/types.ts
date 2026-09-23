type DayType = 'working' | 'dayOff' | 'shortened';

type DayTypeReason = 'holiday' | 'transfer' | 'preholiday' ;

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

type Weekday = typeof WEEKDAYS[number];;

interface HolydayMeta {
  reason: Extract<DayTypeReason, 'holiday'>;
  holidayName: string;
  transferredTo?: string;
  weekday?: Weekday;
}

interface PreholidayMeta {
  reason: Extract<DayTypeReason, 'preholiday'>;
  holidayName: string;
  transferredTo?: string;
  weekday?: Weekday;
}

type NonHolidayMeta = {
  reason?: Extract<DayTypeReason, 'transfer'>;
  holidayName?: string;
  weekday?: Weekday;
} & ({ transferredTo?: string } | { transferredFrom?: string });



export type Day = { date: string } & (
  | {
      type: Extract<DayType, 'dayOff'>;
      meta?: (NonHolidayMeta | HolydayMeta) | never;
    }
  | {
      type: Extract<DayType, 'shortened'>;
      meta?: PreholidayMeta | never;
    }
  | {
      type: Extract<DayType, 'working'>;
      meta?: NonHolidayMeta | never;
    }
);

export interface DayOffTransfer {
  originalDate: string;
  newDate: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
