export function stocksXMLCleaner(parsedData, companyName) {
    const itemNames = parsedData.ENVELOPE.DSPACCNAME || [];
    const stockInfos = parsedData.ENVELOPE.DSPSTKINFO || [];
    const godownInfos = parsedData.ENVELOPE.SSBATCHNAME || [];

    const stockItems = [];

    let stockIndex = 0;

    for (let i = 0; i < itemNames.length; i++) {
        const name = itemNames[i]?.DSPDISPNAME ?? '';
        const baseInfo = stockInfos[stockIndex];

        const item = {
            itemName: name,
            HSN: baseInfo?.DSPHSNVAL ?? '',
            GST: baseInfo?.DSPGSTVAL?.DSPGSTPERCVAL ?? '',
            MRP: baseInfo?.DSPMRPVAL ?? '',
            rate: baseInfo?.DSPSTKCL?.DSPCLRATE ?? '',
            company: companyName,
            rateAfterGST: baseInfo?.DSPRATEAFTERGSTVAL ?? '',
            totalQuantity: baseInfo?.DSPSTKCL?.DSPCLQTY ?? '',
            locations: []
        };

        stockIndex++;

    //for each godown     
    while (
      stockIndex < stockInfos.length &&
      godownIndex < godownInfos.length
    ) {
      // Detect next item by checking if DSPHSNVAL exists for this stockInfo
      const isNextItem = stockInfos[stockIndex]?.DSPHSNVAL !== undefined;

      if (isNextItem) break;

      const quantity = stockInfos[stockIndex]?.DSPSTKCL?.DSPCLQTY ?? '';
      const godown = godownInfos[godownIndex]?.SSGODOWN ?? 'Unknown';

      item.locations.push({
        godown : godown,
        quantity : quantity
      });

      stockIndex++;
      godownIndex++;
    }

    stockItems.push(item);
  }

  return stockItems;
}



