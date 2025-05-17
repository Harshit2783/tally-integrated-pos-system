
import React, { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Item } from '../../types';
import { Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useCompany } from '../../contexts/CompanyContext';

interface ItemListProps {
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => void;
  companyId: string; // Add companyId prop
}

const ItemList: React.FC<ItemListProps> = ({ onEdit, onDelete, companyId }) => {
  const { items, filteredGodowns } = useInventory();
  const { companies } = useCompany();
  
  const [search, setSearch] = useState('');
  const [filterGodown, setFilterGodown] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'GST' | 'NON-GST'>('all');

  // Filter items by the specified company
  const companyItems = items.filter(item => item.companyId === companyId);
  
  // Filter godowns by the specified company
  const companyGodowns = filteredGodowns.filter(godown => godown.companyId === companyId);
  
  const godownNameMap = companyGodowns.reduce((acc, godown) => {
    acc[godown.id] = godown.name;
    return acc;
  }, {} as Record<string, string>);

  const companyNameMap = companies.reduce((acc, company) => {
    acc[company.id] = company.name;
    return acc;
  }, {} as Record<string, string>);

  const filteredResults = companyItems.filter((item) => {
    const matchesSearch = 
      search === '' || 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.itemId.toLowerCase().includes(search.toLowerCase());
    
    const matchesGodown = filterGodown === 'all' || item.godownId === filterGodown;
    const matchesType = filterType === 'all' || item.type === filterType;
    
    return matchesSearch && matchesGodown && matchesType;
  });

  const selectedCompany = companies.find(c => c.id === companyId);

  if (companyItems.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No items found for {selectedCompany?.name || 'the selected company'}. Please add items to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filterGodown} onValueChange={setFilterGodown}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Godown" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Godowns</SelectItem>
              {companyGodowns.map((godown) => (
                <SelectItem key={godown.id} value={godown.id}>
                  {godown.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={filterType} 
            onValueChange={(value) => setFilterType(value as 'all' | 'GST' | 'NON-GST')}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="GST">GST Items</SelectItem>
              <SelectItem value="NON-GST">Non-GST Items</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-4 py-3">Item ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">GST %</th>
              <th className="px-4 py-3">Godown</th>
              <th className="px-4 py-3">Stock Qty</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((item) => (
              <tr key={item.id} className="bg-white border-b">
                <td className="px-4 py-3">{item.itemId}</td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.type === 'GST' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3">₹{item.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {item.gstPercentage ? `${item.gstPercentage}%` : '-'}
                </td>
                <td className="px-4 py-3">{godownNameMap[item.godownId] || 'Unknown'}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${
                    item.stockQuantity <= 10 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {item.stockQuantity}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
                      <Edit size={16} className="text-blue-500" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(item.id)}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemList;
