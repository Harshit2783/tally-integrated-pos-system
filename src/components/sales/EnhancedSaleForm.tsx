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
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';

// Define sales units
const SALES_UNITS = ['Case', 'Packet', 'Piece'];

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
  const [excludingGstRate, setExcludingGstRate] = useState<number>(0);
  const [rateWithGst, setRateWithGst] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [companyFilteredItems, setCompanyFilteredItems] = useState<Item[]>([]);

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
    setExcludingGstRate(0);
    setRateWithGst(0);
  }, [selectedCompanyId, items]);

  // Update item details when item selection changes
  useEffect(() => {
    if (selectedItemId) {
      const item = companyFilteredItems.find((item) => item.id === selectedItemId);
      
      if (item) {
        setSelectedItem(item);
        setExcludingGstRate(item.unitPrice);
        
        // Calculate rate with GST if applicable
        if (item.type === 'GST' && item.gstPercentage) {
          const gstAmount = (item.unitPrice * item.gstPercentage) / 100;
          setRateWithGst(item.unitPrice + gstAmount);
        } else {
          setRateWithGst(item.unitPrice);
        }
      } else {
        setSelectedItem(null);
        setExcludingGstRate(0);
        setRateWithGst(0);
      }
    }
  }, [selectedItemId, companyFilteredItems]);

  // Recalculate summary values when items change
  useEffect(() => {
    let subtotalValue = 0;
    let gstValue = 0;
    let discountValue = 0;

    currentSaleItems.forEach(item => {
      subtotalValue += item.unitPrice * item.quantity;
      gstValue += item.gstAmount || 0;
      // Assuming discount is stored per item in future implementations
      // discountValue += item.discount || 0;
    });

    setSubtotal(subtotalValue);
    setTotalGst(gstValue);
    setTotalDiscount(discountValue);
    setGrandTotal(subtotalValue + gstValue - discountValue);
  }, [currentSaleItems]);

  // Handle changes to the excluding GST rate
  const handleExcludingGstRateChange = (value: number) => {
    setExcludingGstRate(value);
    
    // Update rate with GST
    if (selectedItem?.type === 'GST' && selectedItem?.gstPercentage) {
      const gstAmount = (value * selectedItem.gstPercentage) / 100;
      setRateWithGst(value + gstAmount);
    } else {
      setRateWithGst(value);
    }
  };

  // Handle changes to the rate with GST
  const handleRateWithGstChange = (value: number) => {
    setRateWithGst(value);
    
    // Update excluding GST rate
    if (selectedItem?.type === 'GST' && selectedItem?.gstPercentage) {
      const factor = 1 + (selectedItem.gstPercentage / 100);
      setExcludingGstRate(value / factor);
    } else {
      setExcludingGstRate(value);
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

    const baseAmount = excludingGstRate * quantity;
    let gstAmount = 0;
    let totalPrice = baseAmount;

    if (selectedItem.type === 'GST' && selectedItem.gstPercentage) {
      gstAmount = (excludingGstRate * quantity * selectedItem.gstPercentage) / 100;
      totalPrice += gstAmount;
    }

    // Apply discount if any
    const discountAmount = (discount / 100) * baseAmount;
    const netAmount = totalPrice - discountAmount;

    const selectedCompany = getSelectedCompany();

    const saleItem: SaleItem = {
      itemId: selectedItem.id,
      companyId: selectedCompanyId,
      companyName: selectedCompany?.name || 'Unknown Company',
      name: selectedItem.name,
      quantity,
      unitPrice: excludingGstRate,
      gstPercentage: selectedItem.type === 'GST' ? selectedItem.gstPercentage : undefined,
      gstAmount: selectedItem.type === 'GST' ? gstAmount : undefined,
      totalPrice: netAmount,
      totalAmount: netAmount,
      salesUnit: salesUnit,
    };

    addSaleItem(saleItem);
    
    // Reset form fields for next item
    setSelectedItemId('');
    setSelectedItem(null);
    setQuantity(1);
    setExcludingGstRate(0);
    setRateWithGst(0);
    setDiscount(0);
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

    // Group items by company for creating bills
    const itemsByCompany = currentSaleItems.reduce<{[key: string]: SaleItem[]}>((acc, item) => {
      if (!acc[item.companyId]) {
        acc[item.companyId] = [];
      }
      acc[item.companyId].push(item);
      return acc;
    }, {});

    // Create bills for each company
    Object.entries(itemsByCompany).forEach(([companyId, items]) => {
      const company = companies.find(c => c.id === companyId);
      if (!company) return;

      const gstItems = items.filter(item => item.gstPercentage !== undefined);
      const nonGstItems = items.filter(item => item.gstPercentage === undefined);

      if (gstItems.length > 0) {
        createSale({
          companyId: company.id,
          billNumber: `GST-${Date.now()}`,
          date: new Date().toISOString(),
          customerName,
          billType: 'GST',
          godownId: selectedGodownId,
          totalAmount: gstItems.reduce((total, item) => total + item.totalAmount, 0),
          items: gstItems,
        });
      }

      if (nonGstItems.length > 0) {
        createSale({
          companyId: company.id,
          billNumber: `NON-${Date.now()}`,
          date: new Date().toISOString(),
          customerName,
          billType: 'NON-GST',
          godownId: selectedGodownId,
          totalAmount: nonGstItems.reduce((total, item) => total + item.totalAmount, 0),
          items: nonGstItems,
        });
      }
    });

    // Reset form
    setCustomerName('');
    clearSaleItems();
  };

  if (companies.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-500">No companies available. Please add a company first.</p>
      </Card>
    );
  }

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
              value={selectedItem?.unitPrice || 0}
              readOnly
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <Label htmlFor="excludingGstRate">Excl. GST Rate</Label>
            <Input
              id="excludingGstRate"
              type="number"
              min="0"
              step="0.01"
              value={excludingGstRate}
              onChange={(e) => handleExcludingGstRateChange(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label htmlFor="gstRate">GST Rate (%)</Label>
            <Input
              id="gstRate"
              type="number"
              value={selectedItem?.type === 'GST' ? selectedItem.gstPercentage || 0 : 0}
              readOnly
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <Label htmlFor="rateWithGst">Rate (with GST)</Label>
            <Input
              id="rateWithGst"
              type="number"
              min="0"
              step="0.01"
              value={rateWithGst}
              onChange={(e) => handleRateWithGstChange(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={(rateWithGst * quantity).toFixed(2)}
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
              value={`₹${rateWithGst.toFixed(2)}/${salesUnit}`}
              readOnly
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            />
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
              <TableHead>Godown</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Excl. GST Rate</TableHead>
              <TableHead>GST %</TableHead>
              <TableHead>Rate (with GST)</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Net Amount</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSaleItems.length > 0 ? (
              currentSaleItems.map((item, index) => {
                const godown = filteredGodowns.find(g => g.id === selectedGodownId);
                return (
                  <TableRow key={index}>
                    <TableCell>{item.companyName}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{godown?.name || 'N/A'}</TableCell>
                    <TableCell>{item.salesUnit}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>{item.gstPercentage || 0}%</TableCell>
                    <TableCell>
                      ₹{(item.gstPercentage ? 
                          item.unitPrice * (1 + item.gstPercentage/100) : 
                          item.unitPrice
                        ).toFixed(2)}
                    </TableCell>
                    <TableCell>₹{(item.unitPrice * item.quantity).toFixed(2)}</TableCell>
                    <TableCell>₹{item.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSaleItem(index)}
                        className="text-red-500 h-7 w-7"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                  No items added yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      {/* Summary and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Amount</Label>
                <div className="font-medium">₹{subtotal.toFixed(2)}</div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total GST</Label>
                <div className="font-medium">₹{totalGst.toFixed(2)}</div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Discount</Label>
                <div className="font-medium">₹{totalDiscount.toFixed(2)}</div>
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
                onClick={clearSaleItems}
                disabled={currentSaleItems.length === 0}
              >
                Clear All
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSaleForm;
