
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
import { Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ItemListProps {
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  companyId: string;
}

const ItemList: React.FC<ItemListProps> = ({ onEdit, onDelete, companyId }) => {
  const { getItemsByCompany, godowns } = useInventory();
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  // Update items when companyId changes
  useEffect(() => {
    if (companyId) {
      const companyItems = getItemsByCompany(companyId);
      setItems(companyItems);
    } else {
      setItems([]);
    }
  }, [companyId, getItemsByCompany]);

  // Filter items when search term or items change
  useEffect(() => {
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const getGodownName = (godownId: string) => {
    const godown = godowns.find(g => g.id === godownId);
    return godown ? godown.name : 'Unknown';
  };

  return (
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
            <TableHead>Type</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>GST %</TableHead>
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
                <TableCell>{item.type}</TableCell>
                <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                <TableCell>{item.type === 'GST' ? `${item.gstPercentage}%` : 'N/A'}</TableCell>
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
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8">
                No items found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default ItemList;
