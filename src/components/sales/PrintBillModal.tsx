
import React, { useState } from 'react';
import { Sale } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { CompanyBillTemplate } from './BillTemplates';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useCompany } from '../../contexts/CompanyContext';
import BillPDFViewer from './BillPDFViewer';

interface PrintBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  printType: 'single' | 'all';
  selectedCompanyId: string | null;
}

export const PrintBillModal: React.FC<PrintBillModalProps> = ({
  isOpen,
  onClose,
  sale,
  printType,
  selectedCompanyId
}) => {
  const { companies } = useCompany();
  const [activeTab, setActiveTab] = useState<string>('preview');

  // Group items by company
  const itemsByCompany = sale.items.reduce<Record<string, typeof sale.items>>((acc, item) => {
    if (!acc[item.companyId]) {
      acc[item.companyId] = [];
    }
    acc[item.companyId].push(item);
    return acc;
  }, {});

  // Filter companies based on printType and selectedCompanyId
  const relevantCompanies = companies.filter(company => {
    if (printType === 'single' && selectedCompanyId) {
      return company.id === selectedCompanyId;
    }
    return itemsByCompany[company.id]?.length > 0;
  });

  const handlePrint = (companyId: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups for this website');
      return;
    }

    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    const items = itemsByCompany[companyId] || [];
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Bill - ${company.name}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              width: 3in;
              margin: 0;
              padding: 10px;
            }
            .bill-header {
              text-align: center;
              margin-bottom: 10px;
            }
            .company-name {
              font-weight: bold;
              font-size: 16px;
            }
            .bill-info {
              font-size: 12px;
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            th, td {
              border-bottom: 1px solid #ddd;
              padding: 3px;
              text-align: left;
            }
            .summary {
              margin-top: 10px;
              font-size: 12px;
            }
            .thank-you {
              text-align: center;
              margin-top: 10px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="bill-header">
            <div class="company-name">${company.name}</div>
            <div>${company.address}</div>
            <div>GSTIN: ${company.gstin || 'N/A'}</div>
          </div>
          
          <div class="bill-info">
            <div>Bill No: ${sale.billNumber}</div>
            <div>Date: ${new Date(sale.date).toLocaleDateString()}</div>
            <div>Customer: ${sale.customerName}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>MRP</th>
                ${items[0]?.discountValue ? '<th>Disc</th>' : ''}
                <th>Price</th>
                ${items[0]?.gstPercentage ? '<th>GST</th>' : ''}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity} ${item.salesUnit}</td>
                  <td>₹${(item.mrp || item.unitPrice).toFixed(2)}</td>
                  ${item.discountValue ? `<td>₹${item.discountValue.toFixed(2)}</td>` : ''}
                  <td>₹${item.unitPrice.toFixed(2)}</td>
                  ${item.gstPercentage ? `<td>${item.gstPercentage}%</td>` : ''}
                  <td>₹${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div>Total Qty: ${items.reduce((sum, item) => sum + item.quantity, 0)}</div>
            <div>Total Excl. GST: ₹${items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}</div>
            ${items[0]?.discountValue ? 
              `<div>Total Discount: ₹${items.reduce((sum, item) => sum + (item.discountValue || 0), 0).toFixed(2)}</div>` : ''}
            ${items[0]?.gstAmount ? 
              `<div>Total GST: ₹${items.reduce((sum, item) => sum + (item.gstAmount || 0), 0).toFixed(2)}</div>` : ''}
            <div><strong>Grand Total: ₹${items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</strong></div>
          </div>
          
          <div class="thank-you">
            Thank you for your business!
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handlePrintAll = () => {
    relevantCompanies.forEach(company => {
      handlePrint(company.id);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Bill Preview</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
            <TabsTrigger value="actions" className="flex-1">Print/Download</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <div className="flex flex-col space-y-4 max-h-[70vh] overflow-y-auto">
              {relevantCompanies.map(company => {
                const items = itemsByCompany[company.id] || [];
                if (items.length === 0) return null;
                
                return (
                  <div key={company.id} className="border rounded-md p-4">
                    <h3 className="text-lg font-bold mb-2">{company.name}</h3>
                    <BillPDFViewer>
                      <CompanyBillTemplate 
                        company={company} 
                        sale={sale} 
                        items={items} 
                      />
                    </BillPDFViewer>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 border-r pr-4">
                <h3 className="font-medium text-lg">Print Options</h3>
                
                {printType === 'all' && (
                  <Button 
                    className="w-full"
                    onClick={handlePrintAll}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print All Bills
                  </Button>
                )}
                
                {relevantCompanies.map(company => (
                  <Button 
                    key={company.id} 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handlePrint(company.id)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print {company.name} Bill
                  </Button>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Download Options</h3>
                
                {printType === 'all' && relevantCompanies.length > 1 && (
                  <Button className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download All Bills (ZIP)
                  </Button>
                )}
                
                {relevantCompanies.map(company => {
                  const items = itemsByCompany[company.id] || [];
                  if (items.length === 0) return null;
                  
                  return (
                    <PDFDownloadLink
                      key={company.id}
                      document={
                        <CompanyBillTemplate 
                          company={company} 
                          sale={sale} 
                          items={items} 
                        />
                      }
                      fileName={`${company.name}_${sale.billNumber}_bill.pdf`}
                      className="w-full block"
                    >
                      {({ loading }) => (
                        <Button className="w-full" variant="outline" disabled={loading}>
                          <Download className="mr-2 h-4 w-4" />
                          {loading ? 'Preparing...' : `Download ${company.name} Bill`}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
