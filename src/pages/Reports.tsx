
/**
 * Reports Page
 * Provides data visualization and reporting capabilities for sales,
 * inventory, and financial analytics through interactive charts.
 */

import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { CompanyProvider } from '../contexts/CompanyContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { SalesProvider } from '../contexts/SalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '../contexts/CompanyContext';
import { useSales } from '../contexts/SalesContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText } from 'lucide-react';

const Reports = () => {
  const { currentCompany } = useCompany();
  const { filteredSales } = useSales();

  // Generate data for the sales chart
  const salesChartData = filteredSales.reduce((acc, sale) => {
    const date = new Date(sale.date);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    const existingDay = acc.find(day => day.date === dateStr);
    
    if (existingDay) {
      if (sale.billType === 'GST') {
        existingDay.gstSales += sale.totalAmount;
      } else {
        existingDay.nonGstSales += sale.totalAmount;
      }
      existingDay.total += sale.totalAmount;
    } else {
      acc.push({
        date: dateStr,
        gstSales: sale.billType === 'GST' ? sale.totalAmount : 0,
        nonGstSales: sale.billType === 'NON-GST' ? sale.totalAmount : 0,
        total: sale.totalAmount
      });
    }
    
    return acc;
  }, [] as { date: string; gstSales: number; nonGstSales: number; total: number }[]);

  // Sort by date
  salesChartData.sort((a, b) => {
    const dateA = new Date(`2025/${a.date}`);
    const dateB = new Date(`2025/${b.date}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Limit to last 7 days
  const recentSalesData = salesChartData.slice(-7);

  if (!currentCompany) {
    return (
      <MainLayout>
        <Card className="p-6 text-center">
          <p className="text-gray-500">Please select a company to view reports</p>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        </div>

        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sales">Sales Reports</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
            <TabsTrigger value="gst">GST Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentSalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="gstSales" name="GST Sales" fill="#3b82f6" />
                      <Bar dataKey="nonGstSales" name="Non-GST Sales" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border rounded-md p-4">
                    <div className="text-sm text-muted-foreground">Total Sales</div>
                    <div className="text-2xl font-bold">
                      ₹{filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {filteredSales.length} bills generated
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="text-sm text-muted-foreground">GST Sales</div>
                    <div className="text-2xl font-bold">
                      ₹{filteredSales
                        .filter(sale => sale.billType === 'GST')
                        .reduce((sum, sale) => sum + sale.totalAmount, 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {filteredSales.filter(sale => sale.billType === 'GST').length} GST bills
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="text-sm text-muted-foreground">Non-GST Sales</div>
                    <div className="text-2xl font-bold">
                      ₹{filteredSales
                        .filter(sale => sale.billType === 'NON-GST')
                        .reduce((sum, sale) => sum + sale.totalAmount, 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {filteredSales.filter(sale => sale.billType === 'NON-GST').length} non-GST bills
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      More detailed reports can be generated in Tally after synchronization
                    </p>
                    <div className="flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                      <span className="text-sm font-medium">Day Book, Trial Balance, GST Reports, etc.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-4">
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Inventory reports are available in Tally after synchronization:
                <br />
                Inventory Summary, Godown Reports, Stock Valuation, etc.
              </p>
            </Card>
          </TabsContent>
          
          <TabsContent value="gst" className="space-y-4">
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                GST reports are available in Tally after synchronization:
                <br />
                GSTR-1, GSTR-2, GSTR-3B, GST Analysis, etc.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

const ReportsPage = () => (
  <CompanyProvider>
    <InventoryProvider>
      <SalesProvider>
        <Reports />
      </SalesProvider>
    </InventoryProvider>
  </CompanyProvider>
);

export default ReportsPage;
