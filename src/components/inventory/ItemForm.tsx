
import React, { useState, useEffect } from 'react';
import { Item } from '../../types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInventory } from '../../contexts/InventoryContext';

interface ItemFormProps {
  item?: Item;
  onSubmit: (formData: Omit<Item, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  companyId: string;
}

// Define sales units
const SALES_UNITS = ['Case', 'Packet', 'Piece'];

const ItemForm: React.FC<ItemFormProps> = ({ item, onSubmit, onCancel, companyId }) => {
  const { filteredGodowns } = useInventory();

  const [formData, setFormData] = useState<Omit<Item, 'id' | 'createdAt'>>({
    companyId,
    itemId: '',
    name: '',
    type: 'GST',
    unitPrice: 0,
    gstPercentage: 18,
    godownId: '',
    stockQuantity: 0,
    salesUnit: 'Piece',
  });

  // Initialize form with item data if editing
  useEffect(() => {
    if (item) {
      setFormData({
        companyId: item.companyId,
        itemId: item.itemId,
        name: item.name,
        type: item.type,
        unitPrice: item.unitPrice,
        gstPercentage: item.gstPercentage,
        godownId: item.godownId,
        stockQuantity: item.stockQuantity,
        salesUnit: item.salesUnit || 'Piece', // Default to 'Piece' if not set
      });
    } else {
      // Reset form if not editing
      setFormData({
        companyId,
        itemId: '',
        name: '',
        type: 'GST',
        unitPrice: 0,
        gstPercentage: 18,
        godownId: filteredGodowns.length > 0 ? filteredGodowns[0].id : '',
        stockQuantity: 0,
        salesUnit: 'Piece',
      });
    }
  }, [item, companyId, filteredGodowns]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? 0 : parseFloat(value),
    }));
  };

  const handleTypeChange = (value: 'GST' | 'NON-GST') => {
    setFormData((prev) => ({
      ...prev,
      type: value,
      // Reset GST percentage if type is NON-GST
      gstPercentage: value === 'NON-GST' ? undefined : prev.gstPercentage || 18,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {item ? 'Edit Item' : 'Add New Item'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemId">Item ID</Label>
            <Input
              id="itemId"
              name="itemId"
              value={formData.itemId}
              onChange={handleChange}
              placeholder="Enter item ID"
              required
            />
          </div>

          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter item name"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Item Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'GST' | 'NON-GST') => handleTypeChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GST">GST</SelectItem>
                <SelectItem value="NON-GST">NON-GST</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="unitPrice">Unit Price</Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitPrice}
              onChange={handleChange}
              required
            />
          </div>

          {formData.type === 'GST' && (
            <div>
              <Label htmlFor="gstPercentage">GST Percentage (%)</Label>
              <Input
                id="gstPercentage"
                name="gstPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.gstPercentage || ''}
                onChange={handleChange}
                required={formData.type === 'GST'}
              />
            </div>
          )}

          <div>
            <Label htmlFor="godownId">Godown</Label>
            <Select
              value={formData.godownId}
              onValueChange={(value) => handleSelectChange('godownId', value)}
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

          <div>
            <Label htmlFor="stockQuantity">Stock Quantity</Label>
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              min="0"
              value={formData.stockQuantity}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="salesUnit">Sales Unit</Label>
            <Select
              value={formData.salesUnit}
              onValueChange={(value) => handleSelectChange('salesUnit', value as 'Case' | 'Packet' | 'Piece')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sales unit" />
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

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{item ? 'Update' : 'Save'}</Button>
        </div>
      </form>
    </Card>
  );
};

export default ItemForm;
