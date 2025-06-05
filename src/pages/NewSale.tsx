/**
 * New Sale Page
 * Dedicated page for creating new sales transactions with a focused
 * interface for adding items, customer details, and completing sales.
 */

import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import EnhancedSaleForm from '../components/sales/EnhancedSaleForm';

const NewSale = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">New Sale</h2>
        </div>
        
        <EnhancedSaleForm />
      </div>
    </MainLayout>
  );
};

const NewSalePage = () => <NewSale />;

export default NewSalePage;
