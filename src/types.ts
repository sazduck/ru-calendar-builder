type DayType = 'working' | 'dayOff' | 'shortened';

export interface DayMeta {
  holidayName?: string | undefined;
  transferredFrom?: string;
  transferredTo?: string;
}

export interface Day {
  date: string;
  type: DayType;
  meta?: DayMeta | undefined;
}

export interface DayOffTransfer {
  originalDate: string;
  newDate: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
