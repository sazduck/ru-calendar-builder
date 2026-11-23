import { parsePravoGovResponse } from './validators';
import type { PravoGovDocumentResponse, Result } from './types';
import { err, ok } from './helpers';

enum DocumentType {
  QueryParam = 'DocumentTypeId',
  GovermentDecree = 'fd5a8766-f6fd-4ac2-8fd9-66f414d314ac',
}

enum SingatoryAuthority {
  QueryParam = 'SignatoryAuthorityId',
  RFGoverment = '8005d8c9-4b6d-48d3-861a-2a37e69fccb3',
}

export type Validator<T> = (data: unknown) => Result<T, string>;

export async function safeFetch<T>(
  url: string,
  validate: Validator<T>,
  options?: RequestInit,
): Promise<Result<T, string>> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      return err(`Ошибка сервера: ${response.status} ${response.statusText}`);
    }

    let rawJson: unknown;
    try {
      rawJson = await response.json();
    } catch {
      return err('Сервер вернул невалидный JSON');
    }

    const result = validate(rawJson);
    if (!result.ok) {
      return err(`Ошибка валидации: ${result.error}`);
    }

    return ok(result.value);
  } catch (networkError) {
    const message =
      networkError instanceof Error ? networkError.message : 'Сетевая ошибка';
    return err(message);
  }
}

export async function fetchEoNumber(
  year: number,
): Promise<Result<string | undefined, string>> {
  const params = new URLSearchParams();

  params.set(DocumentType.QueryParam, DocumentType.GovermentDecree);
  params.set(SingatoryAuthority.QueryParam, SingatoryAuthority.RFGoverment);
  params.set('Name', `О переносе выходных дней в ${year.toString()}`);

  const urlEndpoint = 'http://publication.pravo.gov.ru/api/Documents';
  const finalUrl = `${urlEndpoint}?${params.toString()}`;

  const result = await safeFetch<PravoGovDocumentResponse>(
    finalUrl,
    parsePravoGovResponse,
  );

  if (!result.ok) {
    return result;
  }

  const eoNumber = result.value.items[0]?.eoNumber;
  return ok(eoNumber);
}
