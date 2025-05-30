import React, { useState, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Item } from '../../types';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ReturnItemForm from './ReturnItemForm';
import { useCompany } from '../../contexts/CompanyContext';
import Loader from '../ui/loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ItemListProps {
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  companyId?: string;
}

interface ItemWithGodowns {
  name: string;
  company: string;
  unitPrice: number;
  mrp?: number;
  gstPercentage?: number;
  hsn?: string;
  godowns: string[];
  stockQuantity: number;
  primaryItem: Item;
}

const ItemList: React.FC<ItemListProps> = ({ onEdit, onDelete, companyId }) => {
  const { items, godowns, getAllItems } = useInventory();
  const { companies } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [groupedItems, setGroupedItems] = useState<ItemWithGodowns[]>([]);
  const [returningItem, setReturningItem] = useState<string | null>(null);
  const [selectedGodowns, setSelectedGodowns] = useState<Record<string, string>>({});

  // Update items when companyId changes
  useEffect(() => {
    let displayItems: Item[];
    
    if (companyId) {
      displayItems = items.filter(item => item.companyId === companyId);
    } else {
      displayItems = getAllItems();
    }
    setFilteredItems(displayItems);
    
    // Group items by name and collect all godowns for each item
    const grouped: Record<string, ItemWithGodowns> = {};
    
    displayItems.forEach(item => {
      const key = item.name;
      
      if (!grouped[key]) {
        grouped[key] = {
          name: item.name,
          company: item.company,
          unitPrice: item.unitPrice,
          mrp: item.mrp,
          gstPercentage: item.gstPercentage,
          hsn: item.hsn,
          godowns: item.godown ? [item.godown] : [],
          stockQuantity: item.stockQuantity,
          primaryItem: item
        };
      } else {
        // Add godown if it's not already in the list and not empty
        if (item.godown && !grouped[key].godowns.includes(item.godown)) {
          grouped[key].godowns.push(item.godown);
        }
        // Update stock quantity
        grouped[key].stockQuantity += item.stockQuantity;
      }
    });
    
    // Convert to array
    setGroupedItems(Object.values(grouped));
    
    // Initialize selected godowns
    const initialSelectedGodowns: Record<string, string> = {};
    Object.values(grouped).forEach(group => {
      if (group.godowns.length > 0) {
        initialSelectedGodowns[group.name] = group.godowns[0];
      }
    });
    setSelectedGodowns(initialSelectedGodowns);
    
  }, [companyId, items, getAllItems]);

  return (
    <>
      {returningItem ? (
        <ReturnItemForm 
          onCancel={() => setReturningItem(null)}
          preselectedItemId={returningItem}
          preselectedCompanyId={companyId}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex gap-2">
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
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
              {groupedItems.length > 0 ? (
                groupedItems.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.company}</TableCell>
                    <TableCell>₹{item.unitPrice}</TableCell>
                    <TableCell>{item.mrp}</TableCell>
                    <TableCell>{item.gstPercentage || 'N/A'}</TableCell>
                    <TableCell>{item.hsn}</TableCell>
                    <TableCell>
                      {item.godowns.length > 0 ? (
                        <Select 
                          value={selectedGodowns[item.name] || ''}
                          onValueChange={(value) => {
                            setSelectedGodowns(prev => ({
                              ...prev,
                              [item.name]: value
                            }));
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select godown" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.godowns.map((godown) => (
                              <SelectItem key={`${item.name}-${godown}`} value={godown}>
                                {godown}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-gray-500">No godown assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{item.stockQuantity}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                      <Loader />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
};

export default ItemList;
