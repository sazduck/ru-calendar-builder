import * as v from 'valibot';
import { PravoGovDocumentResponseSchema } from './schemas';

enum DocumentTypes {
  GovermentDecree = 'fd5a8766-f6fd-4ac2-8fd9-66f414d314ac',
}
enum SingatoryAuthorityIds {
  RFGoverment = '8005d8c9-4b6d-48d3-861a-2a37e69fccb3',
}

export async function fetchEoNumber(year: number) {
  const params = new URLSearchParams();

  params.set('DocumentTypes', DocumentTypes.GovermentDecree);
  params.set('SignatoryAuthorityId', SingatoryAuthorityIds.RFGoverment);
  params.set('Name', 'О переносе выходных дней');

  const urlEndpoint = 'http://publication.pravo.gov.ru/api/Documents';
  const finalUrl = urlEndpoint + '?' + params.toString();
  const response = await fetch(finalUrl);
  if (!response.ok) {
    throw new Error('ошибка сети');
  }
  const rawJson = await response.json();

  const result = v.safeParse(PravoGovDocumentResponseSchema, rawJson);

  if (!result.success) {
    throw new Error(`невалидный ответ API: ${result.issues}`);
  }

  return result.output.items.find((i) => i.name.includes(year.toString()))
    ?.eoNumber;
}
