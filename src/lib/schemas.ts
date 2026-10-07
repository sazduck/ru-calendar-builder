import * as v from 'valibot';

const DocumentItemSchema = v.object({
  id: v.string(),
  eoNumber: v.string(),
  name: v.string(),
  number: v.string(),
  title: v.string(),
  complexName: v.string(),
  documentDate: v.string(),
  publishDateShort: v.string(),
  viewDate: v.string(),
  pagesCount: v.number(),
  pdfFileLength: v.number(),
  hasSvg: v.boolean(),
  signatoryAuthorityId: v.string(),
  documentTypeId: v.string(),
  zipFileLength: v.nullable(v.string()),
  jdRegNumber: v.nullable(v.string()),
  jdRegDate: v.nullable(v.string()),
});

export const PravoGovDocumentResponseSchema = v.object({
  items: v.array(DocumentItemSchema),
  itemsTotalCount: v.number(),
  itemsPerPage: v.number(),
  currentPage: v.number(),
  pagesTotalCount: v.number(),
});

export type PravoGovDocumentResponse = v.InferOutput<
  typeof PravoGovDocumentResponseSchema
>;

export const DayOffTransferSchema = v.object({
  from: v.pipe(
    v.string(
      (issue) => `дата должна быть строкой, получено: ${issue.received}`,
    ),
    v.isoDate('дата должен быть в формате yyyy-mm-dd'),
  ),
  to: v.pipe(
    v.string(
      (issue) => `дата должна быть строкой, получено: ${issue.received}`,
    ),
    v.isoDate('дата должен быть в формате yyyy-mm-dd'),
  ),
});

export type DayOffTransfer = v.InferOutput<typeof DayOffTransferSchema>;

export const ParseResultSchema = v.object({
  year: v.pipe(
    v.number((issue) => `год должен быть числом, пришло: ${issue.received}`),
    v.minValue(2001, 'мнимальный год 2001'),
  ),
  transfers: v.array(DayOffTransferSchema, 'переносы должны быть массивом'),
});

export type ParseResult = v.InferOutput<typeof ParseResultSchema>;
export type PraseResultIssues = v.InferIssue<typeof ParseResultSchema>;
