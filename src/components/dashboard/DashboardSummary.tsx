import React, { useMemo } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useSales } from '../../contexts/SalesContext';
import { useInventory } from '../../contexts/InventoryContext';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Package, Building, AlertTriangle } from 'lucide-react';

const DashboardSummary: React.FC = () => {
  const { currentCompany } = useCompany();
  const { filteredSales } = useSales();
  const { filteredItems } = useInventory();

  const stats = useMemo(() => {
    const todaySales = filteredSales.filter(
      (sale) => new Date(sale.date).toDateString() === new Date().toDateString()
    );

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    const gstSalesCount = filteredSales.filter(
      (sale) => sale.billType === 'GST'
    ).length;

    const nonGstSalesCount = filteredSales.filter(
      (sale) => sale.billType === 'NON-GST'
    ).length;

    const lowStockItems = filteredItems.filter((item) => item.stockQuantity <= 10);

    return {
      todayRevenue,
      totalRevenue,
      todaySalesCount: todaySales.length,
      totalSalesCount: filteredSales.length,
      gstSalesCount,
      nonGstSalesCount,
      inventoryCount: filteredItems.length,
      lowStockCount: lowStockItems.length
    };
  }, [filteredSales, filteredItems]);

  if (!currentCompany) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Please select a company to view dashboard</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
              <h3 className="text-2xl font-bold">₹{stats.todayRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.todaySalesCount} sales today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <h3 className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <Building className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            From {stats.totalSalesCount} total sales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inventory Items</p>
              <h3 className="text-2xl font-bold">{stats.inventoryCount}</h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.lowStockCount} items low on stock
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bills</p>
              <h3 className="text-2xl font-bold">{stats.gstSalesCount + stats.nonGstSalesCount}</h3>
            </div>
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.gstSalesCount} GST, {stats.nonGstSalesCount} Non-GST
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
