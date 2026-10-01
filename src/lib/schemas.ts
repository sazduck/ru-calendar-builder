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

export type PravoGovDocumentResponse = v.InferOutput<typeof PravoGovDocumentResponseSchema>;
