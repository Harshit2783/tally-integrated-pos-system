
/**
 * Inventory Page
 * Manages product inventory with functionality to add, edit, and delete
 * items with their quantities, prices, and other relevant attributes.
 */

import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { CompanyProvider } from '../contexts/CompanyContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import ItemList from '../components/inventory/ItemList';
import ItemForm from '../components/inventory/ItemForm';
import { Item } from '../types';
import { useInventory } from '../contexts/InventoryContext';
import { PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useCompany } from '../contexts/CompanyContext';

const Inventory = () => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { addItem, updateItem, deleteItem } = useInventory();
  const { companies, currentCompany, setCurrentCompany } = useCompany();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(currentCompany?.id || '');

  const handleAddItem = () => {
    if (!selectedCompanyId) {
      return;
    }
    setIsAddingItem(true);
    setEditingItem(null);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsAddingItem(false);
  };

  const handleSubmit = (formData: Omit<Item, 'id' | 'createdAt'>) => {
    if (editingItem) {
      updateItem({
        ...editingItem,
        ...formData,
      });
    } else {
      addItem(formData);
    }
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleCancel = () => {
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem(id);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64">
              <Select 
                value={selectedCompanyId} 
                onValueChange={handleCompanyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAddItem} 
              disabled={isAddingItem || !!editingItem || !selectedCompanyId}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {!selectedCompanyId && (
          <Card className="p-6 bg-amber-50 border-amber-200">
            <p className="text-amber-800">Please select a company to manage inventory items.</p>
          </Card>
        )}

        {isAddingItem && selectedCompanyId && (
          <ItemForm 
            onSubmit={handleSubmit} 
            onCancel={handleCancel} 
            companyId={selectedCompanyId}
          />
        )}

        {editingItem && (
          <ItemForm 
            item={editingItem} 
            onSubmit={handleSubmit} 
            onCancel={handleCancel}
            companyId={editingItem.companyId}
          />
        )}

        {selectedCompanyId && (
          <ItemList 
            onEdit={handleEditItem} 
            onDelete={handleDeleteItem} 
            companyId={selectedCompanyId}
          />
        )}
      </div>
    </MainLayout>
  );
};

const InventoryPage = () => (
  <CompanyProvider>
    <InventoryProvider>
      <Inventory />
    </InventoryProvider>
  </CompanyProvider>
);

export default InventoryPage;
