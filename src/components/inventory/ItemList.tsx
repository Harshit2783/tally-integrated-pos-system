
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

interface ItemListProps {
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  companyId?: string;
}

const ItemList: React.FC<ItemListProps> = ({ onEdit, onDelete, companyId }) => {
  const { items, godowns, getAllItems } = useInventory();
  const { companies } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [returningItem, setReturningItem] = useState<string | null>(null);

  // Update items when companyId changes
  useEffect(() => {
    let displayItems: Item[];
    
    if (companyId) {
      displayItems = items.filter(item => item.companyId === companyId);
    } else {
      displayItems = getAllItems();
    }
    
    setFilteredItems(displayItems);
  }, [companyId, items, getAllItems]);

  // Filter items when search term or items change
  useEffect(() => {
    let displayItems: Item[];
    
    if (companyId) {
      displayItems = items.filter(item => item.companyId === companyId);
    } else {
      displayItems = getAllItems();
    }
    
    const filtered = displayItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCompanyName(item.companyId).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredItems(filtered);
  }, [searchTerm, items, companyId, companies, getAllItems]);

  const getGodownName = (godownId: string) => {
    const godown = godowns.find(g => g.id === godownId);
    return godown ? godown.name : 'Unknown';
  };
  
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown';
  };

  const handleReturnItem = (itemId: string) => {
    setReturningItem(itemId);
  };

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
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>GST %</TableHead>
                <TableHead>HSN Code</TableHead>
                <TableHead>Sales Unit</TableHead>
                <TableHead>Godown</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.itemId}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{getCompanyName(item.companyId)}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>{item.mrp ? `₹${item.mrp.toFixed(2)}` : 'N/A'}</TableCell>
                    <TableCell>{item.type === 'GST' ? `${item.gstPercentage}%` : 'N/A'}</TableCell>
                    <TableCell>{item.hsnCode || 'N/A'}</TableCell>
                    <TableCell>{item.salesUnit}</TableCell>
                    <TableCell>{getGodownName(item.godownId)}</TableCell>
                    <TableCell>{item.stockQuantity}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                        className="h-8 w-8"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item.id)}
                        className="h-8 w-8 text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReturnItem(item.id)}
                        className="h-8 w-8 text-blue-500"
                        title="Return Item"
                      >
                        <RotateCcw size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    No items found
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
