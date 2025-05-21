import React, { useState, useEffect, useMemo } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useSales } from '../../contexts/SalesContext';
import { Item, SaleItem, Company } from '../../types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Trash2, Printer, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateExclusiveCost, calculateMRP } from '../../utils/pricingUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PrintBillModal } from './PrintBillModal';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDown } from 'lucide-react';
import CustomerForm from '../customers/CustomerForm';
import { useCustomers } from '../../contexts/CustomersContext';

// Define sales units
const SALES_UNITS = ['Case', 'Packet', 'Piece'];

// Define GST rates
const GST_RATES = [5, 12, 18, 28];

// HSN Codes (sample)
const HSN_CODES = [
  '0910', '1101', '1902', '2106', '3004',
  '3306', '3401', '3402', '3923', '4818',
  '6911', '7321', '8414', '8418', '8450',
  '8516', '8517', '8528', '9503'
];

// Define type for company summary
interface CompanySummary {
  id: string;
  name: string;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
}

const EnhancedSaleForm: React.FC = () => {
  const { companies } = useCompany();
  const { items, filteredItems, filteredGodowns } = useInventory();
  const { addSaleItem, currentSaleItems, removeSaleItem, createSale, clearSaleItems, validateCompanyItems, updateSaleItem: contextUpdateSaleItem } = useSales();
  const { addCustomer } = useCustomers();

  // Form state
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isItemPopoverOpen, setIsItemPopoverOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [hsnCode, setHsnCode] = useState<string>('');
  const [packagingDetails, setPackagingDetails] = useState<string>('');

  // Calculate company summaries for the bill
  const companySummaries = useMemo(() => {
    const summaries: Record<string, CompanySummary> = {};

    if (!currentSaleItems || currentSaleItems.length === 0) {
      return summaries;
    }

    currentSaleItems.forEach(item => {
      if (!summaries[item.companyId]) {
        const company = companies?.find(c => c.id === item.companyId);
        summaries[item.companyId] = {
          id: item.companyId,
          name: company ? company.name : 'Unknown Company',
          subtotal: 0,
          discount: 0,
          gst: 0,
          total: 0
        };
      }

      const summary = summaries[item.companyId];
      const baseAmount = item.unitPrice * item.quantity;
      const discountAmount = item.discountValue || 0;
      const gstAmount = item.gstAmount || 0;

      summary.subtotal += baseAmount;
      summary.discount += discountAmount;
      summary.gst += gstAmount;
      summary.total += item.totalPrice;
    });

    return summaries;
  }, [currentSaleItems, companies]);

  // Set loading state
  useEffect(() => {
    const hasCompanies = companies && companies.length > 0;
    const hasItems = items && items.length > 0;
    const hasGodowns = filteredGodowns && filteredGodowns.length > 0;
    
    setIsLoading(!(hasCompanies && hasItems && hasGodowns));
  }, [companies, items, filteredGodowns]);

  // Initialize godown selection
  useEffect(() => {
    if (filteredGodowns && filteredGodowns.length > 0 && !selectedGodownId) {
      setSelectedGodownId(filteredGodowns[0].id);
    }
  }, [filteredGodowns, selectedGodownId]);

  // Update item details when item selection changes
  useEffect(() => {
    if (selectedItemId && items && items.length > 0) {
      const item = items.find((item) => item.id === selectedItemId);
      if (item) {
        setSelectedItem(item);
        let itemGstRate = item.type === 'GST' ? (item.gstPercentage || 0) : 0;
        setGstRate(itemGstRate);
        setHsnCode(item.hsnCode || '');
        if (itemGstRate > 0) {
          if (item.mrp) {
            setMrp(item.mrp);
            const calculatedExclusiveCost = calculateExclusiveCost(item.mrp, itemGstRate);
            setExclusiveCost(calculatedExclusiveCost);
            const calculatedGstAmount = item.mrp - calculatedExclusiveCost;
            setGstAmount(calculatedGstAmount * quantity);
          } else {
            setExclusiveCost(item.unitPrice);
            const calculatedMrp = calculateMRP(item.unitPrice, itemGstRate);
            setMrp(calculatedMrp);
            const calculatedGstAmount = calculatedMrp - item.unitPrice;
            setGstAmount(calculatedGstAmount * quantity);
          }
        } else {
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
        setHsnCode('');
      }
    } else {
      setSelectedItem(null);
      setMrp(0);
      setExclusiveCost(0);
      setGstRate(0);
      setGstAmount(0);
      setHsnCode('');
    }
  }, [selectedItemId, items, quantity]);

  // Handle adding item to bill
  const handleAddItem = () => {
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    // Validate HSN code for items with GST
    if (gstRate > 0 && !hsnCode) {
      toast.error('HSN Code is required for items with GST');
      return;
    }

    // Calculate discount amount
    let discountValue = 0;
    let discountPercentage = 0;
    
    if (discount > 0) {
      if (discountType === 'amount') {
        discountValue = discount;
        discountPercentage = (discount / (exclusiveCost * quantity)) * 100;
      } else {
        discountPercentage = discount;
        discountValue = (exclusiveCost * quantity * discount) / 100;
      }
    }
    
    // Calculate GST on discounted amount
    const baseAmount = exclusiveCost * quantity;
    const discountedBaseAmount = baseAmount - discountValue;
    let itemGstAmount = 0;
    
    if (gstRate > 0) {
      itemGstAmount = (discountedBaseAmount * gstRate) / 100;
    }
    
    // Calculate total price
    const totalPrice = discountedBaseAmount + itemGstAmount;

    // Create sale item
    const company = companies?.find(c => c.id === selectedCompanyId);
    const saleItem: SaleItem = {
      itemId: selectedItem.id,
      companyId: selectedCompanyId,
      companyName: company ? company.name : 'Unknown Company',
      name: selectedItem.name,
      quantity,
      unitPrice: exclusiveCost,
      mrp: mrp,
      salesUnit,
      gstPercentage: gstRate > 0 ? gstRate : undefined,
      gstAmount: itemGstAmount,
      discountValue: discountValue > 0 ? discountValue : undefined,
      discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
      totalPrice,
      totalAmount: totalPrice,
      hsnCode: hsnCode || undefined,
      packagingDetails: packagingDetails || undefined
    };

    try {
      addSaleItem(saleItem);
      
      // Reset form fields for next item
      setSelectedItemId('');
      setSelectedItem(null);
      setQuantity(1);
      setDiscount(0);
      setSearchTerm('');
      setIsItemPopoverOpen(false);
    } catch (error) {
      toast.error('Error adding item to sale');
      console.error('Error adding item to sale:', error);
    }
  };

  // Handle create sale
  const handleCreateSale = () => {
    if (!currentSaleItems || currentSaleItems.length === 0) {
      toast.error('No items added to sale');
      return;
    }
    
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    
    if (!selectedGodownId) {
      toast.error('Please select a godown');
      return;
    }
    
    try {
      // Validate company-specific rules
      const validation = validateCompanyItems(currentSaleItems);
      if (!validation.valid) {
        toast.error(validation.errorMessage || 'Invalid items');
        return;
      }
      
      // Group items by company to create separate bills if needed
      const itemsByCompany: Record<string, SaleItem[]> = {};
      
      currentSaleItems.forEach(item => {
        if (!itemsByCompany[item.companyId]) {
          itemsByCompany[item.companyId] = [];
        }
        itemsByCompany[item.companyId].push(item);
      });
      
      // Create bills for each company
      const createdSales = [];
      
      for (const [companyId, items] of Object.entries(itemsByCompany)) {
        const company = companies?.find(c => c.id === companyId);
        const hasGst = items.some(item => item.gstPercentage && item.gstPercentage > 0);
        
        const billType = hasGst ? 'GST' : 'NON-GST';
        const billNumber = `${billType}-${Date.now()}`; // Generate a bill number
        
        const billData = {
          companyId,
          billNumber,
          date: new Date().toISOString(),
          customerName,
          billType,
          godownId: selectedGodownId,
          items,
          totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0)
        };
        
        const sale = createSale(billData);
        if (sale) {
          createdSales.push(sale);
        }
      }
      
      if (createdSales.length > 0) {
        // Set created sales for printing
        setCreatedSale(createdSales.length === 1 ? createdSales[0] : createdSales);
        
        // Ask user about printing
        setPrintType(createdSales.length === 1 ? 'single' : 'all');
        setIsPrintModalOpen(true);
        
        // Reset form
        setCustomerName('');
        clearSaleItems();
      }
    } catch (error) {
      toast.error('Error creating sale');
      console.error('Error creating sale:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <p>Loading sales form...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer and Godown Info */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2 flex items-end">
            <div className="flex-1">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                required
                disabled={showCustomerForm}
              />
            </div>
            <Button
              type="button"
              className="ml-2 mb-1"
              variant="outline"
              onClick={() => setShowCustomerForm(true)}
              disabled={showCustomerForm}
            >
              + Add Customer
            </Button>
          </div>
          <div>
            <Label htmlFor="company">Company *</Label>
            <Select 
              value={selectedCompanyId} 
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies && companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {showCustomerForm && (
          <div className="mt-6">
            <CustomerForm
              onSubmit={(newCustomer) => {
                const { id, createdAt, ...customerData } = newCustomer;
                addCustomer({
                  ...customerData,
                  companyId: selectedCompanyId || customerData.companyId || '',
                });
                setCustomerName(newCustomer.name);
                setShowCustomerForm(false);
              }}
              onCancel={() => setShowCustomerForm(false)}
            />
          </div>
        )}
      </Card>
      
      {/* Item Entry Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add Item</h3>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-12 gap-3 mb-4">
            {/* Item Selection with Search - 5 columns */}
            <div className="col-span-12 md:col-span-5">
              <Label htmlFor="item">Item Name</Label>
              <Popover open={isItemPopoverOpen} onOpenChange={setIsItemPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isItemPopoverOpen}
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsItemPopoverOpen(!isItemPopoverOpen);
                    }}
                  >
                    {selectedItem ? `${selectedItem.name} - ₹${selectedItem.unitPrice}` : "Select an item"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="p-2">
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    <div className="max-h-[300px] overflow-auto">
                      {filteredItems.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No items found.</div>
                      ) : (
                        filteredItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="w-full p-2 text-left hover:bg-gray-100 rounded-sm flex items-center"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedItem(item);
                              setSelectedItemId(item.id);
                              setIsItemPopoverOpen(false);
                              setSearchTerm('');
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedItemId === item.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {item.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
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
            <div className="col-span-12 md:col-span-2">
              <Label htmlFor="godown">Godown *</Label>
              <Select 
                value={selectedGodownId} 
                onValueChange={setSelectedGodownId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select godown" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGodowns && filteredGodowns.map((godown) => (
                    <SelectItem key={godown.id} value={godown.id}>
                      {godown.name}
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
                onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select GST Rate" />
                </SelectTrigger>
                <SelectContent>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="hsnCode">HSN Code *</Label>
              <Select 
                value={hsnCode} 
                onValueChange={setHsnCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select HSN Code" />
                </SelectTrigger>
                <SelectContent>
                  {HSN_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Required for items with GST</p>
            </div>
            
            <div>
              <Label htmlFor="packagingDetails">Packaging Details</Label>
              <Input
                id="packagingDetails"
                value={packagingDetails}
                onChange={(e) => setPackagingDetails(e.target.value)}
                placeholder="Optional details about packaging"
                maxLength={50} // Limit length to avoid overflow on thermal slip
              />
              <p className="text-xs text-gray-500 mt-1">Will appear on 2nd line in Estimate bill</p>
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
                disabled={!selectedItemId || quantity <= 0}
              >
                <Plus size={16} className="mr-1" /> Add Item
              </Button>
            </div>
          </div>
          
          {/* Item stock info */}
          {selectedItem && (
            <div className="text-xs text-gray-600 mb-4">
              <p>In stock: {selectedItem.stockQuantity} units</p>
            </div>
          )}
          
          {/* Company-specific warnings */}
          {companies && companies.map(company => {
            if (company.name === 'Mansan Laal and Sons') {
              return (
                <div key={company.id} className="flex items-center p-2 mb-4 text-amber-800 bg-amber-50 rounded border border-amber-200">
                  <AlertCircle size={16} className="mr-2" />
                  <p className="text-xs">Mansan Laal and Sons requires GST items with HSN codes only.</p>
                </div>
              );
            }
            if (company.name === 'Estimate') {
              return (
                <div key={company.id} className="flex items-center p-2 mb-4 text-blue-800 bg-blue-50 rounded border border-blue-200">
                  <AlertCircle size={16} className="mr-2" />
                  <p className="text-xs">Estimate company only accepts Non-GST items.</p>
                </div>
              );
            }
            return null;
          })}
        </form>
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
            {currentSaleItems && currentSaleItems.length > 0 ? (
              currentSaleItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.companyName}</TableCell>
                  <TableCell>
                    {item.name}
                    {item.hsnCode && (
                      <div className="text-xs text-gray-500">HSN: {item.hsnCode}</div>
                    )}
                    {item.packagingDetails && (
                      <div className="text-xs text-gray-500">{item.packagingDetails}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity} {item.salesUnit}</TableCell>
                  <TableCell className="text-right">₹{((item.mrp || item.unitPrice) || 0).toFixed(2)}</TableCell>
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
      {currentSaleItems && currentSaleItems.length > 0 && Object.keys(companySummaries).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Company-wise Summary</h3>
          <div className="grid gap-4">
            {Object.values(companySummaries).map((company, index) => (
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
                disabled={currentSaleItems.length === 0}
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
        />
      )}
    </div>
  );
};

export default EnhancedSaleForm;
