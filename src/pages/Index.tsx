
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import RecentSales from '../components/dashboard/RecentSales';
import LowStockItems from '../components/dashboard/LowStockItems';
import { InventoryProvider } from '../contexts/InventoryContext';
import { SalesProvider } from '../contexts/SalesContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package } from 'lucide-react';

const Index = () => {
  return (
    <InventoryProvider>
      <SalesProvider>
        <MainLayout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <div className="flex space-x-2">
                <Link to="/sales/new">
                  <Button>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    New Sale
                  </Button>
                </Link>
                <Link to="/inventory">
                  <Button variant="outline">
                    <Package className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </Link>
              </div>
            </div>
            
            <DashboardSummary />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentSales />
              <LowStockItems />
            </div>
          </div>
        </MainLayout>
      </SalesProvider>
    </InventoryProvider>
  );
};

export default Index;
