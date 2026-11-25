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

export interface DayOffTransfer {
  from: string;
  to: string;
}

export interface YearTransfers {
  year: number;
  transfers: DayOffTransfer[];
}

export interface WorkingReason {
  type: 'transfer';
  to: string;
}

export type ShortenedReason =
  | { type: 'preholiday'; holidayName: Holiday }
  | { type: 'transfer'; to: string };

export type DayOffReason =
  | { type: 'weekend' }
  | { type: 'holiday'; holidayName: Holiday }
  | { type: 'transfer'; from: string };

export type Reason = WorkingReason | ShortenedReason | DayOffReason;

export type Day =
  | {
      /** @format date */
      date: string;
      type: 'working';
      reason?: WorkingReason;
    }
  | {
      /** @format date */
      date: string;
      type: 'shortened';
      reason: ShortenedReason;
    }
  | {
      /** @format date */
      date: string;
      type: 'dayOff';
      reason: DayOffReason;
    };

export interface DayOffTransfer {
  /** @format date */
  from: string;
  /** @format date */
  to: string;
}

export type Result<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };

export interface DocumentItem {
  id: string;
  eoNumber: string;
  name: string;
  number: string;
  title: string;
  complexName: string;
  documentDate: string;
  publishDateShort: string;
  viewDate: string;
  pagesCount: number;
  pdfFileLength: number;
  hasSvg: boolean;
  signatoryAuthorityId: string;
  documentTypeId: string;
  zipFileLength: string | null;
  jdRegNumber: string | null;
  jdRegDate: string | null;
}

export interface PravoGovDocumentResponse {
  items: DocumentItem[];
  itemsTotalCount: number;
  itemsPerPage: number;
  currentPage: number;
  pagesTotalCount: number;
}
