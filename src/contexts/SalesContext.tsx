
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
  createSale: (saleData: Omit<Sale, 'id' | 'createdAt'>) => Sale | undefined;
  getSale: (id: string) => Sale | undefined;
  validateCompanyItems: (items: SaleItem[]) => { valid: boolean; errorMessage?: string };
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [gstSales, setGstSales] = useState<Sale[]>([]);
  const [nonGstSales, setNonGstSales] = useState<Sale[]>([]);
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItem[]>([]);
  
  const { currentCompany, companies } = useCompany();
  const { updateStock, items } = useInventory();

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
    // Validate company-specific rules
    if (saleItem.companyName === 'Mansan Laal and Sons' && !saleItem.gstPercentage) {
      toast.error('Mansan Laal and Sons requires GST items only');
      return;
    }
    
    if (saleItem.companyName === 'Estimate' && saleItem.gstPercentage) {
      toast.error('Estimate company only accepts Non-GST items');
      return;
    }
    
    // HSN code validation for GST items of Mansan Laal
    if (saleItem.companyName === 'Mansan Laal and Sons' && !saleItem.hsnCode) {
      toast.error('HSN Code is required for Mansan Laal and Sons items');
      return;
    }
    
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
    // Validate company-specific rules
    if (saleItem.companyName === 'Mansan Laal and Sons' && !saleItem.gstPercentage) {
      toast.error('Mansan Laal and Sons requires GST items only');
      return;
    }
    
    if (saleItem.companyName === 'Estimate' && saleItem.gstPercentage) {
      toast.error('Estimate company only accepts Non-GST items');
      return;
    }
    
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

  const validateCompanyItems = (items: SaleItem[]): { valid: boolean; errorMessage?: string } => {
    // Group items by company
    const itemsByCompany: Record<string, SaleItem[]> = {};
    
    items.forEach(item => {
      if (!itemsByCompany[item.companyId]) {
        itemsByCompany[item.companyId] = [];
      }
      itemsByCompany[item.companyId].push(item);
    });
    
    // Check each company's items
    for (const [companyId, companyItems] of Object.entries(itemsByCompany)) {
      const company = companies.find(c => c.id === companyId);
      if (!company) continue;
      
      // Special validation for Mansan Laal
      if (company.name === 'Mansan Laal and Sons') {
        // All items must be GST items
        const nonGstItems = companyItems.filter(item => !item.gstPercentage);
        if (nonGstItems.length > 0) {
          return {
            valid: false,
            errorMessage: 'Mansan Laal and Sons requires GST items only'
          };
        }
        
        // All items must have HSN code
        const missingHsnItems = companyItems.filter(item => !item.hsnCode);
        if (missingHsnItems.length > 0) {
          return {
            valid: false,
            errorMessage: 'HSN Code is required for all Mansan Laal and Sons items'
          };
        }
      }
      
      // Special validation for Estimate
      if (company.name === 'Estimate') {
        // All items must be Non-GST items
        const gstItems = companyItems.filter(item => item.gstPercentage && item.gstPercentage > 0);
        if (gstItems.length > 0) {
          return {
            valid: false,
            errorMessage: 'Estimate company only accepts Non-GST items'
          };
        }
      }
      
      // General validation - no mixing of GST and Non-GST items
      const hasGst = companyItems.some(item => item.gstPercentage && item.gstPercentage > 0);
      const allHaveGst = companyItems.every(item => item.gstPercentage && item.gstPercentage > 0);
      const noneHaveGst = companyItems.every(item => !item.gstPercentage || item.gstPercentage === 0);
      
      if (hasGst && !allHaveGst && !noneHaveGst) {
        return {
          valid: false,
          errorMessage: `${company.name} cannot have mixed GST/Non-GST items`
        };
      }
    }
    
    return { valid: true };
  };

  const createSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    if (!saleData.items || saleData.items.length === 0) {
      toast.error('No items in sale');
      return undefined;
    }
    
    // Validate company-specific rules
    const validation = validateCompanyItems(saleData.items);
    if (!validation.valid) {
      toast.error(validation.errorMessage || 'Invalid items');
      return undefined;
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
      // Pass the sales unit to updateStock for proper unit conversion
      updateStock(item.itemId, item.quantity, item.salesUnit);
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
        validateCompanyItems,
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
