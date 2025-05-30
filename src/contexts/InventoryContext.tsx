import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Item, Godown } from '../types';
import { items as mockItems, godowns as mockGodowns, generateId } from '../data/mockData';
import { useCompany } from './CompanyContext';
import { toast } from 'sonner';
import axios from '@/lib/axios';

interface InventoryContextType {
  items: Item[];
  godowns: Godown[];
  filteredItems: Item[];
  filteredGodowns: Godown[];
  getItemsByCompany: (companyId: string) => Item[];
  getGodownsByCompany: (companyId: string) => Godown[];
  updateStock: (itemId: string, quantity: number, salesUnit?: string) => void;
  getAllItems: () => Item[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  //declaring items as an empty array
  const [items, setItems] = useState<Item[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>(mockGodowns);
  const { currentCompany } = useCompany();
  
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [filteredGodowns, setFilteredGodowns] = useState<Godown[]>([]);


  //fetch items from backend
  //api calling
  useEffect(()=>{
    const cached = localStorage.getItem('items')
    if(cached)
    {
      setItems(JSON.parse(cached))
    }

    else 
    {
      fetchItems()
    }
  },[]//runs on single mount
  );  

  // Filter items and godowns based on current company
  useEffect(() => {
    if (currentCompany) {
      setFilteredItems(items.filter(item => item.companyId === currentCompany.id));
      setFilteredGodowns(godowns.filter(godown => godown.companyId === currentCompany.id));
    } else {
      // If no company is selected, show all items
      setFilteredItems(items);
      setFilteredGodowns(godowns);
    }
  }, [currentCompany, items, godowns]);

  const fetchItems = async()=>{
    try{
      const result  = await axios.post('/api/tally/stocks/fetch-items');
      
      //items obtained as array of object in result.data
      console.log(result.data);

      const mappedItems : Item[] = result.data.map((item,index : number)=>({
        id: item.id || item.itemId || `${item.itemName}-${index}`,
        name : item.itemName,
        stockQuantity : item.totalQuantity,
        unitPrice : item.rate,
        hsn : item.HSN,
        gstPercentage : item.GST,
        mrp : item.MRP,
        godown : item.godown,
        company : item.company,
        companyId: item.companyId || '',
        itemId: item.itemId || `item-${index}`,
        salesUnit: item.salesUnit || 'Piece',
        createdAt: item.createdAt || new Date().toISOString(),
        rateAfterGst : item.rateAfterGST
      }))

      setItems(mappedItems)
      localStorage.setItem('items',JSON.stringify(mappedItems))
    }
    catch(err)
    {
      console.log(err.message);
    }
  };

  const getItemsByCompany = (companyId: string): Item[] => {
    return items.filter(item => item.companyId === companyId);
  };

  const getGodownsByCompany = (companyId: string): Godown[] => {
    return godowns.filter(godown => godown.companyId === companyId);
  };
  
  const getAllItems = (): Item[] => {
    return items;
  };

  const updateStock = (itemId: string, quantity: number, salesUnit?: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          let adjustedQuantity = quantity;
          
          // If salesUnit is provided and different from the item's unit, adjust quantity accordingly
          if (salesUnit && salesUnit !== item.salesUnit) {
            // Define conversion rates between units
            const conversionRates: Record<string, Record<string, number>> = {
              'Case': {
                'Packet': 12, // 1 Case = 12 Packets
                'Piece': 144, // 1 Case = 144 Pieces
              },
              'Packet': {
                'Case': 1/12, // 1 Packet = 1/12 Cases
                'Piece': 12, // 1 Packet = 12 Pieces
              },
              'Piece': {
                'Case': 1/144, // 1 Piece = 1/144 Cases
                'Packet': 1/12, // 1 Piece = 1/12 Packets
              }
            };
            
            // Get conversion rate
            const conversionRate = conversionRates[salesUnit][item.salesUnit];
            
            // Apply conversion
            adjustedQuantity = quantity * conversionRate;
          }
          
          const newStockQuantity = item.stockQuantity - adjustedQuantity;
          
          // For return items (negative quantity), we always allow the operation
          // For sales (positive quantity), check if enough stock is available
          if (adjustedQuantity > 0 && newStockQuantity < 0) {
            toast.error(`Not enough stock for ${item.name}`);
            return item;
          }
          
          return { ...item, stockQuantity: newStockQuantity };
        }
        return item;
      })
    );
    
    // Show success message for returns (when quantity is negative)
    if (quantity < 0) {
      const item = items.find(item => item.id === itemId);
      if (item) {
        toast.success(`Stock updated for ${item.name}`);
      }
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        godowns,
        filteredItems,
        filteredGodowns,
        getItemsByCompany,
        getGodownsByCompany,
        updateStock,
        getAllItems,
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
