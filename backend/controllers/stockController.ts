import { parseXML } from "../utils/xmlParser";
import fetch from 'node-fetch'
import { generateStockSummaryXML } from "../utils/xmlTemplates/stockItem";


interface StockItem {
    Item_name : string,
    Rate : string
}

interface TallyStockItemResponse {
  ENVELOPE: {
    BODY: {
      DATA: {
        COLLECTION: {
          STOCKITEM: StockItem | StockItem[];
        };
      };
    };
  };
}



const TALLY_URI  = process.env.TALLY_URL
// const CMP_NAME = process.env.COMPANY_NAME


export async function getStockItemsForCompany(): Promise<StockItem[]> {
  const xmlRequest = generateStockSummaryXML();

  const response = await fetch(TALLY_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xmlRequest,
  });

  if (!response.ok) {
    throw new Error(`Tally responded with status ${response.status}`);
  }

  const xml = await response.text();
  const result = await parseXML<TallyStockItemResponse>(xml);

  const stockItems = result.ENVELOPE.BODY.DATA.COLLECTION.STOCKITEM;
  return Array.isArray(stockItems) ? stockItems : [stockItems];
}

