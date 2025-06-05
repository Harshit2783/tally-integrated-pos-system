import {fetchStockGodownsXML} from "../utils/xmlBuilder.js";
import fs from 'fs'
import path from "path";
import {fetchStockItemPriceListXML} from "../utils/xmlBuilder.js";
import {parseStockItemPriceList} from "../utils/xmlParsingPriceList.js";
import parseStockItemGodown from "../utils/xmlParsingGodowns.js";
import {mapGodown} from "../utils/mapGodown.js";

export async function getStocks(req,res){
    //obtaining tallyURL from config file
    const config = JSON.parse(fs.readFileSync(path.resolve('./tally.config.json'),'utf-8')) 
    const tallyURL = config.connectionURL



    const godownXml = fetchStockGodownsXML(
        {
            requestType : 'Export',
            companyName : 'ManSan Raj Traders'
        }
    );

    const priceListXml = fetchStockItemPriceListXML({companyName : 'ManSan Raj Traders'})


    try{
        //making http request to tallyServer
        //price list

        const [godownResponse, priceListResponse] = await Promise.all([
            fetch(tallyURL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/xml' },
              body: godownXml
            }),
            fetch(tallyURL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/xml' },
              body: priceListXml
            })
          ]);
        

        const godownText = await godownResponse.text()
        const priceListText = await priceListResponse.text()

        const godownJSON = await parseStockItemGodown(godownText, 'ManSan Raj Traders')
        const priceListJSON = await parseStockItemPriceList(priceListText, 'ManSan Raj Traders')
        // const finalGodownJSON = JSON.stringify(godownJSON,null,2)


        // console.log(godownJSON)
        // res.send(godownJSON)
        // console.log(priceListJSON)
    
        const mergedJSON = mapGodown(godownJSON,priceListJSON);
        // console.log(mergedJSON)
        // console.log(price)
        res.json(mergedJSON)
    
        // const priceListJSON = await parseStockItemPriceList(priceListResponse.text(), 'ManSan Raj Traders')
        //final output contains item name, mrp, company name, godown name, stock qty, godown rate
        // res.status(200).send({
        //     // godowns : finalGodownJSON,
        //     stocksJSON:priceListJSON
        // })

        //we will store godowns in hashmap and 

        
    

    }

    catch(err)
    {
        console.log(`Error communicating with tally${err.message}`);
        throw err
    }


}