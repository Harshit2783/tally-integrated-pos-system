
import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useSales } from '../../contexts/SalesContext';
import { Item, SaleItem, Godown } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const calculateGST = (price: number, quantity: number, gstPercentage: number) => {
  return (price * quantity * gstPercentage) / 100;
};

const SaleEntryForm: React.FC = () => {
  const { companies } = useCompany();
  const { items, filteredGodowns } = useInventory();
  const { addSaleItem, currentSaleItems, removeSaleItem, createSale, clearSaleItems } = useSales();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedGodownId, setSelectedGodownId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'GST' | 'NON-GST'>('GST');
  const [salesUnit, setSalesUnit] = useState<string>('Piece');

  // Get all items, not just filtered by current company
  const allItems = items || [];

  // Group items by GST and Non-GST
  const gstItems = allItems.filter((item) => item.type === 'GST');
  const nonGstItems = allItems.filter((item) => item.type === 'NON-GST');

  // Group sale items by type
  const gstSaleItems = currentSaleItems.filter((item) => item.gstPercentage !== undefined);
  const nonGstSaleItems = currentSaleItems.filter((item) => item.gstPercentage === undefined);

  // Calculate totals
  const calculateTotals = (items: SaleItem[]) => {
    let subtotal = 0;
    let gstAmount = 0;
    let total = 0;

    items.forEach((item) => {
      subtotal += item.unitPrice * item.quantity;
      gstAmount += item.gstAmount || 0;
      total += item.totalPrice;
    });

    return { subtotal, gstAmount, total };
  };

  const gstTotals = calculateTotals(gstSaleItems);
  const nonGstTotals = calculateTotals(nonGstSaleItems);

  useEffect(() => {
    if (filteredGodowns.length > 0 && !selectedGodownId) {
      setSelectedGodownId(filteredGodowns[0].id);
    }
  }, [filteredGodowns, selectedGodownId]);

  useEffect(() => {
    if (selectedItemId) {
      const item = allItems.find((item) => item.id === selectedItemId);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
    }
  }, [selectedItemId, allItems]);

  // Get company name from companyId
  const getCompanyName = (companyId: string) => {
    const company = companies?.find(c => c.id === companyId);
    return company ? company.name : 'Unknown Company';
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

    // Get company for the selected item
    const companyName = getCompanyName(selectedItem.companyId);

    let gstAmount = 0;
    let totalPrice = selectedItem.unitPrice * quantity;

    if (selectedItem.type === 'GST' && selectedItem.gstPercentage) {
      gstAmount = calculateGST(
        selectedItem.unitPrice,
        quantity,
        selectedItem.gstPercentage
      );
      totalPrice += gstAmount;
    }

    const saleItem: SaleItem = {
      itemId: selectedItem.id,
      companyId: selectedItem.companyId,
      companyName: companyName,
      name: selectedItem.name,
      quantity,
      unitPrice: selectedItem.unitPrice,
      gstPercentage: selectedItem.type === 'GST' ? selectedItem.gstPercentage : undefined,
      gstAmount: selectedItem.type === 'GST' ? gstAmount : undefined,
      totalPrice,
      totalAmount: totalPrice,
      salesUnit: salesUnit,
    };

    addSaleItem(saleItem);
    setSelectedItemId('');
    setQuantity(1);
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

    // Group items by company
    const itemsByCompany: Record<string, SaleItem[]> = {};
    currentSaleItems.forEach(item => {
      if (!itemsByCompany[item.companyId]) {
        itemsByCompany[item.companyId] = [];
      }
      itemsByCompany[item.companyId].push(item);
    });

    // Create a separate sale for each company
    let salesCreated = 0;
    for (const [companyId, items] of Object.entries(itemsByCompany)) {
      // Further separate by GST and Non-GST if needed
      const companyGstItems = items.filter(item => item.gstPercentage !== undefined);
      const companyNonGstItems = items.filter(item => item.gstPercentage === undefined);

      if (companyGstItems.length > 0) {
        createSale({
          companyId,
          billNumber: `GST-${Date.now()}-${salesCreated}`,
          date: new Date().toISOString(),
          customerName,
          billType: 'GST',
          godownId: selectedGodownId,
          totalAmount: companyGstItems.reduce((sum, item) => sum + item.totalPrice, 0),
          items: companyGstItems
        });
        salesCreated++;
      }

      if (companyNonGstItems.length > 0) {
        createSale({
          companyId,
          billNumber: `NON-${Date.now()}-${salesCreated}`,
          date: new Date().toISOString(),
          customerName,
          billType: 'NON-GST',
          godownId: selectedGodownId,
          totalAmount: companyNonGstItems.reduce((sum, item) => sum + item.totalPrice, 0),
          items: companyNonGstItems
        });
        salesCreated++;
      }
    }

    if (salesCreated === 0) {
      toast.error('No items added to the sale');
      return;
    }

    // Reset form
    setCustomerName('');
    clearSaleItems();
  };

  const displayItems = activeTab === 'GST' ? gstItems : nonGstItems;

  return (
    <div className="space-y-6">
      {/* Customer Info Only */}
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
        </div>
      </Card>
      
      {/* Item Selection Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'GST' | 'NON-GST')}>
              <div className="p-4 border-b">
                <TabsList className="w-full">
                  <TabsTrigger value="GST" className="flex-1">GST Items</TabsTrigger>
                  <TabsTrigger value="NON-GST" className="flex-1">Non-GST Items</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="item">Select Item</Label>
                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {displayItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - ₹{item.unitPrice} 
                            {item.type === 'GST' && ` (GST: ${item.gstPercentage}%)`} 
                            - {getCompanyName(item.companyId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex">
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddItem}
                        className="ml-2"
                      >
                        <Plus size={16} className="mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                  <div>
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
                
                <div className="mb-4">
                  {selectedItem && (
                    <div className="text-xs text-gray-600">
                      <p>In stock: {selectedItem.stockQuantity} units</p>
                      <p>Unit price: ₹{selectedItem.unitPrice.toFixed(2)}</p>
                      <p>Company: {getCompanyName(selectedItem.companyId)}</p>
                    </div>
                  )}
                </div>

                {/* Current Items Table */}
                <div className="border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Item</th>
                        <th className="p-2 text-left">Company</th>
                        <th className="p-2 text-left">Qty</th>
                        <th className="p-2 text-left">Unit Price</th>
                        {activeTab === 'GST' && <th className="p-2 text-left">GST %</th>}
                        {activeTab === 'GST' && <th className="p-2 text-left">GST Amt</th>}
                        <th className="p-2 text-left">Total</th>
                        <th className="p-2 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTab === 'GST' 
                        ? gstSaleItems.map((item, index) => (
                          <tr key={`gst-${index}`} className="border-t">
                            <td className="p-2">{item.name}</td>
                            <td className="p-2">{item.companyName}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="p-2">{item.gstPercentage}%</td>
                            <td className="p-2">₹{(item.gstAmount || 0).toFixed(2)}</td>
                            <td className="p-2 font-medium">₹{item.totalPrice.toFixed(2)}</td>
                            <td className="p-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeSaleItem(currentSaleItems.indexOf(item))}
                                className="text-red-500 h-7 w-7"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))
                        : nonGstSaleItems.map((item, index) => (
                          <tr key={`non-gst-${index}`} className="border-t">
                            <td className="p-2">{item.name}</td>
                            <td className="p-2">{item.companyName}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="p-2 font-medium">₹{item.totalPrice.toFixed(2)}</td>
                            <td className="p-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeSaleItem(currentSaleItems.indexOf(item))}
                                className="text-red-500 h-7 w-7"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))
                      }
                      {(activeTab === 'GST' && gstSaleItems.length === 0) || 
                       (activeTab === 'NON-GST' && nonGstSaleItems.length === 0) ? (
                        <tr>
                          <td 
                            colSpan={activeTab === 'GST' ? 8 : 6} 
                            className="p-4 text-center text-gray-500"
                          >
                            No items added yet
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tabs>
          </Card>
        </div>
        
        {/* Summary and Actions */}
        <div>
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Bill Summary</h3>
            
            {/* Group summary by company */}
            {Object.entries(currentSaleItems.reduce((acc, item) => {
              if (!acc[item.companyId]) {
                acc[item.companyId] = {
                  companyName: item.companyName,
                  gstItems: [],
                  nonGstItems: []
                };
              }
              
              if (item.gstPercentage) {
                acc[item.companyId].gstItems.push(item);
              } else {
                acc[item.companyId].nonGstItems.push(item);
              }
              
              return acc;
            }, {} as Record<string, {companyName: string, gstItems: SaleItem[], nonGstItems: SaleItem[]}> )).map(([companyId, data]) => (
              <div key={companyId} className="mb-4 border-b pb-4">
                <h4 className="font-medium text-md text-gray-800 mb-2">{data.companyName}</h4>
                
                {data.gstItems.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-sm text-gray-600 mb-1">GST Items</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{data.gstItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST:</span>
                        <span>₹{data.gstItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>₹{data.gstItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {data.nonGstItems.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-sm text-gray-600 mb-1">Non-GST Items</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>₹{data.nonGstItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-2 mt-2">
                  <div className="flex justify-between text-md font-semibold">
                    <span>Company Total:</span>
                    <span>₹{[...data.gstItems, ...data.nonGstItems].reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {currentSaleItems.length > 0 && (
              <div className="pt-4 border-t mt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Grand Total:</span>
                  <span>₹{currentSaleItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <div className="mt-6 space-y-2">
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

export default SaleEntryForm;
