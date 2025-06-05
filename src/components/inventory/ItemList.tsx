import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Item } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Input } from '@/components/ui/input';
import ReturnItemForm from './ReturnItemForm';
import Loader from '../ui/loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ItemWithGodowns {
  name: string;
  company: string;
  unitPrice: number;
  mrp?: number;
  gstPercentage?: number;
  hsn?: string;
  godowns: Array<{ name: string; quantity: string }>;
  primaryItem: Item;
}

const TableRowMemo = memo(({ 
  item, 
  selectedGodown, 
  onGodownChange, 
  getCurrentQuantity 
}: { 
  item: ItemWithGodowns;
  selectedGodown: string;
  onGodownChange: (itemName: string, godownName: string) => void;
  getCurrentQuantity: (item: ItemWithGodowns) => string;
}) => (
  <TableRow>
    <TableCell>{item.name}</TableCell>
    <TableCell>{item.company}</TableCell>
    <TableCell>₹{item.unitPrice}</TableCell>
    <TableCell>{item.mrp}</TableCell>
    <TableCell>{item.gstPercentage || 0}</TableCell>
    <TableCell>{item.hsn}</TableCell>
    <TableCell>
      {item.godowns.length > 0 ? (
        <Select
          value={selectedGodown || ''}
          onValueChange={(value) => onGodownChange(item.name, value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select godown" />
          </SelectTrigger>
          <SelectContent>
            {item.godowns.map((godown) => (
              <SelectItem key={`${item.name}-${godown.name}`} value={godown.name}>
                {godown.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="text-gray-500">No godown assigned</span>
      )}
    </TableCell>
    <TableCell>{getCurrentQuantity(item)}</TableCell>
  </TableRow>
));

TableRowMemo.displayName = 'TableRowMemo';

const ItemList: React.FC = () => {
  const { items, getAllItems, isLoading, error } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGodowns, setSelectedGodowns] = useState<Record<string, string>>({});
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoize the grouped items
  const groupedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    const allItems = getAllItems();
    const grouped: Record<string, ItemWithGodowns> = {};
    
    allItems.forEach(item => {
      if (!item?.name) return;
      
      const key = item.name;
      
      if (!grouped[key]) {
        const godownsWithQuantity = item.godown ? item.godown.map(g => ({
          name: g.name,
          quantity: g.quantity
        })) : [];

        grouped[key] = {
          name: item.name,
          company: item.company,
          unitPrice: item.unitPrice,
          mrp: item.mrp,
          gstPercentage: item.gstPercentage,
          hsn: item.hsn,
          godowns: godownsWithQuantity,
          primaryItem: item
        };
      }
    });

    return Object.values(grouped);
  }, [items, getAllItems]);

  // Initialize selected godowns
  useEffect(() => {
    if (!groupedItems.length) return;
    
    const initialSelectedGodowns: Record<string, string> = {};
    groupedItems.forEach(item => {
      if (item.godowns.length > 0) {
        initialSelectedGodowns[item.name] = item.godowns[0].name;
      }
    });
    setSelectedGodowns(initialSelectedGodowns);
  }, [groupedItems]);

  // Memoize the filtered items
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm) return groupedItems;
    
    return groupedItems.filter(item =>
      item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [groupedItems, debouncedSearchTerm]);

  // Memoize the getCurrentQuantity function
  const getCurrentQuantity = useCallback((item: ItemWithGodowns): string => {
    const selectedGodown = selectedGodowns[item.name];
    if (!selectedGodown) return '0';
    
    const godown = item.godowns.find(g => g.name === selectedGodown);
    return godown?.quantity || '0';
  }, [selectedGodowns]);

  // Memoize the handleGodownChange function
  const handleGodownChange = useCallback((itemName: string, godownName: string) => {
    setSelectedGodowns(prev => ({
      ...prev,
      [itemName]: godownName
    }));
  }, []);

  if (isLoading || !items || items.length === 0 || groupedItems.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center space-x-2 mb-4 flex-shrink-0">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card className="flex-1 min-h-0">
        <CardContent className="p-0 h-full">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Godown</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRowMemo
                      key={item.name}
                      item={item}
                      selectedGodown={selectedGodowns[item.name] || ''}
                      onGodownChange={handleGodownChange}
                      getCurrentQuantity={getCurrentQuantity}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      {groupedItems.length === 0 ? 'No items in inventory' : 'No items found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(ItemList);
