
export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  cinNumber: string;
  tanNumber: string;
  gstin: string; // Added this field as it's being used
  createdAt: string;
}

export interface Godown {
  id: string;
  companyId: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Item {
  id: string;
  companyId: string;
  itemId: string;
  name: string;
  type: 'GST' | 'NON-GST';
  unitPrice: number;
  mrp?: number;
  gstPercentage?: number;
  hsnCode?: string;  
  godownId: string;
  stockQuantity: number;
  salesUnit: 'Case' | 'Packet' | 'Piece';
  createdAt: string;
}

export interface SaleItem {
  itemId: string;
  companyId: string;
  companyName: string;
  name: string;
  quantity: number;
  unitPrice: number; // Exclusive cost (without GST)
  mrp?: number; // MRP (inclusive of GST)
  discountValue?: number; // Discount amount in rupees
  discountPercentage?: number; // Discount percentage
  gstPercentage?: number;
  gstAmount?: number;
  hsnCode?: string;
  packagingDetails?: string; // Added packaging details for Estimate company
  totalPrice: number; // Final price after GST and discount
  totalAmount: number;
  salesUnit: string;
}

// Customer Type
export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  gstNumber?: string;
  address: string;
  createdAt: string;
}

// Sale Type
export interface Sale {
  id: string;
  companyId: string;
  billNumber: string;
  date: string;
  customerName: string;
  billType: 'GST' | 'NON-GST';
  godownId: string;
  totalAmount: number;
  totalDiscount?: number;
  totalExclusiveCost?: number;
  totalGst?: number;
  items: SaleItem[];
  createdAt: string;
}

// Company Context Type - only includes companies and methods
export interface CompanyContextType {
  companies: Company[];
  addCompany: (companyData: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;
}

// Dashboard Analytics Types
export interface DashboardAnalytics {
  totalSales: number;
  totalBills: number;
  companyRevenue: {
    companyId: string;
    companyName: string;
    revenue: number;
    billCount: number;
  }[];
  gstSales: number;
  nonGstSales: number;
  totalDiscounts: number;
  topItems: {
    companyId: string;
    companyName: string;
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
  }[];
}
