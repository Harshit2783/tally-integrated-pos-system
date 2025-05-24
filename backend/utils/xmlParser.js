import { parseStringPromise } from "xml2js";

export async function parseTallyXMLtoJSON(xmlString) {
  try {
    const result = await parseStringPromise(xmlString, {
      explicitArray: false,  // avoid unnecessary arrays
      ignoreAttrs: true      // ignore XML attributes
    });
    return result;
  } catch (error) {
    console.error('XML parsing error:', error.message);
    throw new Error('Failed to parse XML');
  }
}