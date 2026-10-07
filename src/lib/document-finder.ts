import * as v from 'valibot';
import { PravoGovDocumentResponseSchema } from './schemas';
import type { Result } from './types';
import { err, ok } from './helper';

enum DocumentTypes {
  GovermentDecree = 'fd5a8766-f6fd-4ac2-8fd9-66f414d314ac',
}
enum SingatoryAuthorityIds {
  RFGoverment = '8005d8c9-4b6d-48d3-861a-2a37e69fccb3',
}

export async function safeFetch<
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(
  url: string,
  schema: TSchema,
  options?: RequestInit,
): Promise<Result<v.InferOutput<TSchema>, string>> {
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

    const result = v.safeParse(schema, rawJson);
    if (!result.success) {
      const errorMsg = result.issues.map((i) => i.message).join(', ');
      return err(`Ошибка валидации: ${errorMsg}`);
    }
    return ok(result.output);
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

  params.set('DocumentTypes', DocumentTypes.GovermentDecree);
  params.set('SignatoryAuthorityId', SingatoryAuthorityIds.RFGoverment);
  params.set('Name', 'О переносе выходных дней');

  const urlEndpoint = 'http://publication.pravo.gov.ru/api/Documents';
  const finalUrl = urlEndpoint + '?' + params.toString();
  const result = await safeFetch(finalUrl, PravoGovDocumentResponseSchema);
  if (!result.ok) {
    return result;
  }
  const eoNumber = result.value.items.find((item) =>
    item.name.includes(year.toString()),
  )?.eoNumber;

  return ok(eoNumber)
}
