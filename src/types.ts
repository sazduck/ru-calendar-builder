type CalendarType = 'working' | 'non_working' | 'shortened';

export interface DayMeta {
  holidayName?: string | undefined;

  transferedFrom?: {
    date: string;
  };

  transferedTo?: {
    date: string;
  };
}

export interface Day {
  date: string;
  type: CalendarType;
  meta?: DayMeta | undefined;
}

export interface Transfer {
  from: string;
  to: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
