
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

const Inventory = () => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { addItem, updateItem, deleteItem } = useInventory();

  const handleAddItem = () => {
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <Button onClick={handleAddItem} disabled={isAddingItem || !!editingItem}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {isAddingItem && (
          <ItemForm onSubmit={handleSubmit} onCancel={handleCancel} />
        )}

        {editingItem && (
          <ItemForm item={editingItem} onSubmit={handleSubmit} onCancel={handleCancel} />
        )}

        <ItemList onEdit={handleEditItem} onDelete={handleDeleteItem} />
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
