import React, { useState, useEffect, useMemo } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useSales } from '../../contexts/SalesContext';
import { Item, SaleItem, Company } from '../../types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Trash2, Printer, FileText, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateExclusiveCost, calculateMRP, calculateFinalPrice } from '../../utils/pricingUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PrintBillModal } from './PrintBillModal';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDown } from 'lucide-react';
import CustomerForm from '../customers/CustomerForm';
import { useCustomers } from '../../contexts/CustomersContext';
import { useAuth } from '../../contexts/AuthContext';
import CustomerInfo from './CustomerInfo';
import ItemEntryForm from './ItemEntryForm';
import SaleItemsTable from './SaleItemsTable';
import CompanySummary from './CompanySummary';
import SaleSummary from './SaleSummary';
import DiscountDialog from './DiscountDialog';

// Define sales units
const SALES_UNITS = ['Case', 'Packet', 'Piece'];

// TODO: These will be fetched from backend
// const GST_RATES = [5, 12, 18, 28];
// const HSN_CODES = [
//   '0910', '1101', '1902', '2106', '3004',
//   '3306', '3401', '3402', '3923', '4818',
//   '6911', '7321', '8414', '8418', '8450',
//   '8516', '8517', '8528', '9503'
// ];

// Define type for company summary
interface CompanySummary {
  id: string;
  name: string;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
}

const EnhancedSaleForm: React.FC = () => {
  const { companies, currentCompany, setCurrentCompany } = useCompany();
  const { items, filteredItems, filteredGodowns } = useInventory();
  const { addSaleItem, currentSaleItems, removeSaleItem, createSale, clearSaleItems, validateCompanyItems, updateSaleItem: contextUpdateSaleItem } = useSales();
  const { addCustomer } = useCustomers();
  const { currentUser } = useAuth();

  // Form state
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedGodownId, setSelectedGodownId] = useState<string>('');
  const [salesUnit, setSalesUnit] = useState<string>('Piece');
  const [mrp, setMrp] = useState<number>(0);
  const [exclusiveCost, setExclusiveCost] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isItemPopoverOpen, setIsItemPopoverOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Discount dialog state
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState<boolean>(false);
  const [discountItemIndex, setDiscountItemIndex] = useState<number>(-1);
  const [dialogDiscount, setDialogDiscount] = useState<number>(0);
  const [dialogDiscountType, setDialogDiscountType] = useState<'amount' | 'percentage'>('amount');

  // Bill modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printType, setPrintType] = useState<'single' | 'all' | 'consolidated'>('all');
  const [createdSale, setCreatedSale] = useState<any>(null);
  const [consolidatedPreviewOpen, setConsolidatedPreviewOpen] = useState(false);

  // Summary calculations
  const [subtotal, setSubtotal] = useState<number>(0);
  const [totalGst, setTotalGst] = useState<number>(0);
  const [totalDiscount, setTotalDiscount] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  // Add Customer state
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Add this near the top of the component, after state declarations:
  const itemsToShow = items;
  console.log(itemsToShow);

  // Restore hsnCode and packagingDetails state
  const [hsnCode, setHsnCode] = useState<string>('');
  const [packagingDetails, setPackagingDetails] = useState<string>('');

  // Add state for customer suggestions popover
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const { customers } = useCustomers();

  // Filter customers based on input
  const filteredCustomerSuggestions = useMemo(() => {
    if (!customerName.trim()) return [];
    const lower = customerName.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(lower));
  }, [customerName, customers]);

  // Calculate company summaries for the bill
  const companySummaries = useMemo(() => {
    const summaries: Record<string, CompanySummary> = {};

    if (!currentSaleItems || currentSaleItems.length === 0) {
      return summaries;
    }

    currentSaleItems.forEach(item => {
      if (!summaries[item.companyId]) {
        const company = companies?.find(c => c.id === item.companyId);
        summaries[item.companyId] = {
          id: item.companyId,
          name: company ? company.name : 'Unknown Company',
          subtotal: 0,
          discount: 0,
          gst: 0,
          total: 0
        };
      }

      const summary = summaries[item.companyId];
      const baseAmount = item.unitPrice * item.quantity;
      const discountAmount = item.discountValue || 0;
      const gstAmount = item.gstAmount || 0;

      summary.subtotal += baseAmount;
      summary.discount += discountAmount;
      summary.gst += gstAmount;
      summary.total += item.totalPrice;
    });

    return summaries;
  }, [currentSaleItems, companies]);

  // Update filteredSearchItems to use itemsToShow:
  const filteredSearchItems = useMemo(() => {
    if (!searchTerm || !itemsToShow || itemsToShow.length === 0) {
      return itemsToShow || [];
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return itemsToShow.filter(item =>
      (item.name && item.name.toLowerCase().includes(lowerSearchTerm)) ||
      (item.itemId && item.itemId.toLowerCase().includes(lowerSearchTerm)) ||
      (item.hsnCode && item.hsnCode.toLowerCase().includes(lowerSearchTerm))
    );
  }, [searchTerm, itemsToShow]);

  // Set loading state
  useEffect(() => {
    // const hasCompanies = companies && companies.length > 0;
    const hasItems = items && items.length > 0;
    // const hasGodowns = filteredGodowns && filteredGodowns.length > 0;
    
    setIsLoading(!(hasItems));
  }, [companies, items, filteredGodowns]);

  // Initialize godown selection
  useEffect(() => {
    if (filteredGodowns && filteredGodowns.length > 0 && !selectedGodownId) {
      setSelectedGodownId(filteredGodowns[0].id);
    }
  }, [filteredGodowns, selectedGodownId]);

  // Update item details when item selection changes
  useEffect(() => {
    if (selectedItemId && itemsToShow && itemsToShow.length > 0) {
      const item = itemsToShow.find((item) => item.id === selectedItemId);
      if (item) {
        setSelectedItem(item);
        // Set GST rate based on company and item
        const itemGstRate = item.type === 'GST' ? (item.gstPercentage || 0) : 0;
        setGstRate(itemGstRate);
        setHsnCode(item.hsnCode || '');
        if (itemGstRate > 0) {
          if (item.mrp) {
            setMrp(item.mrp);
            const calculatedExclusiveCost = calculateExclusiveCost(item.mrp, itemGstRate);
            setExclusiveCost(calculatedExclusiveCost);
            const calculatedGstAmount = item.mrp - calculatedExclusiveCost;
            setGstAmount(calculatedGstAmount * quantity);
          } else {
            setExclusiveCost(item.unitPrice);
            const calculatedMrp = calculateMRP(item.unitPrice, itemGstRate);
            setMrp(calculatedMrp);
            const calculatedGstAmount = calculatedMrp - item.unitPrice;
            setGstAmount(calculatedGstAmount * quantity);
          }
        } else {
          setExclusiveCost(item.unitPrice);
          setMrp(item.unitPrice);
          setGstAmount(0);
        }
      } else {
        setSelectedItem(null);
        setMrp(0);
        setExclusiveCost(0);
        setGstRate(0);
        setGstAmount(0);
        setHsnCode('');
      }
    } else {
      setSelectedItem(null);
      setMrp(0);
      setExclusiveCost(0);
      setGstRate(0);
      setGstAmount(0);
      setHsnCode('');
    }
  }, [selectedItemId, itemsToShow, quantity]);

  // Handle MRP change
  const handleMrpChange = (value: number) => {
    setMrp(value);
    if (gstRate > 0) {
      const newExclusiveCost = calculateExclusiveCost(value, gstRate);
      setExclusiveCost(newExclusiveCost);
      
      const newGstAmount = value - newExclusiveCost;
      setGstAmount(newGstAmount * quantity);
    } else {
      setExclusiveCost(value);
      setGstAmount(0);
    }
  };
  
  // Handle adding item to bill
  const handleAddItem = () => {
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    let discountValue = 0;
    let discountPercentage = 0;
    if (discount > 0) {
      if (discountType === 'amount') {
        discountValue = discount;
        discountPercentage = (discount / (exclusiveCost * quantity)) * 100;
      } else {
        discountPercentage = discount;
        discountValue = (exclusiveCost * quantity * discount) / 100;
      }
    }
    const baseAmount = exclusiveCost * quantity;
    const discountedBaseAmount = baseAmount - discountValue;
    let itemGstAmount = 0;
    if (gstRate > 0) {
      itemGstAmount = (discountedBaseAmount * gstRate) / 100;
    }
    const totalPrice = discountedBaseAmount + itemGstAmount;
    const itemCompany = companies?.find(c => c.id === selectedItem.companyId);
    const saleItem: SaleItem = {
      itemId: selectedItem.id,
      companyId: selectedItem.companyId,
      companyName: itemCompany ? itemCompany.name : 'Unknown Company',
      name: selectedItem.name,
      quantity,
      unitPrice: exclusiveCost,
      mrp: mrp,
      salesUnit,
      gstPercentage: gstRate > 0 ? gstRate : undefined,
      gstAmount: itemGstAmount,
      discountValue: discountValue > 0 ? discountValue : undefined,
      discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
      totalPrice,
      totalAmount: totalPrice,
      hsnCode: hsnCode || undefined,
      packagingDetails: packagingDetails || undefined
    };
    try {
      addSaleItem(saleItem);
      setSelectedItemId('');
      setSelectedItem(null);
      setQuantity(1);
      setDiscount(0);
      setSearchTerm('');
      setIsItemPopoverOpen(false);
    } catch (error) {
      toast.error('Error adding item to sale');
      console.error('Error adding item to sale:', error);
    }
  };
  
  // Open discount dialog for an item
  const openDiscountDialog = (index: number) => {
    if (!currentSaleItems || index < 0 || index >= currentSaleItems.length) {
      toast.error('Invalid item selected');
      return;
    }
    
    const item = currentSaleItems[index];
    
    setDiscountItemIndex(index);
    
    if (item.discountValue) {
      setDialogDiscount(item.discountPercentage ? item.discountPercentage : item.discountValue);
      setDialogDiscountType(item.discountPercentage ? 'percentage' : 'amount');
    } else {
      setDialogDiscount(0);
      setDialogDiscountType('amount');
    }
    
    setIsDiscountDialogOpen(true);
  };
  
  // Apply discount to an item
  const applyItemDiscount = () => {
    if (discountItemIndex < 0 || !currentSaleItems || discountItemIndex >= currentSaleItems.length) return;
    
    const item = currentSaleItems[discountItemIndex];
    const updatedItem = { ...item };
    
    // Calculate discount
    let discountValue = 0;
    let discountPercentage = 0;
    
    const baseAmount = item.unitPrice * item.quantity;
    
    if (dialogDiscount > 0) {
      if (dialogDiscountType === 'amount') {
        discountValue = dialogDiscount;
        discountPercentage = (dialogDiscount / baseAmount) * 100;
      } else {
        discountPercentage = dialogDiscount;
        discountValue = (baseAmount * dialogDiscount) / 100;
      }
    }
    
    // Calculate GST on discounted amount
    const discountedBaseAmount = baseAmount - discountValue;
    let itemGstAmount = 0;
    
    if (item.gstPercentage) {
      itemGstAmount = (discountedBaseAmount * item.gstPercentage) / 100;
    }
    
    // Update item with new values
    updatedItem.discountValue = discountValue > 0 ? discountValue : undefined;
    updatedItem.discountPercentage = discountPercentage > 0 ? discountPercentage : undefined;
    updatedItem.gstAmount = itemGstAmount;
    updatedItem.totalPrice = discountedBaseAmount + itemGstAmount;
    updatedItem.totalAmount = updatedItem.totalPrice;
    
    try {
      // Use the updateSaleItem function from context if available, otherwise fallback
      if (typeof contextUpdateSaleItem === 'function') {
        contextUpdateSaleItem(discountItemIndex, updatedItem);
      } else {
        // This is a fallback in case updateSaleItem isn't provided by the context
        removeSaleItem(discountItemIndex);
        addSaleItem(updatedItem);
      }
      
      setIsDiscountDialogOpen(false);
      toast.success('Discount applied successfully');
    } catch (error) {
      toast.error('Error applying discount');
      console.error('Error applying discount:', error);
    }
  };

  // Calculate summary values whenever sale items change
  useEffect(() => {
    if (!currentSaleItems || currentSaleItems.length === 0) {
      setSubtotal(0);
      setTotalDiscount(0);
      setTotalGst(0);
      setGrandTotal(0);
      return;
    }
    
    let newSubtotal = 0;
    let newTotalDiscount = 0;
    let newTotalGst = 0;
    let newGrandTotal = 0;
    
    currentSaleItems.forEach(item => {
      const baseAmount = item.unitPrice * item.quantity;
      newSubtotal += baseAmount;
      newTotalDiscount += item.discountValue || 0;
      newTotalGst += item.gstAmount || 0;
      newGrandTotal += item.totalPrice;
    });
    
    setSubtotal(newSubtotal);
    setTotalDiscount(newTotalDiscount);
    setTotalGst(newTotalGst);
    setGrandTotal(newGrandTotal);
  }, [currentSaleItems]);
  
  // Handle create sale
  const handleCreateSale = () => {
    if (!currentSaleItems || currentSaleItems.length === 0) {
      toast.error('No items added to sale');
      return;
    }
    
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    
    if (!selectedGodownId) {
      toast.error('Please select a godown');
      return;
    }
    
    try {
      // Validate company-specific rules
      const validation = validateCompanyItems(currentSaleItems);
      if (!validation.valid) {
        toast.error(validation.errorMessage || 'Invalid items');
        return;
      }
      
      // Group items by company to create separate bills if needed
      const itemsByCompany: Record<string, SaleItem[]> = {};
      
      currentSaleItems.forEach(item => {
        if (!itemsByCompany[item.companyId]) {
          itemsByCompany[item.companyId] = [];
        }
        itemsByCompany[item.companyId].push(item);
      });
      
      // Create bills for each company
      const createdSales = [];
      
      for (const [companyId, items] of Object.entries(itemsByCompany)) {
        const company = companies?.find(c => c.id === companyId);
        const hasGst = items.some(item => item.gstPercentage && item.gstPercentage > 0);
        
        // Explicitly cast billType to the correct type
        const billType = hasGst ? 'GST' as const : 'NON-GST' as const;
        const billNumber = `${billType}-${Date.now()}`; // Generate a bill number
        
        const billData = {
          companyId,
          billNumber,
          date: new Date().toISOString(),
          customerName,
          billType,
          godownId: selectedGodownId,
          items,
          totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0),
          createdBy: currentUser?.name || 'Unknown',
        };
        
        const sale = createSale(billData);
        if (sale) {
          createdSales.push(sale);
        }
      }
      
      if (createdSales.length > 0) {
        // Set created sales for printing
        setCreatedSale(createdSales.length === 1 ? createdSales[0] : createdSales);
        
        // Ask user about printing
        setPrintType(createdSales.length === 1 ? 'single' : 'all');
        setIsPrintModalOpen(true);
        
        // Reset form
        setCustomerName('');
        clearSaleItems();
      }
    } catch (error) {
      toast.error('Error creating sale');
      console.error('Error creating sale:', error);
    }
  };
  
  // Handle preview consolidated bill
  const handlePreviewConsolidatedBill = () => {
    if (!currentSaleItems || currentSaleItems.length === 0) {
      toast.error('No items added to sale');
      return;
    }
    
    setConsolidatedPreviewOpen(true);
  };

  const getItemDisplayDetails = (item: Item) => {
    if (!item) return "";
    const company = companies.find(c => c.id === item.companyId);
    const hasBulkPrices = Array.isArray((item as any).bulkPrices) && (item as any).bulkPrices.length > 0;
    return (
      <div className="w-full">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            {item.name}
            {item.type === 'GST' && item.gstPercentage ? ` (GST: ${item.gstPercentage}%)` : ''} - ₹{item.unitPrice}
          </span>
          {/* Bulk pricing link if available */}
          {hasBulkPrices && (
            <span className="text-xs text-blue-600 ml-2">[Bulk pricing available]</span>
          )}
        </div>
        <div className="text-xs text-gray-600">
          {company ? company.name : 'Unknown Company'} | In stock: {item.stockQuantity} {item.salesUnit}
        </div>
        {/* Bulk pricing slabs if available */}
        {hasBulkPrices && (
          <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
            {(item as any).bulkPrices.map((slab: any, idx: number) => (
              <span key={idx}>
                {slab.range}: ₹{slab.price}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Add updateSaleItem if it doesn't exist in the context
  const updateSaleItem = (index: number, saleItem: SaleItem) => {
    if (typeof contextUpdateSaleItem === 'function') {
      contextUpdateSaleItem(index, saleItem);
      return;
    }
    
    // Fallback implementation
    try {
      const newItems = [...currentSaleItems];
      newItems[index] = saleItem;
      
      // Remove and add to simulate update
      removeSaleItem(index);
      addSaleItem(saleItem);
    } catch (error) {
      console.error('Error updating sale item:', error);
      toast.error('Failed to update item');
    }
  };

  // Update the item selection handler to be robust
  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = itemsToShow.find(i => i.id === itemId);
    setSelectedItem(item || null);
    if (item) {
      // Auto-select the company for the selected item
      const company = companies.find(c => c.id === item.companyId);
      if (company) {
        setCurrentCompany(company);
      }
    }
  };

  // Remove popover/ref/focus logic for customer name input
  const [customerNameInputFocused, setCustomerNameInputFocused] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <p>Loading sales form...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CustomerInfo
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        onAddCustomer={addCustomer}
      />
      
      <ItemEntryForm
        onAddItem={addSaleItem}
        companies={companies || []}
        items={items || []}
        filteredGodowns={filteredGodowns || []}
      />
      
      <SaleItemsTable
        items={currentSaleItems}
        onRemoveItem={removeSaleItem}
        onOpenDiscountDialog={openDiscountDialog}
      />
      
      <CompanySummary summaries={companySummaries} />
      
      <SaleSummary
        subtotal={subtotal}
        totalDiscount={totalDiscount}
        totalGst={totalGst}
        grandTotal={grandTotal}
        onCreateSale={handleCreateSale}
        onPreviewBill={handlePreviewConsolidatedBill}
        onClearItems={clearSaleItems}
        isDisabled={currentSaleItems.length === 0 || !customerName || !selectedGodownId}
      />

      <DiscountDialog
        isOpen={isDiscountDialogOpen}
        onClose={() => setIsDiscountDialogOpen(false)}
        onApply={applyItemDiscount}
        discount={dialogDiscount}
        onDiscountChange={setDialogDiscount}
        discountType={dialogDiscountType}
        onDiscountTypeChange={setDialogDiscountType}
      />

      {isPrintModalOpen && createdSale && (
        <PrintBillModal 
          isOpen={isPrintModalOpen} 
          onClose={() => setIsPrintModalOpen(false)} 
          sale={createdSale} 
          printType={printType}
        />
      )}
    </div>
  );
};

export default EnhancedSaleForm;