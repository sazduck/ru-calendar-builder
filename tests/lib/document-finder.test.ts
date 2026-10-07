import * as v from 'valibot';
import { fetchEoNumber, safeFetch } from '@lib/document-finder';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

    const res = await fetchEoNumber(2027);
    if (!res.ok) {
      expect.fail('res.ok ожидался true');
    }
    expect(res.value).toBe('0001202609180037');
  });
});

describe('safeFetch', () => {
  const userSchema = v.object({
    id: v.number(),
    name: v.string(),
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('возвращает ok: true и валидные данные при успешном запросе', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: 1, name: 'John Doe' }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await safeFetch('https://example.com', userSchema);

    expect(result).toEqual({
      ok: true,
      value: { id: 1, name: 'John Doe' },
    });
  });

  it('возвращает ok: false с текстом ошибки, если сервер ответил со статусом !ok', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await safeFetch('https://example.com', userSchema);

    expect(result).toEqual({
      ok: false,
      error: 'Ошибка сервера: 404 Not Found',
    });
  });

  it('возвращает ok: false с сообщением о невалидном JSON, если response.json() выбросил ошибку', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('SyntaxError');
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await safeFetch('https://example.com', userSchema);

    expect(result).toEqual({
      ok: false,
      error: 'Сервер вернул невалидный JSON',
    });
  });

  it('возвращает ok: false со списком ошибок валидации, если данные не соответствуют схеме', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: 'not-a-number' }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await safeFetch('https://example.com', userSchema);

    if (result.ok) {
      expect.fail('ожидался ok false')
    };
    expect(result.error).toContain('Ошибка валидации:');
  });

  it('возвращает ok: false с текстом системной ошибки, если fetch упал из-за сети или CORS', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));

    const result = await safeFetch('https://example.com', userSchema);

    expect(result).toEqual({
      ok: false,
      error: 'Failed to fetch',
    });
  });

  it('возвращает ok: false с дефолтным текстом, если fetch выбросил ошибку, не являющуюся инстансом Error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Строковая ошибка сети'));

    const result = await safeFetch('https://example.com', userSchema);

    expect(result).toEqual({
      ok: false,
      error: 'Сетевая ошибка',
    });
  });

  it('возвращает корректный результат и проверяет, что переданные options прокидываются внутрь fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, name: 'Alice' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const options: RequestInit = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    await safeFetch('https://example.com', userSchema, options);

    expect(fetchMock).toHaveBeenCalledWith('https://example.com', options);
  });
});
