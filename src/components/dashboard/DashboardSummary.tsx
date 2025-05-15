
import React, { useMemo } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useSales } from '../../contexts/SalesContext';
import { useInventory } from '../../contexts/InventoryContext';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Package, ArrowUp } from 'lucide-react';

const DashboardSummary: React.FC = () => {
  const { currentCompany } = useCompany();
  const { filteredSales } = useSales();
  const { filteredItems } = useInventory();

  const stats = useMemo(() => {
    const todaySales = filteredSales.filter(
      (sale) => new Date(sale.date).toDateString() === new Date().toDateString()
    );

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    const gstSales = filteredSales.filter(
      (sale) => sale.billType === 'GST'
    );
    const gstRevenue = gstSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    const nonGstSales = filteredSales.filter(
      (sale) => sale.billType === 'NON-GST'
    );
    const nonGstRevenue = nonGstSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    const lowStockItems = filteredItems.filter((item) => item.stockQuantity <= 10);

    return {
      todayRevenue,
      gstRevenue,
      nonGstRevenue,
      totalItemsCount: filteredItems.length,
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
              <p className="text-sm font-medium text-muted-foreground">Total Sales (Today)</p>
              <h3 className="text-2xl font-bold">₹{stats.todayRevenue.toFixed(2)}</h3>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>+20.1% from yesterday</span>
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">GST Sales</p>
              <h3 className="text-2xl font-bold">₹{stats.gstRevenue.toFixed(2)}</h3>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>+15% from yesterday</span>
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Non-GST Sales</p>
              <h3 className="text-2xl font-bold">₹{stats.nonGstRevenue.toFixed(2)}</h3>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>+10% from yesterday</span>
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <h3 className="text-2xl font-bold">{stats.totalItemsCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.lowStockCount} items low in stock
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
