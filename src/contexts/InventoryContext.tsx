
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Item, Godown } from '../types';
import { items as mockItems, godowns as mockGodowns, generateId } from '../data/mockData';
import { useCompany } from './CompanyContext';
import { toast } from 'sonner';

interface InventoryContextType {
  items: Item[];
  godowns: Godown[];
  filteredItems: Item[];
  filteredGodowns: Godown[];
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => void;
  updateItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  addGodown: (godown: Omit<Godown, 'id' | 'createdAt'>) => void;
  updateGodown: (godown: Godown) => void;
  deleteGodown: (id: string) => void;
  updateStock: (itemId: string, quantity: number) => void;
  getItemsByCompany: (companyId: string) => Item[];
  getGodownsByCompany: (companyId: string) => Godown[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>(mockItems);
  const [godowns, setGodowns] = useState<Godown[]>(mockGodowns);
  const { currentCompany } = useCompany();
  
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [filteredGodowns, setFilteredGodowns] = useState<Godown[]>([]);

  // Filter items and godowns based on current company
  useEffect(() => {
    if (currentCompany) {
      setFilteredItems(items.filter(item => item.companyId === currentCompany.id));
      setFilteredGodowns(godowns.filter(godown => godown.companyId === currentCompany.id));
    } else {
      setFilteredItems([]);
      setFilteredGodowns([]);
    }
  }, [currentCompany, items, godowns]);

  const getItemsByCompany = (companyId: string): Item[] => {
    return items.filter(item => item.companyId === companyId);
  };

  const getGodownsByCompany = (companyId: string): Godown[] => {
    return godowns.filter(godown => godown.companyId === companyId);
  };

  const addItem = (itemData: Omit<Item, 'id' | 'createdAt'>) => {
    const newItem: Item = {
      ...itemData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    setItems((prev) => [...prev, newItem]);
    toast.success('Item added successfully');
  };

  const updateItem = (updatedItem: Item) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    toast.success('Item updated successfully');
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success('Item deleted successfully');
  };

  const addGodown = (godownData: Omit<Godown, 'id' | 'createdAt'>) => {
    const newGodown: Godown = {
      ...godownData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    setGodowns((prev) => [...prev, newGodown]);
    toast.success('Godown added successfully');
  };

  const updateGodown = (updatedGodown: Godown) => {
    setGodowns((prev) =>
      prev.map((godown) => (godown.id === updatedGodown.id ? updatedGodown : godown))
    );
    toast.success('Godown updated successfully');
  };

  const deleteGodown = (id: string) => {
    // Check if any items are associated with this godown
    const itemsWithGodown = items.filter(item => item.godownId === id);
    
    if (itemsWithGodown.length > 0) {
      toast.error('Cannot delete godown with associated items');
      return;
    }
    
    setGodowns((prev) => prev.filter((godown) => godown.id !== id));
    toast.success('Godown deleted successfully');
  };

  const updateStock = (itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newStockQuantity = item.stockQuantity - quantity;
          if (newStockQuantity < 0) {
            toast.error(`Not enough stock for ${item.name}`);
            return item;
          }
          return { ...item, stockQuantity: newStockQuantity };
        }
        return item;
      })
    );
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        godowns,
        filteredItems,
        filteredGodowns,
        addItem,
        updateItem,
        deleteItem,
        addGodown,
        updateGodown,
        deleteGodown,
        updateStock,
        getItemsByCompany,
        getGodownsByCompany,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  
  return context;
};
