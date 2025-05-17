
import React, { useState } from 'react';
import { useSales } from '../../contexts/SalesContext';
import { Sale } from '../../types';
import { useInventory } from '../../contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, ShoppingCart, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { generateTallyXML, pushToTally } from '../../utils/tallyUtils';
import { useCompany } from '../../contexts/CompanyContext';
import { toast } from 'sonner';

const SalesList: React.FC = () => {
  const { filteredSales } = useSales();
  const { filteredGodowns } = useInventory();
  const { currentCompany } = useCompany();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const godownNameMap = filteredGodowns.reduce((acc, godown) => {
    acc[godown.id] = godown.name;
    return acc;
  }, {} as Record<string, string>);

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
  };

  const handlePushToTally = async (sale: Sale) => {
    if (!currentCompany) return;
    
    try {
      const xml = generateTallyXML(sale, currentCompany);
      const result = await pushToTally(xml);
      
      if (result) {
        toast.success('Successfully pushed to Tally');
      } else {
        toast.error('Failed to push to Tally');
      }
    } catch (error) {
      console.error('Error pushing to Tally:', error);
      toast.error('Error pushing to Tally');
    }
  };

  const handlePrint = (sale: Sale) => {
    // In a real app, this would generate a printable receipt
    console.log('Printing sale:', sale);
    toast.success('Preparing bill for printing...');
  };

  if (filteredSales.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No sales found. Create a sale to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/4 bg-gray-50 p-6 flex flex-col justify-between">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
                    style={{
                      backgroundColor: sale.billType === 'GST' ? '#dbeafe' : '#dcfce7',
                      color: sale.billType === 'GST' ? '#1e40af' : '#166534',
                    }}
                  >
                    {sale.billType} Bill
                  </div>
                  <h3 className="font-semibold text-lg">{sale.billNumber}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar size={14} className="mr-1" />
                    {format(new Date(sale.date), 'dd MMM yyyy')}
                  </div>
                </div>
                
                <div className="text-lg font-bold mt-4">
                  ₹{sale.totalAmount.toFixed(2)}
                </div>
              </div>
              
              <div className="p-6 flex-1">
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h4 className="font-medium">Customer</h4>
                    <p className="text-gray-800">{sale.customerName}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Godown</h4>
                    <p className="text-gray-800">{godownNameMap[sale.godownId] || 'Unknown'}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium">Items</h4>
                  <p className="text-gray-800">
                    {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'} in total
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(sale)}
                  >
                    <FileText size={16} className="mr-1" />
                    View Details
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePushToTally(sale)}
                  >
                    <ShoppingCart size={16} className="mr-1" />
                    Push to Tally
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(sale)}
                  >
                    <Printer size={16} className="mr-1" />
                    Print Bill
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {selectedSale && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Bill Details: {selectedSale.billNumber}</h3>
            <Button variant="ghost" onClick={() => setSelectedSale(null)}>
              Close
            </Button>
          </div>
          
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Unit Price</th>
                  {selectedSale.billType === 'GST' && <th className="p-2 text-left">GST %</th>}
                  {selectedSale.billType === 'GST' && <th className="p-2 text-left">GST Amt</th>}
                  <th className="p-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">₹{item.unitPrice.toFixed(2)}</td>
                    {selectedSale.billType === 'GST' && <td className="p-2">{item.gstPercentage}%</td>}
                    {selectedSale.billType === 'GST' && <td className="p-2">₹{(item.gstAmount || 0).toFixed(2)}</td>}
                    <td className="p-2 font-medium">₹{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
                
                <tr className="border-t bg-gray-50">
                  <td colSpan={selectedSale.billType === 'GST' ? 4 : 2} className="p-2 text-right font-medium">
                    Total:
                  </td>
                  {selectedSale.billType === 'GST' && (
                    <td className="p-2 font-medium">
                      ₹{selectedSale.items.reduce((sum, item) => sum + (item.gstAmount || 0), 0).toFixed(2)}
                    </td>
                  )}
                  <td className="p-2 font-medium">
                    ₹{selectedSale.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SalesList;
