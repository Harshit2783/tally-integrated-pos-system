import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Item, SaleItem } from '../../types';
import { useCompany } from '../../contexts/CompanyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { toast } from 'sonner';
import { calculateExclusiveCost, calculateMRP, calculateGstAmount } from '../../utils/pricingUtils';

// Define sales units
const SALES_UNITS = ['Case', 'Packet', 'Piece'];

interface ItemEntryFormProps {
  onAddItem: (item: SaleItem) => void;
  companies: any[];
  items: Item[];
  filteredGodowns: any[];
}

const ItemEntryForm: React.FC<ItemEntryFormProps> = ({
  onAddItem,
  companies,
  items,
  filteredGodowns,
}) => {
  const [company,setCompany] = useState<string>('');
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedGodownId, setSelectedGodownId] = useState<string>('');
  const [salesUnit, setSalesUnit] = useState<string>('Piece');
  const [mrp, setMrp] = useState<number>(0);
  const [gstRate,setGstRate] = useState<number>(0)
  const [hsnCode,setHsnCode] = useState<string>('')
  const [exclusiveCost, setExclusiveCost] = useState<number>(0);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isItemPopoverOpen, setIsItemPopoverOpen] = useState<boolean>(false);
  const [packagingDetails, setPackagingDetails] = useState<string>('');

  // Filter items based on search
  const filteredSearchItems = useMemo(() => {
    if (!searchTerm || !items || items.length === 0) {
      return items || [];
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item =>
      (item.name && item.name.toLowerCase().includes(lowerSearchTerm)) ||
      (item.itemId && item.itemId.toLowerCase().includes(lowerSearchTerm)) 
   
    );
  }, [searchTerm, items]);

  // Update item details when item selection changes
  React.useEffect(() => {
    if (items && items.length > 0) {
      const item = items.find((item) => item.name === selectedItemName);
      if (item) {
        setSelectedItem(item);
        // Set GST rate based on company and item
        // const itemGstRate = item.type === 'GST' ? (item.gstPercentage || 0) : 0;
        setGstRate(item.gstPercentage);
        setHsnCode(item.hsn);
        setCompany(item.company)
        if (item.gstPercentage > 0) {
          if (item.mrp) {
            setMrp(item.mrp);
            const calculatedExclusiveCost = calculateExclusiveCost(item.mrp, item.gstPercentage);
            setExclusiveCost(calculatedExclusiveCost);
            const calculatedGstAmount = item.mrp - calculatedExclusiveCost;
            setGstAmount(calculatedGstAmount * quantity);
          } else {
            setExclusiveCost(item.unitPrice);
            const calculatedMrp = calculateMRP(item.unitPrice, item.gstPercentage);
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
        // setGstRate(0);
        setGstAmount(0);
        // setHsnCode('');
      }
    } else {
      setSelectedItem(null);
      setMrp(0);
      setExclusiveCost(0);
      // setGstRate(0);
      setGstAmount(0);
      // setHsnCode('');
    }
  }, [selectedItemName, items, quantity]);



  // Handle MRP change
  // const handleMrpChange = (value: number) => {
  //   setMrp(value);
  //   if ( > 0) {
  //     const newExclusiveCost = calculateExclusiveCost(value, gstRate);
  //     setExclusiveCost(newExclusiveCost);
      
  //     const newGstAmount = value - newExclusiveCost;
  //     setGstAmount(newGstAmount * quantity);
  //   } else {
  //     setExclusiveCost(value);
  //     setGstAmount(0);
  //   }
  // };

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
    const baseAmount = exclusiveCost * quantity;
    const discountedBaseAmount = baseAmount - discountValue;
    let itemGstAmount = 0;
    if (gstRate > 0) {
      itemGstAmount = (discountedBaseAmount * gstRate) / 100;
    }
    const totalPrice = discountedBaseAmount + itemGstAmount;
    const itemCompany = companies?.find(c => c.id === selectedItem.companyId);
    const saleItem: SaleItem = {
      itemId: '1',
      companyId: selectedItem.companyId,
      companyName : company,
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
      onAddItem(saleItem);
      setSelectedItemName('');
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

  const getItemDisplayDetails = (item: Item) => {
    if (!item) return "";
    const company = companies.find(c => c.id === item.companyId);
    const hasBulkPrices = Array.isArray((item as any).bulkPrices) && (item as any).bulkPrices.length > 0;
    return (
      <div className="w-full">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            {item.name}
            {item.gstPercentage ? ` (GST: ${item.gstPercentage}%)` : ''} - ₹{item.unitPrice}
          </span>
          {hasBulkPrices && (
            <span className="text-xs text-blue-600 ml-2">[Bulk pricing available]</span>
          )}
        </div>
        <div className="text-xs text-gray-600">
          {item.company} | In stock: {item.stockQuantity} {item.salesUnit}
        </div>
        {hasBulkPrices && (
          <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
            {(item as any).bulkPrices.map((slab: any, idx: number) => (
              <span key={idx}>
                {slab.range}: ₹{slab.price}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
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
                  {selectedItem ? selectedItemName : "Select an item"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {/* to select item */}
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
                    {filteredSearchItems.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No items found.</div>
                    ) : (
                      filteredSearchItems.map((item) => (
                        <button
                          // key={item.id}
                          type="button"
                          className="w-full p-2 text-left hover:bg-gray-100 rounded-sm flex items-center"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedItemName(item.name);
                            setIsItemPopoverOpen(false);
                            setSearchTerm('');
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedItemName === item.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {getItemDisplayDetails(item)}
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
          {/* <div className="col-span-12 md:col-span-2">
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
          </div> */}
        </div>

        <div className="grid grid-cols-1 md:col-span-5 gap-4 mb-6">
          <div>
            <Label htmlFor="mrp">MRP</Label>
            <Input
              id="mrp"
              type="number"
              min="0"
              step="0.01"
              value={mrp}
              // onChange={(e) => handleMrpChange(parseFloat(e.target.value) || 0)}
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
            <Input
              id="gstRate"
              type="number"
              value={gstRate}
              readOnly
              className="bg-gray-50"
            />
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
            <Label htmlFor="hsnCode">HSN Code</Label>
            <Input
              id="hsnCode"
              value={hsnCode}
              readOnly
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Required for GST items</p>
          </div>
          
          <div>
            <Label htmlFor="packagingDetails">Packaging Details</Label>
            <Input
              id="packagingDetails"
              value={packagingDetails}
              onChange={(e) => setPackagingDetails(e.target.value)}
              placeholder="Optional details about packaging"
              maxLength={50}
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
              value={`₹${mrp}/${salesUnit}`}
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
              disabled={!selectedItemName || quantity <= 0}
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
        {company === 'Mansan Laal and Sons' && (
          <div className="flex items-center p-2 mb-4 text-amber-800 bg-amber-50 rounded border border-amber-200">
            <AlertCircle size={16} className="mr-2" />
            <p className="text-xs">Mansan Laal and Sons requires GST items with HSN codes only.</p>
          </div>
        )}
        
        {company === 'Estimate' && (
          <div className="flex items-center p-2 mb-4 text-blue-800 bg-blue-50 rounded border border-blue-200">
            <AlertCircle size={16} className="mr-2" />
            <p className="text-xs">Estimate company only accepts Non-GST items.</p>
          </div>
        )}
      </form>
    </Card>
  );
};

export default ItemEntryForm; 