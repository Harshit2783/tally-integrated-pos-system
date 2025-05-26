import { extractMRP } from "./extractMRP.js";

export function stocksXMLCleaner(parsedData, companyName) {
    const itemNames = parsedData.ENVELOPE.DSPACCNAME || [];
    const stockInfos = parsedData.ENVELOPE.DSPSTKINFO || [];
    const godownInfos = parsedData.ENVELOPE.SSBATCHNAME || [];



    const stockItems = [];

    

    for (let i = 0; i < itemNames.length; i++) {
        let stockIndex = i*2;
        const name = itemNames[i]?.DSPDISPNAME ?? '';
        const parsedMRP = extractMRP(name);
        const baseInfo = stockInfos[stockIndex];


        const item = {
            itemName: name,
            HSN: baseInfo?.DSPHSNVAL ?? '',
            GST: baseInfo?.DSPGSTVAL?.DSPGSTPERCVAL ?? '',
            MRP: parsedMRP,
            rate: baseInfo?.DSPSTKCL?.DSPCLRATE ?? '',
            company: companyName,
            rateAfterGST: baseInfo?.DSPRATEAFTERGSTVAL ?? '',
            totalQuantity: baseInfo?.DSPSTKCL?.DSPCLQTY ?? '',
            godown : godownInfos[i]?.SSGODOWN ?? ''
        };

        stockItems.push(item)

    //for each godown     
    }


    return stockItems;

}



