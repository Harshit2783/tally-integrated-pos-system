
import React, { useState, useEffect } from 'react';
import { Item } from '../../types';
import { useCompany } from '../../contexts/CompanyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId } from '../../data/mockData';

interface ItemFormProps {
  item?: Item;
  onSubmit: (formData: Omit<Item, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  companyId: string;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, onSubmit, onCancel, companyId }) => {
  const { companies } = useCompany();
  const { filteredGodowns } = useInventory();

  const [formData, setFormData] = useState<Omit<Item, 'id' | 'createdAt'>>({
    companyId: companyId,
    itemId: '',
    name: '',
    type: 'GST',
    unitPrice: 0,
    gstPercentage: 18,
    godownId: '',
    stockQuantity: 0,
  });

  // Filter godowns by the selected company
  const companyGodowns = filteredGodowns.filter(godown => godown.companyId === companyId);

  useEffect(() => {
    if (item) {
      const { id, createdAt, ...rest } = item;
      setFormData(rest);
    } else {
      // Generate a new itemId for new items
      setFormData(prev => ({
        ...prev,
        itemId: `SKU${Math.floor(1000 + Math.random() * 9000)}`,
        companyId: companyId,
        godownId: companyGodowns.length > 0 ? companyGodowns[0].id : '',
      }));
    }
  }, [item, companyId, companyGodowns]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'unitPrice' || name === 'stockQuantity' || name === 'gstPercentage' 
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure the company ID is set
    const updatedFormData = {
      ...formData,
      companyId: companyId,
    };
    
    onSubmit(updatedFormData);
  };

  const selectedCompany = companies.find(c => c.id === companyId);

  if (!selectedCompany) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Please select a company first</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {item ? 'Edit Item' : 'Add New Item'} 
          <span className="text-sm font-normal ml-2 text-gray-500">
            (Company: {selectedCompany.name})
          </span>
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemId">Item ID *</Label>
              <Input
                id="itemId"
                name="itemId"
                value={formData.itemId}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Item Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GST">GST Item</SelectItem>
                  <SelectItem value="NON-GST">Non-GST Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="gstPercentage">
                GST % {formData.type === 'NON-GST' && '(not applicable)'}
              </Label>
              <Input
                id="gstPercentage"
                name="gstPercentage"
                type="number"
                min="0"
                max="28"
                value={formData.gstPercentage || 0}
                onChange={handleChange}
                disabled={formData.type === 'NON-GST'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="godownId">Godown *</Label>
              <Select 
                value={formData.godownId} 
                onValueChange={(value) => handleSelectChange('godownId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select godown" />
                </SelectTrigger>
                <SelectContent>
                  {companyGodowns.map((godown) => (
                    <SelectItem key={godown.id} value={godown.id}>
                      {godown.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {companyGodowns.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  No godowns found for this company. Please add a godown first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity *</Label>
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
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={companyGodowns.length === 0}
          >
            {item ? 'Update Item' : 'Add Item'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ItemForm;
