export const formatInventoryItemForBilling = (item: any) => {
  // Parse stock quantity with null checks
  let totalPieces = item.stockQuantityNumeric || 0;
  
  if (item.stockQuantity && typeof item.stockQuantity === 'string') {
    const stockQuantityMatch = item.stockQuantity.match(/(\d+)\s*box\s*(\d+\.?\d*)\s*pcs/);
    if (stockQuantityMatch) {
      totalPieces = (parseInt(stockQuantityMatch[1]) * 16) + parseFloat(stockQuantityMatch[2]);
    }
  }

  // Calculate GST amount
  const gstAmount = item.gstPercentage 
    ? (item.unitPrice * item.gstPercentage) / 100
    : 0;

  // Format the item for billing
  return {
    id: item.id,
    itemId: item.itemId,
    name: item.name,
    companyId: item.companyId,
    company: item.company,
    godownId: item.godownId,
    godown: item.godown,
    unitPrice: item.unitPrice,
    quantity: 1, // Default quantity, will be updated by user
    gstPercentage: item.gstPercentage || 0,
    gstAmount: gstAmount,
    totalPrice: item.unitPrice + gstAmount,
    totalAmount: item.unitPrice + gstAmount,
    mrp: item.mrp,
    hsnCode: item.hsn,
    type: item.type,
    salesUnit: item.salesUnit,
    availableQuantity: totalPieces,
    companyName: item.companyName || (item.company && item.company.name) || '',
  };
}; 