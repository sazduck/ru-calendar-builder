export interface ParseResult {
  year: number;
  transfers: DayOffTransfer[];
}

export type CalendarType = 'weekday' | 'weekend' | 'holiday' | 'preholiday' | 'transfer';
export type WorkMode = 'working' | 'shortened' | 'dayOff';


export type TransferDirection = 'from' | 'to';
export interface Transfer {
  date: string;
  calendarType: CalendarType;
  workMode: WorkMode;
  direction: TransferDirection;
}

export type DayInfo = {
  date: Date;
  workMode: WorkMode;
  calendarType: Extract<CalendarType, 'transfer'>;
  transferInfo: Transfer;
}| {
  date: Date;
  workMode: WorkMode;
  calendarType: Extract<CalendarType, 'holiday'>;

}

export interface DayOffTransfer {
  from: string;
  to: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
