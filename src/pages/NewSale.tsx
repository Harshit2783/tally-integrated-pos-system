
/**
 * New Sale Page
 * Dedicated page for creating new sales transactions with a focused
 * interface for adding items, customer details, and completing sales.
 */

import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { CompanyProvider } from '../contexts/CompanyContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { SalesProvider } from '../contexts/SalesContext';
import SaleEntryForm from '../components/sales/SaleEntryForm';

const NewSale = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">New Sale</h2>
        </div>
        
        <SaleEntryForm />
      </div>
    </MainLayout>
  );
};

const NewSalePage = () => (
  <CompanyProvider>
    <InventoryProvider>
      <SalesProvider>
        <NewSale />
      </SalesProvider>
    </InventoryProvider>
  </CompanyProvider>
);

export default NewSalePage;
