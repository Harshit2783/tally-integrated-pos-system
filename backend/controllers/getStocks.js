import { buildTallyXML } from "../utils/xmlBuilder.js";
import { parseTallyXMLtoJSON } from "../utils/xmlParser.js";
import fetch from "node-fetch";
import fs from 'fs'
import path from "path";
import { stocksXMLCleaner } from "../utils/stocksXMLCleaner.js";

export async function getStocks(){
    //build xml for making http request to tally
    const config = JSON.parse(fs.readFileSync(path.resolve('./tally.config.json'),'utf-8')) 
    const tallyURL = config.connectionURL

    const xml = buildTallyXML(
        {
            requestType : 'Export',
            reportName : 'Stock Item-Wise Summary',
            companyName : 'ManSan Raj Traders'
        }
    );

    try{
        //making http request to tallyServer
        const result = await fetch(tallyURL,{
            method : 'POST',
            headers : {
                'Content-Type' : 'text/xml'
            },
            body : xml
        });

        const resultString = await result.text();
        const stocksJSON = await parseTallyXMLtoJSON(resultString);
        //converting into readable json to send to frontend
        const refinedItems = stocksXMLCleaner(stocksJSON);

       
     




    }

    catch(err)
    {
        console.log(`Error communicating with tally${err.message}`);
        throw err
    }


}