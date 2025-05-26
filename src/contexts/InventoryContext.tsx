
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Item, Godown } from '../types';
import { items as mockItems, godowns as mockGodowns, generateId } from '../data/mockData';
import { useCompany } from './CompanyContext';
import { toast } from 'sonner';
import axios from '@/lib/axios';
import { G } from '@react-pdf/renderer';

interface InventoryContextType {
  items: Item[];
  godowns: Godown[];
  // filteredItems: Item[];
  // filteredGodowns: Godown[];
  // addItem: (item: Omit<Item, 'id' | 'createdAt'>) => void;
  // updateItem: (item: Item) => void;
  // deleteItem: (id: string) => void;
  // addGodown: (godown: Omit<Godown, 'id' | 'createdAt'>) => void;
  // updateGodown: (godown: Godown) => void;
  // deleteGodown: (id: string) => void;
  // updateStock: (itemId: string, quantity: number, salesUnit?: string) => void;
  // getItemsByCompany: (companyId: string) => Item[];
  // getGodownsByCompany: (companyId: string) => Godown[];
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


    const fetchItems = async()=>{
      try{
        const result  = await axios.post('/api/tally/stocks/fetch-items');
        
        //items obtained as array of object in result.data
        console.log(result.data);

        const mappedItems : Item[] = result.data.map((item,index : number)=>({
          name : item.itemName,
          stockQuantity : item.totalQuantity,
          unitPrice : item.rate,
          hsn : item.HSN,
          gstPercentage : item.GST,
          mrp : item.MRP,
          godown : item.godown,
          company : item.company,
          rateAfterGST : item.rateAfterGST

          // HSN : item.HSN
          
        
        })
        
      )

      setItems(mappedItems)
      localStorage.setItem('items',JSON.stringify(mappedItems))

        
        

      }
      catch(err)
      {
        console.log(err.message);


      }
    };

    



  // Filter items and godowns based on current company
  // useEffect(() => {
  //   if (currentCompany) {
  //     setFilteredItems(items.filter(item => item.companyId === currentCompany.id));
  //     setFilteredGodowns(godowns.filter(godown => godown.companyId === currentCompany.id));
  //   } else {
  //     // If no company is selected, show all items
  //     setFilteredItems(items);
  //     setFilteredGodowns(godowns);
  //   }
  // }, [currentCompany, items, godowns]);

  // const getItemsByCompany = (companyId: string): Item[] => {
  //   return items.filter(item => item.companyId === companyId);
  // };

  // const getGodownsByCompany = (companyId: string): Godown[] => {
  //   return godowns.filter(godown => godown.companyId === companyId);
  // };
  
  const getAllItems = (): Item[] => {
    return items;
  };

  // const addItem = (itemData: Omit<Item, 'id' | 'createdAt'>) => {
  //   // Validate item data
  //   if (!itemData.companyId) {
  //     toast.error('Company is required for all items');
  //     return;
  //   }
    
  //   // Validate that GST items have HSN code
  //   if (itemData.type === 'GST' && !itemData.hsnCode) {
  //     toast.error('HSN Code is required for GST items');
  //     return;
  //   }
    
  //   // Validate that MRP = Excl. Cost + GST for GST items
  //   if (itemData.type === 'GST' && itemData.gstPercentage && itemData.mrp) {
  //     const calculatedMRP = itemData.unitPrice * (1 + itemData.gstPercentage / 100);
  //     if (Math.abs(calculatedMRP - itemData.mrp) > 0.01) { // Allow small rounding difference
  //       toast.error(`MRP should be equal to Excl. Cost + GST (${calculatedMRP.toFixed(2)})`);
  //       return;
  //     }
  //   }
    
  //   const newItem: Item = {
  //     ...itemData,
  //     id: generateId(),
  //     createdAt: new Date().toISOString(),
  //   };
    
  //   setItems((prev) => [...prev, newItem]);
  //   toast.success('Item added successfully');
  // };

  // const updateItem = (updatedItem: Item) => {
  //   // Validate item data
  //   if (!updatedItem.companyId) {
  //     toast.error('Company is required for all items');
  //     return;
  //   }
    
  //   // Validate that GST items have HSN code
  //   if (updatedItem.type === 'GST' && !updatedItem.hsnCode) {
  //     toast.error('HSN Code is required for GST items');
  //     return;
  //   }
    
  //   // Validate that MRP = Excl. Cost + GST for GST items
  //   if (updatedItem.type === 'GST' && updatedItem.gstPercentage && updatedItem.mrp) {
  //     const calculatedMRP = updatedItem.unitPrice * (1 + updatedItem.gstPercentage / 100);
  //     if (Math.abs(calculatedMRP - updatedItem.mrp) > 0.01) { // Allow small rounding difference
  //       toast.error(`MRP should be equal to Excl. Cost + GST (${calculatedMRP.toFixed(2)})`);
  //       return;
  //     }
  //   }
    
  //   setItems((prev) =>
  //     prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
  //   );
  //   toast.success('Item updated successfully');
  // };

  // const deleteItem = (id: string) => {
  //   setItems((prev) => prev.filter((item) => item.id !== id));
  //   toast.success('Item deleted successfully');
  // };

  // const addGodown = (godownData: Omit<Godown, 'id' | 'createdAt'>) => {
  //   const newGodown: Godown = {
  //     ...godownData,
  //     id: generateId(),
  //     createdAt: new Date().toISOString(),
  //   };
    
  //   setGodowns((prev) => [...prev, newGodown]);
  //   toast.success('Godown added successfully');
  // };

  // const updateGodown = (updatedGodown: Godown) => {
  //   setGodowns((prev) =>
  //     prev.map((godown) => (godown.id === updatedGodown.id ? updatedGodown : godown))
  //   );
  //   toast.success('Godown updated successfully');
  // };

  // const deleteGodown = (id: string) => {
  //   // Check if any items are associated with this godown
  //   const itemsWithGodown = items.filter(item => item.godownId === id);
    
  //   if (itemsWithGodown.length > 0) {
  //     toast.error('Cannot delete godown with associated items');
  //     return;
  //   }
    
  //   setGodowns((prev) => prev.filter((godown) => godown.id !== id));
  //   toast.success('Godown deleted successfully');
  // };

  // const updateStock = (itemId: string, quantity: number, salesUnit?: string) => {
  //   setItems((prev) =>
  //     prev.map((item) => {
  //       if (item.id === itemId) {
  //         let adjustedQuantity = quantity;
          
  //         // If salesUnit is provided and different from the item's unit, adjust quantity accordingly
  //         if (salesUnit && salesUnit !== item.salesUnit) {
  //           // Define conversion rates between units
  //           const conversionRates: Record<string, Record<string, number>> = {
  //             'Case': {
  //               'Packet': 12, // 1 Case = 12 Packets
  //               'Piece': 144, // 1 Case = 144 Pieces
  //             },
  //             'Packet': {
  //               'Case': 1/12, // 1 Packet = 1/12 Cases
  //               'Piece': 12, // 1 Packet = 12 Pieces
  //             },
  //             'Piece': {
  //               'Case': 1/144, // 1 Piece = 1/144 Cases
  //               'Packet': 1/12, // 1 Piece = 1/12 Packets
  //             }
  //           };
            
  //           // Get conversion rate
  //           const conversionRate = conversionRates[salesUnit][item.salesUnit];
            
  //           // Apply conversion
  //           adjustedQuantity = quantity * conversionRate;
  //         }
          
  //         const newStockQuantity = item.stockQuantity - adjustedQuantity;
          
  //         // For return items (negative quantity), we always allow the operation
  //         // For sales (positive quantity), check if enough stock is available
  //         if (adjustedQuantity > 0 && newStockQuantity < 0) {
  //           toast.error(`Not enough stock for ${item.name}`);
  //           return item;
  //         }
          
  //         return { ...item, stockQuantity: newStockQuantity };
  //       }
  //       return item;
  //     })
  //   );
    
  //   // Show success message for returns (when quantity is negative)
  //   if (quantity < 0) {
  //     const item = items.find(item => item.id === itemId);
  //     if (item) {
  //       toast.success(`Stock updated for ${item.name}`);
  //     }
  //   }
  // };

  return (
    <InventoryContext.Provider
      value={{
        items,
        godowns,
        // filteredItems,
        // filteredGodowns,
        // addItem,
        // updateItem,
        // deleteItem,
        // addGodown,
        // updateGodown,
        // deleteGodown,
        // updateStock,
        // getItemsByCompany,
        // getGodownsByCompany,
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
