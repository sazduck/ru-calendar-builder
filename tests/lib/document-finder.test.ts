import { fetchEoNumber } from '@lib/document-finder';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('fetchEoNumber', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('возвращает номер электронного опубликования', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            eoNumber: '0001202609180037',
            hasSvg: false,
            zipFileLength: null,
            publishDateShort: '2026-09-18T00:00:00',
            complexName:
              'Постановление Правительства Российской Федерации от 17.09.2026 № 1187\n "О переносе выходных дней в 2027 году"',
            pagesCount: 1,
            pdfFileLength: 121949,
            jdRegNumber: null,
            jdRegDate: null,
            name: 'О переносе выходных дней в 2027 году',
            number: '1187',
            documentDate: '2026-09-17T00:00:00',
            signatoryAuthorityId: '8005d8c9-4b6d-48d3-861a-2a37e69fccb3',
            documentTypeId: 'fd5a8766-f6fd-4ac2-8fd9-66f414d314ac',
            title:
              'Постановление Правительства Российской Федерации от 17.09.2026 № 1187<br /> "О переносе выходных дней в 2027 году"',
            viewDate: '18.09.2026',
            id: '4784dfe1-fd3b-4ebf-9873-748f3536185b',
          },
        ],
        itemsTotalCount: 1,
        itemsPerPage: 1,
        currentPage: 1,
        pagesTotalCount: 1,
      }),
    } as Response);

    const eoNumber = await fetchEoNumber(2027);
    expect(eoNumber).toBe('0001202609180037');
  });
});
