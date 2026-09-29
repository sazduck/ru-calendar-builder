export interface ParseResult {
  year: number;
  transfers: DayOffTransfer[];
}

export interface HolydayMeta {
  reason: 'holiday';
  holidayName: string;
  transferredTo?: string;
}

export interface PreholidayMeta {
  reason: 'preholiday';
  holidayName: string;
  transferredTo?: string;
}

export type TransferMeta =
  | { reason: 'transfer'; transferredTo: string; holidayName?: string }
  | { reason: 'transfer'; transferredFrom: string; holidayName?: string };

export type Day = { date: string } & (
  | {
      type: 'dayOff';
      meta?: TransferMeta | HolydayMeta;
    }
  | {
      type: 'shortened';
      meta: PreholidayMeta | TransferMeta;
    }
  | {
      type: 'working';
      meta?: TransferMeta;
    }
);

export type TransferDirection = 'from' | 'to';
export type TrasnferType = 'holiday' | 'weekend' | 'preholiday' | 'working';
export interface Transfer {
  date: string;
  type: TrasnferType;
  holidayName?: string | never;
  direction: TransferDirection;
};

export interface DayOffTransfer {
  from: string;
  to: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
