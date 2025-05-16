
import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useSales } from '../../contexts/SalesContext';
import { Item, SaleItem } from '../../types';
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
  const { currentCompany } = useCompany();
  const { filteredItems, filteredGodowns } = useInventory();
  const { addSaleItem, currentSaleItems, removeSaleItem, createSale, clearSaleItems } = useSales();

  // Form state
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedGodownId, setSelectedGodownId] = useState<string>('');
  const [salesUnit, setSalesUnit] = useState<string>('Piece');
  const [excludingGstRate, setExcludingGstRate] = useState<number>(0);
  const [rateWithGst, setRateWithGst] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // Summary calculations
  const [subtotal, setSubtotal] = useState<number>(0);
  const [totalGst, setTotalGst] = useState<number>(0);
  const [totalDiscount, setTotalDiscount] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  useEffect(() => {
    if (filteredGodowns.length > 0 && !selectedGodownId) {
      setSelectedGodownId(filteredGodowns[0].id);
    }
  }, [filteredGodowns, selectedGodownId]);

  useEffect(() => {
    if (selectedItemId) {
      const item = filteredItems.find((item) => item.id === selectedItemId);
      
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
  }, [selectedItemId, filteredItems]);

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

  const handleAddItem = () => {
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

    const saleItem: SaleItem = {
      itemId: selectedItem.id,
      name: selectedItem.name,
      quantity,
      unitPrice: excludingGstRate,
      gstPercentage: selectedItem.type === 'GST' ? selectedItem.gstPercentage : undefined,
      gstAmount: selectedItem.type === 'GST' ? gstAmount : undefined,
      totalPrice: netAmount,
      totalAmount: netAmount,
    };

    addSaleItem(saleItem);
    
    // Reset form fields for next item
    setSelectedItemId('');
    setSelectedItem(null);
    setQuantity(1);
    setExcludingGstRate(0);
    setRateWithGst(0);
    setDiscount(0);
    setSalesUnit('Piece');
  };

  const handleCreateSale = () => {
    if (!currentCompany) {
      toast.error('No company selected');
      return;
    }

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

    // Create bill based on item types
    const gstItems = currentSaleItems.filter(item => item.gstPercentage !== undefined);
    const nonGstItems = currentSaleItems.filter(item => item.gstPercentage === undefined);

    if (gstItems.length > 0) {
      createSale({
        companyId: currentCompany.id,
        billNumber: `GST-${Date.now()}`,
        date: new Date().toISOString(),
        customerName,
        billType: 'GST',
        godownId: selectedGodownId,
        totalAmount: grandTotal,
      });
    }

    if (nonGstItems.length > 0) {
      createSale({
        companyId: currentCompany.id,
        billNumber: `NON-${Date.now()}`,
        date: new Date().toISOString(),
        customerName,
        billType: 'NON-GST',
        godownId: selectedGodownId,
        totalAmount: grandTotal,
      });
    }

    // Reset form
    setCustomerName('');
    clearSaleItems();
  };

  if (!currentCompany) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-500">Please select a company first</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="md:col-span-2">
            <Label htmlFor="item">Item Name</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - ₹{item.unitPrice} {item.type === 'GST' && `(GST: ${item.gstPercentage}%)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
            <Label htmlFor="salesUnit">Sales Unit</Label>
            <Select value={salesUnit} onValueChange={setSalesUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
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
          
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={(rateWithGst * quantity).toFixed(2)}
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
          
          <div className="flex items-end">
            <Button 
              type="button" 
              onClick={handleAddItem}
              className="w-full"
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
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{godown?.name || 'N/A'}</TableCell>
                    <TableCell>{salesUnit}</TableCell>
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
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
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
