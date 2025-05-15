
// Company Types
export interface Company {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  gstin?: string;
  createdAt: string;
}

// Item Types
export interface Item {
  id: string;
  companyId: string;
  itemId: string;
  name: string;
  type: 'GST' | 'NON-GST';
  unitPrice: number;
  gstPercentage?: number;
  godownId: string;
  stockQuantity: number;
  createdAt: string;
}

// Godown Types
export interface Godown {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  createdAt: string;
}

// Sales Types
export interface SaleItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  gstPercentage?: number;
  gstAmount?: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  companyId: string;
  billNumber: string;
  date: string;
  customerName: string;
  billType: 'GST' | 'NON-GST';
  godownId: string;
  totalAmount: number;
  items: SaleItem[];
  createdAt: string;
}

// Context Types
export interface CompanyContextType {
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company) => void;
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;
}
