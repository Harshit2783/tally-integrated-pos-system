import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useSales } from '../../contexts/SalesContext';
import { Item, SaleItem, Company } from '../../types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Trash2, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { 
  calculateExclusiveCost, 
  calculateMRP, 
  calculateFinalPrice,
  validateCompanyItemsType
} from '../../utils/pricingUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PrintBillModal } from './PrintBillModal';

// Define sales units
const SALES_UNITS = ['Case', 'Packet', 'Piece'];

// Define GST rates
const GST_RATES = [5, 12, 18, 28];

const EnhancedSaleForm: React.FC = () => {
  const { companies, currentCompany } = useCompany();
  const { items, filteredItems, filteredGodowns } = useInventory();
  const { addSaleItem, currentSaleItems, removeSaleItem, createSale, clearSaleItems } = useSales();

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(currentCompany?.id || '');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedGodownId, setSelectedGodownId] = useState<string>('');
  const [salesUnit, setSalesUnit] = useState<string>('Piece');
  const [mrp, setMrp] = useState<number>(0);
  const [exclusiveCost, setExclusiveCost] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [companyFilteredItems, setCompanyFilteredItems] = useState<Item[]>([]);

  // Discount dialog state
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState<boolean>(false);
  const [discountItemIndex, setDiscountItemIndex] = useState<number>(-1);
  const [dialogDiscount, setDialogDiscount] = useState<number>(0);
  const [dialogDiscountType, setDialogDiscountType] = useState<'amount' | 'percentage'>('amount');

  // Bill modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printType, setPrintType] = useState<'single' | 'all' | 'consolidated'>('all');
  const [selectedPrintCompanyId, setSelectedPrintCompanyId] = useState<string | null>(null);
  const [createdSale, setCreatedSale] = useState<any>(null);
  const [consolidatedPreviewOpen, setConsolidatedPreviewOpen] = useState(false);

  // Summary calculations
  const [subtotal, setSubtotal] = useState<number>(0);
  const [totalGst, setTotalGst] = useState<number>(0);
  const [totalDiscount, setTotalDiscount] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  // Initialize godown selection
  useEffect(() => {
    if (filteredGodowns.length > 0 && !selectedGodownId) {
      setSelectedGodownId(filteredGodowns[0].id);
    }
  }, [filteredGodowns, selectedGodownId]);

  // Filter items by selected company
  useEffect(() => {
    if (selectedCompanyId) {
      const itemsFromCompany = items.filter(item => item.companyId === selectedCompanyId);
      setCompanyFilteredItems(itemsFromCompany);
    } else {
      setCompanyFilteredItems([]);
    }
    
    // Reset selected item when company changes
    setSelectedItemId('');
    setSelectedItem(null);
    setMrp(0);
    setExclusiveCost(0);
    setGstRate(0);
  }, [selectedCompanyId, items]);

  // Update item details when item selection changes
  useEffect(() => {
    if (selectedItemId) {
      const item = companyFilteredItems.find((item) => item.id === selectedItemId);
      
      if (item) {
        setSelectedItem(item);
        
        // Set GST rate
        const itemGstRate = item.type === 'GST' ? (item.gstPercentage || 0) : 0;
        setGstRate(itemGstRate);
        
        // For GST items, calculate exclusive cost and MRP
        if (item.type === 'GST' && itemGstRate > 0) {
          if (item.mrp) {
            // If MRP is provided, calculate exclusive cost
            setMrp(item.mrp);
            const calculatedExclusiveCost = calculateExclusiveCost(item.mrp, itemGstRate);
            setExclusiveCost(calculatedExclusiveCost);
            
            // Calculate GST amount
            const calculatedGstAmount = item.mrp - calculatedExclusiveCost;
            setGstAmount(calculatedGstAmount * quantity);
          } else {
            // If MRP is not provided, calculate it from unit price (assuming unit price is exclusive)
            setExclusiveCost(item.unitPrice);
            const calculatedMrp = calculateMRP(item.unitPrice, itemGstRate);
            setMrp(calculatedMrp);
            
            // Calculate GST amount
            const calculatedGstAmount = calculatedMrp - item.unitPrice;
            setGstAmount(calculatedGstAmount * quantity);
          }
        } else {
          // For NON-GST items, MRP is same as unit price
          setExclusiveCost(item.unitPrice);
          setMrp(item.unitPrice);
          setGstAmount(0);
        }
      } else {
        setSelectedItem(null);
        setMrp(0);
        setExclusiveCost(0);
        setGstRate(0);
        setGstAmount(0);
      }
    }
  }, [selectedItemId, companyFilteredItems, quantity]);

  // Recalculate summary values when items change
  useEffect(() => {
    let subtotalValue = 0;
    let gstValue = 0;
    let discountValue = 0;
    let grandTotalValue = 0;

    currentSaleItems.forEach(item => {
      const itemExclusiveCost = item.unitPrice * item.quantity;
      subtotalValue += itemExclusiveCost;
      gstValue += item.gstAmount || 0;
      discountValue += item.discountValue || 0;
      grandTotalValue += item.totalPrice;
    });

    setSubtotal(subtotalValue);
    setTotalGst(gstValue);
    setTotalDiscount(discountValue);
    setGrandTotal(grandTotalValue);
  }, [currentSaleItems]);

  // Update MRP when exclusive cost or GST rate changes
  useEffect(() => {
    if (gstRate > 0) {
      const calculatedMrp = calculateMRP(exclusiveCost, gstRate);
      setMrp(calculatedMrp);
      
      // Calculate GST amount for the quantity
      const calculatedGstAmount = calculatedMrp - exclusiveCost;
      setGstAmount(calculatedGstAmount * quantity);
    } else {
      // For non-GST items
      setMrp(exclusiveCost);
      setGstAmount(0);
    }
  }, [exclusiveCost, gstRate, quantity]);

  // Handle changes to the MRP
  const handleMrpChange = (value: number) => {
    setMrp(value);
    
    if (gstRate > 0) {
      // Calculate exclusive cost from MRP
      const calculatedExclusiveCost = calculateExclusiveCost(value, gstRate);
      setExclusiveCost(calculatedExclusiveCost);
      
      // Calculate GST amount
      const calculatedGstAmount = value - calculatedExclusiveCost;
      setGstAmount(calculatedGstAmount * quantity);
    } else {
      // For non-GST items, MRP is the same as exclusive cost
      setExclusiveCost(value);
    }
  };

  // Get the selected company object
  const getSelectedCompany = (): Company | undefined => {
    return companies.find(company => company.id === selectedCompanyId);
  };

  const handleAddItem = () => {
    if (!selectedCompanyId) {
      toast.error('Please select a company');
      return;
    }

    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (quantity > selectedItem.stockQuantity) {
      toast.error(`Only ${selectedItem.stockQuantity} units available in stock`);
      return;
    }

    // Calculate final price after discount and GST
    const finalPriceCalculation = calculateFinalPrice(
      exclusiveCost * quantity,
      gstRate,
      discount,
      discountType === 'percentage'
    );

    const selectedCompany = getSelectedCompany();
    if (!selectedCompany) {
      toast.error('Selected company not found');
      return;
    }

    const saleItem: SaleItem = {
      itemId: selectedItem.id,
      companyId: selectedCompanyId,
      companyName: selectedCompany.name,
      name: selectedItem.name,
      quantity,
      unitPrice: exclusiveCost, // exclusive cost per unit
      mrp: mrp, // MRP per unit
      discountValue: finalPriceCalculation.discountAmount, // total discount amount
      discountPercentage: discountType === 'percentage' ? discount : undefined,
      gstPercentage: gstRate > 0 ? gstRate : undefined,
      gstAmount: finalPriceCalculation.gstAmount, // total GST amount
      totalPrice: finalPriceCalculation.finalPrice, // final price after GST and discount
      totalAmount: finalPriceCalculation.finalPrice,
      salesUnit,
    };

    addSaleItem(saleItem);
    
    // Reset form fields for next item
    setSelectedItemId('');
    setSelectedItem(null);
    setQuantity(1);
    setMrp(0);
    setExclusiveCost(0);
    setGstRate(0);
    setGstAmount(0);
    setDiscount(0);
  };

  const openDiscountDialog = (index: number) => {
    const item = currentSaleItems[index];
    if (!item) return;

    setDiscountItemIndex(index);
    setDialogDiscount(item.discountValue || 0);
    setDialogDiscountType('amount');
    setIsDiscountDialogOpen(true);
  };

  const applyItemDiscount = () => {
    if (discountItemIndex === -1) return;
    
    const item = currentSaleItems[discountItemIndex];
    if (!item) return;

    // Validate discount amount
    if (dialogDiscount < 0) {
      toast.error('Discount cannot be negative');
      return;
    }

    // For percentage discount, ensure it's not more than 100%
    if (dialogDiscountType === 'percentage' && dialogDiscount > 100) {
      toast.error('Discount percentage cannot exceed 100%');
      return;
    }

    // For amount discount, ensure it's not more than the exclusive cost
    if (dialogDiscountType === 'amount' && dialogDiscount > (item.unitPrice * item.quantity)) {
      toast.error('Discount cannot be greater than the item cost');
      return;
    }

    // Calculate new total price with discount
    const finalPriceCalculation = calculateFinalPrice(
      item.unitPrice * item.quantity,
      item.gstPercentage || 0,
      dialogDiscount,
      dialogDiscountType === 'percentage'
    );

    // Update the item
    const updatedItem: SaleItem = {
      ...item,
      discountValue: finalPriceCalculation.discountAmount,
      discountPercentage: dialogDiscountType === 'percentage' ? dialogDiscount : undefined,
      gstAmount: finalPriceCalculation.gstAmount,
      totalPrice: finalPriceCalculation.finalPrice,
      totalAmount: finalPriceCalculation.finalPrice
    };

    // Replace the item in the list
    const updatedItems = [...currentSaleItems];
    updatedItems[discountItemIndex] = updatedItem;
    
    // Clear the current items and add the updated ones
    clearSaleItems();
    updatedItems.forEach(item => addSaleItem(item));

    // Close the dialog
    setIsDiscountDialogOpen(false);
    setDiscountItemIndex(-1);
    toast.success('Discount applied successfully');
  };

  const handleCreateSale = () => {
    if (customerName.trim() === '') {
      toast.error('Please enter customer name');
      return;
    }

    if (selectedGodownId === '') {
      toast.error('Please select a godown');
      return;
    }

    if (currentSaleItems.length === 0) {
      toast.error('No items added to the sale');
      return;
    }

    // Group items by company for validation and creating bills
    const itemsByCompany: Record<string, SaleItem[]> = currentSaleItems.reduce<Record<string, SaleItem[]>>((acc, item) => {
      if (!acc[item.companyId]) {
        acc[item.companyId] = [];
      }
      acc[item.companyId].push(item);
      return acc;
    }, {});

    // Validate: each company's items are all GST or all non-GST
    const invalidCompanies: string[] = [];
    Object.entries(itemsByCompany).forEach(([companyId, items]) => {
      // Check if all items have the same GST status (either all have GST or none have GST)
      const hasGst = items.some(item => item.gstPercentage && item.gstPercentage > 0);
      const allHaveGst = items.every(item => item.gstPercentage && item.gstPercentage > 0);
      const noneHaveGst = items.every(item => !item.gstPercentage || item.gstPercentage === 0);
      
      if (hasGst && !allHaveGst && !noneHaveGst) {
        const company = companies.find(c => c.id === companyId);
        if (company) {
          invalidCompanies.push(company.name);
        }
      }
    });

    if (invalidCompanies.length > 0) {
      toast.error(`${invalidCompanies.join(', ')} cannot have mixed GST/Non-GST items.`);
      return;
    }

    // Create bills for each company
    const createdSales: any[] = [];
    Object.entries(itemsByCompany).forEach(([companyId, items]) => {
      const company = companies.find(c => c.id === companyId);
      if (!company) return;

      // Determine bill type based on items
      const hasGst = items.some(item => item.gstPercentage && item.gstPercentage > 0);
      const billType = hasGst ? 'GST' : 'NON-GST';

      // Calculate totals for this company
      const companySubtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const companyDiscount = items.reduce((sum, item) => sum + (item.discountValue || 0), 0);
      const companyGst = items.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
      const companyTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

      // Create the sale
      const newSale = createSale({
        companyId: company.id,
        billNumber: `${billType}-${Date.now()}`,
        date: new Date().toISOString(),
        customerName,
        billType,
        godownId: selectedGodownId,
        totalAmount: companyTotal,
        totalDiscount: companyDiscount,
        totalExclusiveCost: companySubtotal,
        totalGst: companyGst,
        items,
      });
      
      // Only push to createdSales if newSale is defined
      if (newSale) {
        createdSales.push(newSale);
      }
    });
    
    if (createdSales.length > 0) {
      setCreatedSale(createdSales);
      setPrintType(createdSales.length > 1 ? 'consolidated' : 'all');
      setSelectedPrintCompanyId(null);
      setIsPrintModalOpen(true);
    }

    // Reset form
    setCustomerName('');
    clearSaleItems();
  };

  const handlePreviewConsolidatedBill = () => {
    if (currentSaleItems.length === 0) {
      toast.error('No items added to the sale');
      return;
    }
    
    setConsolidatedPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Customer and Godown Info */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="godown">Godown *</Label>
            <Select 
              value={selectedGodownId} 
              onValueChange={setSelectedGodownId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select godown" />
              </SelectTrigger>
              <SelectContent>
                {filteredGodowns.map((godown) => (
                  <SelectItem key={godown.id} value={godown.id}>
                    {godown.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      
      {/* Item Entry Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add Item</h3>
        <div className="grid grid-cols-12 gap-3 mb-4">
          {/* Company Selection - 4 columns */}
          <div className="col-span-12 md:col-span-4">
            <Label htmlFor="company">Company</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Item Selection - 5 columns */}
          <div className="col-span-12 md:col-span-5">
            <Label htmlFor="item">Item Name</Label>
            <Select 
              value={selectedItemId} 
              onValueChange={setSelectedItemId}
              disabled={!selectedCompanyId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCompanyId ? "Select an item" : "Select company first"} />
              </SelectTrigger>
              <SelectContent>
                {companyFilteredItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - ₹{item.unitPrice} {item.type === 'GST' && `(GST: ${item.gstPercentage}%)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Quantity and Unit - 3 columns */}
          <div className="col-span-6 md:col-span-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="col-span-6 md:col-span-1">
            <Label htmlFor="salesUnit">Unit</Label>
            <Select value={salesUnit} onValueChange={setSalesUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {SALES_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <Label htmlFor="mrp">MRP</Label>
            <Input
              id="mrp"
              type="number"
              min="0"
              step="0.01"
              value={mrp}
              onChange={(e) => handleMrpChange(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label htmlFor="exclusiveCost">Excl. GST Rate</Label>
            <Input
              id="exclusiveCost"
              type="number"
              min="0"
              step="0.01"
              value={exclusiveCost}
              onChange={(e) => setExclusiveCost(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label htmlFor="gstRate">GST Rate (%)</Label>
            <Select 
              value={gstRate.toString()} 
              onValueChange={(value) => setGstRate(parseInt(value))}
              disabled={selectedItem?.type !== 'GST'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select GST Rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                {GST_RATES.map((rate) => (
                  <SelectItem key={rate} value={rate.toString()}>
                    {rate}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="gstAmount">GST Amount</Label>
            <Input
              id="gstAmount"
              type="number"
              value={gstAmount.toFixed(2)}
              readOnly
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <Label htmlFor="totalAmount">Total Amount</Label>
            <Input
              id="totalAmount"
              type="number"
              value={(exclusiveCost * quantity + gstAmount).toFixed(2)}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <Label htmlFor="perUnit">Per ({salesUnit})</Label>
            <Input
              id="perUnit"
              type="text"
              value={`₹${mrp.toFixed(2)}/${salesUnit}`}
              readOnly
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <Label htmlFor="discount">Discount</Label>
            <div className="flex">
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="rounded-r-none"
              />
              <Select 
                value={discountType} 
                onValueChange={(value: 'amount' | 'percentage') => setDiscountType(value)}
              >
                <SelectTrigger className="w-20 rounded-l-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">₹</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="md:col-span-3 flex items-end">
            <Button 
              type="button" 
              onClick={handleAddItem}
              className="w-full"
              disabled={!selectedCompanyId || !selectedItemId || quantity <= 0}
            >
              <Plus size={16} className="mr-1" /> Add Item
            </Button>
          </div>
        </div>
        
        {selectedItem && (
          <div className="text-xs text-gray-600 mb-4">
            <p>In stock: {selectedItem.stockQuantity} units</p>
          </div>
        )}
      </Card>
      
      {/* Items Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">MRP</TableHead>
              <TableHead className="text-right">Excl. GST</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">GST</TableHead>
              <TableHead className="text-right">Net Amount</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSaleItems.length > 0 ? (
              currentSaleItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.companyName}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-center">{item.quantity} {item.salesUnit}</TableCell>
                  <TableCell className="text-right">₹{(item.mrp || item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    ₹{item.unitPrice.toFixed(2)} 
                    <div className="text-xs text-gray-500">
                      ₹{(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.discountValue ? (
                      <>
                        ₹{item.discountValue.toFixed(2)}
                        {item.discountPercentage && (
                          <div className="text-xs text-gray-500">
                            {item.discountPercentage}%
                          </div>
                        )}
                      </>
                    ) : (
                      '₹0.00'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.gstPercentage ? (
                      <>
                        {item.gstPercentage}%
                        <div className="text-xs text-gray-500">
                          ₹{(item.gstAmount || 0).toFixed(2)}
                        </div>
                      </>
                    ) : (
                      '0%'
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{item.totalPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDiscountDialog(index)}
                        className="h-7 w-7 text-blue-600"
                        title="Apply Discount"
                      >
                        %
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSaleItem(index)}
                        className="h-7 w-7 text-red-500"
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No items added yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      {/* Company-wise Summaries */}
      {currentSaleItems.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Company-wise Summary</h3>
          <div className="grid gap-4">
            {currentSaleItems.reduce((acc, item) => {
              if (!acc[item.companyId]) {
                acc[item.companyId] = {
                  name: item.companyName,
                  subtotal: 0,
                  discount: 0,
                  gst: 0,
                  total: 0,
                };
              }
              acc[item.companyId].subtotal += item.unitPrice * item.quantity;
              acc[item.companyId].discount += item.discountValue || 0;
              acc[item.companyId].gst += item.gstAmount || 0;
              acc[item.companyId].total += item.totalPrice;
              return acc;
            }, {} as Record<string, { name: string; subtotal: number; discount: number; gst: number; total: number; }>)
            .map((company, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{company.name}</h4>
                  <span className="font-bold">₹{company.total.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Subtotal:</span> ₹{company.subtotal.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-gray-500">Discount:</span> ₹{company.discount.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-gray-500">GST:</span> ₹{company.gst.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Summary and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Amount (Excl.)</Label>
                <div className="font-medium">₹{subtotal.toFixed(2)}</div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Discount</Label>
                <div className="font-medium">₹{totalDiscount.toFixed(2)}</div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total GST</Label>
                <div className="font-medium">₹{totalGst.toFixed(2)}</div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-gray-600 font-bold">Grand Total</Label>
                <div className="font-bold text-lg">₹{grandTotal.toFixed(2)}</div>
              </div>
            </div>
          </Card>
        </div>
        
        <div>
          <Card className="p-6">
            <div className="space-y-4">
              <Button 
                className="w-full"
                size="lg"
                disabled={currentSaleItems.length === 0 || !customerName || !selectedGodownId}
                onClick={handleCreateSale}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Bill
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handlePreviewConsolidatedBill}
                disabled={currentSaleItems.length === 0 || currentSaleItems.length === 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                Preview Final Bill
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={clearSaleItems}
                disabled={currentSaleItems.length === 0}
              >
                Clear All
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Discount Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discountValue">Discount Value</Label>
              <div className="flex">
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={dialogDiscount}
                  onChange={(e) => setDialogDiscount(parseFloat(e.target.value) || 0)}
                  className="rounded-r-none"
                />
                <RadioGroup 
                  value={dialogDiscountType} 
                  onValueChange={(value: 'amount' | 'percentage') => setDialogDiscountType(value as any)}
                  className="flex items-center border rounded-l-none border-l-0 p-2"
                >
                  <div className="flex items-center space-x-1 mr-3">
                    <RadioGroupItem value="amount" id="amount" />
                    <Label htmlFor="amount">₹</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage">%</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyItemDiscount}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Modal */}
      {isPrintModalOpen && createdSale && (
        <PrintBillModal 
          isOpen={isPrintModalOpen} 
          onClose={() => setIsPrintModalOpen(false)} 
          sale={createdSale} 
          printType={printType}
          selectedCompanyId={selectedPrintCompanyId}
        />
      )}

      {/* Consolidated Bill Preview */}
      {consolidatedPreviewOpen && currentSaleItems.length > 0 && (
        <Dialog open={consolidatedPreviewOpen} onOpenChange={setConsolidatedPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Final Bill Preview</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto">
              <div className="p-4 border rounded">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold">Consolidated Bill</h2>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p>Customer: {customerName || "Guest"}</p>
                </div>
                
                {/* Group items by company */}
                {currentSaleItems.reduce((acc, item) => {
                  if (!acc[item.companyId]) {
                    acc[item.companyId] = {
                      name: item.companyName,
                      items: []
                    };
                  }
                  acc[item.companyId].items.push(item);
                  return acc;
                }, {} as Record<string, { name: string; items: SaleItem[] }>)
                .map((company, index) => (
                  <div key={index} className="mb-6">
                    <h3 className="font-medium text-lg mb-2">{company.name}</h3>
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="py-1 text-left">Item</th>
                          <th className="py-1 text-center">Qty</th>
                          <th className="py-1 text-right">MRP</th>
                          <th className="py-1 text-right">Disc</th>
                          <th className="py-1 text-right">Excl.</th>
                          <th className="py-1 text-right">GST</th>
                          <th className="py-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {company.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200">
                            <td className="py-1">{item.name}</td>
                            <td className="py-1 text-center">{item.quantity}</td>
                            <td className="py-1 text-right">₹{(item.mrp || item.unitPrice).toFixed(2)}</td>
                            <td className="py-1 text-right">₹{(item.discountValue || 0).toFixed(2)}</td>
                            <td className="py-1 text-right">₹{(item.unitPrice * item.quantity).toFixed(2)}</td>
                            <td className="py-1 text-right">₹{(item.gstAmount || 0).toFixed(2)}</td>
                            <td className="py-1 text-right font-medium">₹{item.totalPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="font-medium">
                          <td colSpan={6} className="py-1 text-right">Company Total:</td>
                          <td className="py-1 text-right">₹{company.total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
                
                {/* Summary */}
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-right text-sm">
                      <p>Total Quantity:</p>
                      <p>Total Excl. Cost:</p>
                      <p>Total Discount:</p>
                      <p>Total GST:</p>
                      <p>Round Off:</p>
                      <p className="font-bold">Grand Total:</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{currentSaleItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
                      <p>₹{subtotal.toFixed(2)}</p>
                      <p>₹{totalDiscount.toFixed(2)}</p>
                      <p>₹{totalGst.toFixed(2)}</p>
                      <p>₹{(Math.round(grandTotal) - grandTotal).toFixed(2)}</p>
                      <p className="font-bold">₹{Math.round(grandTotal).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-6 text-sm">
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConsolidatedPreviewOpen(false)}>Close</Button>
              <Button onClick={handleCreateSale}>
                <Printer className="mr-2 h-4 w-4" />
                Create & Print Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedSaleForm;
