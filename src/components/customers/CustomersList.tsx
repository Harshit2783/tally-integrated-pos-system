
import React, { useState } from 'react';
import { useCustomers } from '../../contexts/CustomersContext';
import { Customer } from '../../types';
import { Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCompany } from '../../contexts/CompanyContext';

interface CustomersListProps {
  onEdit: (customer: Customer) => void;
}

const CustomersList: React.FC<CustomersListProps> = ({ onEdit }) => {
  const { currentCompany } = useCompany();
  const { filteredCustomers, deleteCustomer } = useCustomers();
  const [search, setSearch] = useState('');

  const filteredResults = filteredCustomers.filter((customer) => {
    return customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone.includes(search) ||
      customer.email.toLowerCase().includes(search.toLowerCase());
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(id);
    }
  };

  if (!currentCompany) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Please select a company to view customers</p>
      </Card>
    );
  }

  if (filteredCustomers.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No customers found. Please add customers to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">GST Number</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((customer) => (
              <tr key={customer.id} className="bg-white border-b">
                <td className="px-4 py-3 font-medium">{customer.name}</td>
                <td className="px-4 py-3">{customer.phone}</td>
                <td className="px-4 py-3">{customer.email}</td>
                <td className="px-4 py-3">{customer.gstNumber || '-'}</td>
                <td className="px-4 py-3">{customer.address}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(customer)}
                    >
                      <Edit size={16} className="text-blue-500" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersList;
