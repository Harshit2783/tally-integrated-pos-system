import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import CustomerForm from '../customers/CustomerForm';
import { useCustomers } from '../../contexts/CustomersContext';
import { useCompany } from '../../contexts/CompanyContext';

interface CustomerInfoProps {
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onAddCustomer: (customer: any) => void;
}

const CustomerInfo: React.FC<CustomerInfoProps> = ({
  customerName,
  onCustomerNameChange,
  onAddCustomer,
}) => {
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerNameInputFocused, setCustomerNameInputFocused] = useState(false);
  const { customers } = useCustomers();
  const { currentCompany } = useCompany();

  // Filter customers based on input
  const filteredCustomerSuggestions = React.useMemo(() => {
    if (!customerName.trim()) return [];
    const lower = customerName.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(lower));
  }, [customerName, customers]);

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div className="space-y-2 flex items-end">
          <div className="flex-1">
            <Label htmlFor="customerName">Customer Name *</Label>
            <div className="relative">
              <Input
                id="customerName"
                value={customerName}
                onChange={e => onCustomerNameChange(e.target.value)}
                placeholder="Enter customer name"
                required
                disabled={showCustomerForm}
                autoComplete="off"
                onFocus={() => setCustomerNameInputFocused(true)}
                onBlur={() => setTimeout(() => setCustomerNameInputFocused(false), 100)}
              />
              {customerNameInputFocused && customerName && filteredCustomerSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto">
                  {filteredCustomerSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      onMouseDown={e => {
                        e.preventDefault();
                        onCustomerNameChange(c.name);
                        setCustomerNameInputFocused(false);
                      }}
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.phone} {c.email && `| ${c.email}`}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            className="ml-2 mb-1"
            variant="outline"
            onClick={() => setShowCustomerForm(true)}
            disabled={showCustomerForm}
          >
            + Add Customer
          </Button>
        </div>
      </div>
      {showCustomerForm && (
        <div className="mt-6">
          <CustomerForm
            onSubmit={(newCustomer) => {
              const { id, createdAt, ...customerData } = newCustomer;
              onAddCustomer({
                ...customerData,
                companyId: currentCompany?.id || customerData.companyId || '',
              });
              onCustomerNameChange(newCustomer.name);
              setShowCustomerForm(false);
            }}
            onCancel={() => setShowCustomerForm(false)}
          />
        </div>
      )}
    </Card>
  );
};

export default CustomerInfo; 