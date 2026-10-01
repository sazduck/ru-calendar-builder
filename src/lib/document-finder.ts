import * as v from 'valibot';
import { PravoGovDocumentResponseSchema } from "./schemas";


export async function getEoNumber(year: number) {
  const params = new URLSearchParams();

  params.set('DocumentTypes', 'fd5a8766-f6fd-4ac2-8fd9-66f414d314ac');
  params.set('SignatoryAuthorityId', '8005d8c9-4b6d-48d3-861a-2a37e69fccb3');
  params.set('Name', 'О переносе выходных дней');

  const urlEndpoint = 'http://publication.pravo.gov.ru/api/Documents';
  const finalUrl = urlEndpoint + '?' + params.toString();
  const response = await fetch(finalUrl);
  if (!response.ok) throw new Error('ошибка сети');
  const rawJson = response.json();
  const result = v.safeParse(PravoGovDocumentResponseSchema, rawJson);

  if (!result.success) {
    const firstIssue = result.issues[0];
    throw new Error(`Невалидный ответ API в поле "${firstIssue.path?.[0].key}": ${firstIssue.message}`);
  }

  const data = result.output;

  return data.items.find((i) => i.name.includes(year.toString()))?.eoNumber;
}
