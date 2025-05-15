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
  gstPercentage?: number;
  godownId: string;
  stockQuantity: number;
  createdAt: string;
}

export interface SaleItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  gstPercentage?: number;
  totalAmount: number;
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
  items: SaleItem[];
  createdAt: string;
}

