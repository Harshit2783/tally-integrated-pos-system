
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sale, SaleItem } from '../types';
import { sales as mockSales, generateId, generateBillNumber } from '../data/mockData';
import { useCompany } from './CompanyContext';
import { useInventory } from './InventoryContext';
import { toast } from 'sonner';

interface SalesContextType {
  sales: Sale[];
  filteredSales: Sale[];
  gstSales: Sale[];
  nonGstSales: Sale[];
  currentSaleItems: SaleItem[];
  addSaleItem: (saleItem: SaleItem) => void;
  updateSaleItem: (index: number, saleItem: SaleItem) => void;
  removeSaleItem: (index: number) => void;
  clearSaleItems: () => void;
  createSale: (saleData: Omit<Sale, 'id' | 'createdAt'>) => void;
  getSale: (id: string) => Sale | undefined;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [gstSales, setGstSales] = useState<Sale[]>([]);
  const [nonGstSales, setNonGstSales] = useState<Sale[]>([]);
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>([]);
  
  const { currentCompany } = useCompany();
  const { updateStock } = useInventory();

  // Filter sales based on current company
  useEffect(() => {
    if (currentCompany) {
      const companySales = sales.filter(sale => sale.companyId === currentCompany.id);
      setFilteredSales(companySales);
      setGstSales(companySales.filter(sale => sale.billType === 'GST'));
      setNonGstSales(companySales.filter(sale => sale.billType === 'NON-GST'));
    } else {
      setFilteredSales([]);
      setGstSales([]);
      setNonGstSales([]);
    }
  }, [currentCompany, sales]);

  const addSaleItem = (saleItem: SaleItem) => {
    // Check if item already exists in current sale items with the same company
    const existingItemIndex = currentSaleItems.findIndex(
      item => item.itemId === saleItem.itemId && item.companyId === saleItem.companyId
    );
    
    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      const updatedItems = [...currentSaleItems];
      const existingItem = updatedItems[existingItemIndex];
      
      const newQuantity = existingItem.quantity + saleItem.quantity;
      const newTotalPrice = saleItem.unitPrice * newQuantity;
      let newGstAmount = 0;
      
      if (saleItem.gstPercentage) {
        newGstAmount = (saleItem.unitPrice * newQuantity * saleItem.gstPercentage) / 100;
      }
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        gstAmount: newGstAmount,
        totalPrice: newTotalPrice + newGstAmount,
        totalAmount: newTotalPrice + newGstAmount,
      };
      
      setCurrentSaleItems(updatedItems);
    } else {
      // Add new item
      setCurrentSaleItems(prev => [...prev, saleItem]);
    }
  };

  const updateSaleItem = (index: number, saleItem: SaleItem) => {
    const updatedItems = [...currentSaleItems];
    updatedItems[index] = saleItem;
    setCurrentSaleItems(updatedItems);
  };

  const removeSaleItem = (index: number) => {
    const updatedItems = [...currentSaleItems];
    updatedItems.splice(index, 1);
    setCurrentSaleItems(updatedItems);
  };

  const clearSaleItems = () => {
    setCurrentSaleItems([]);
  };

  const createSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    if (!saleData.items || saleData.items.length === 0) {
      toast.error('No items in sale');
      return;
    }
    
    // Calculate total amount if not provided
    const totalAmount = saleData.totalAmount || saleData.items.reduce(
      (total, item) => total + item.totalAmount,
      0
    );
    
    // Generate new sale
    const newSale: Sale = {
      ...saleData,
      id: generateId(),
      billNumber: saleData.billNumber || generateBillNumber(saleData.billType === 'GST' ? 'GST' : 'NON'),
      totalAmount,
      createdAt: new Date().toISOString(),
    };
    
    // Update stock quantities
    saleData.items.forEach(item => {
      updateStock(item.itemId, item.quantity);
    });
    
    // Add sale to list
    setSales(prev => [...prev, newSale]);
    
    toast.success('Sale created successfully');
    
    return newSale;
  };

  const getSale = (id: string) => {
    return sales.find(sale => sale.id === id);
  };

  return (
    <SalesContext.Provider
      value={{
        sales,
        filteredSales,
        gstSales,
        nonGstSales,
        currentSaleItems,
        addSaleItem,
        updateSaleItem,
        removeSaleItem,
        clearSaleItems,
        createSale,
        getSale,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = (): SalesContextType => {
  const context = useContext(SalesContext);
  
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  
  return context;
};
