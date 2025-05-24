export function stocksXMLCleaner(parsedData){

    const itemNames = parsedData.ENVELOPE.DSPACCNAME || []
    const itemInfos = parsedData.ENVELOPE.DSPSTKINFO || []

    const stockItems = []

    for(let i=0;i<Math.min(itemNames.length,itemInfos.length);i++)
    {
        const name = itemNames[i];
        const info = itemInfos[i];

        stockItems.push({
            itemName: name?.DSPDISPNAME ?? '',
            quantity: info?.DSPSTKCL?.DSPCLQTY ?? '',
            rate: info?.DSPSTKCL?.DSPCLRATE ?? '',
            amount: info?.DSPSTKCL?.DSPCLAMTA ?? '',
            HSN : info?.DSPHSNVAL ?? '',
            GST : info?.DSPGSTVAL?.DSPGSTPERCVAL ?? '',
            MRP : info?.DSPMRPVAL ?? '',
            rateAfterGST: info?.DSPRATEAFTERGSTVAL ?? '',
            valueAfterGST: info?.DSPVALAFTERGST ?? ''
    });
    

    }

    console.log(stockItems);
    return stockItems;
    
}