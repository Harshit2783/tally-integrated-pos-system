import { parseStringPromise } from 'xml2js';

export async function parseXML<T>(xml: string): Promise<T> {
  const result = await parseStringPromise(xml, {
    explicitArray: false,
    ignoreAttrs: true
  });
  return result;
}
