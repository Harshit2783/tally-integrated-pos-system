
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer } from '../types';
import { generateId } from '../data/mockData';
import { useCompany } from './CompanyContext';
import { toast } from 'sonner';

// Mock customer data
const mockCustomers: Customer[] = [
  {
    id: '1',
    companyId: '1',
    name: 'John Doe',
    phone: '+91 9876543210',
    email: 'john.doe@example.com',
    gstNumber: '27AABCI1234A1Z5',
    address: '123 Main St, Mumbai, Maharashtra',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    companyId: '1',
    name: 'Jane Smith',
    phone: '+91 9876543211',
    email: 'jane.smith@example.com',
    gstNumber: '',
    address: '456 Park Ave, Delhi',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    companyId: '2',
    name: 'Mike Johnson',
    phone: '+91 9876543212',
    email: 'mike.j@example.com',
    gstNumber: '07AABCI4567B1Z8',
    address: '789 Business Park, Bangalore',
    createdAt: new Date().toISOString()
  }
];

interface CustomersContextType {
  customers: Customer[];
  filteredCustomers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export const CustomersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const { currentCompany } = useCompany();
  
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  // Filter customers based on current company
  useEffect(() => {
    if (currentCompany) {
      setFilteredCustomers(customers.filter(customer => customer.companyId === currentCompany.id));
    } else {
      setFilteredCustomers([]);
    }
  }, [currentCompany, customers]);

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    setCustomers((prev) => [...prev, newCustomer]);
    toast.success('Customer added successfully');
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((customer) => (customer.id === updatedCustomer.id ? updatedCustomer : customer))
    );
    toast.success('Customer updated successfully');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((customer) => customer.id !== id));
    toast.success('Customer deleted successfully');
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  return (
    <CustomersContext.Provider
      value={{
        customers,
        filteredCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById
      }}
    >
      {children}
    </CustomersContext.Provider>
  );
};

export const useCustomers = (): CustomersContextType => {
  const context = useContext(CustomersContext);
  
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  
  return context;
};
