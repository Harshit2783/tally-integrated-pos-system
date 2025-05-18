
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Download, FileText } from 'lucide-react';
import { Sale, Company } from '../../types';
import BillPDFViewer from './BillPDFViewer';
import { CompanyBillTemplate, ConsolidatedBillTemplate } from './BillTemplates';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useCompany } from '../../contexts/CompanyContext';

interface PrintBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | Sale[];
  printType?: 'single' | 'all' | 'consolidated';
  selectedCompanyId?: string | null;
}

export const PrintBillModal: React.FC<PrintBillModalProps> = ({
  isOpen,
  onClose,
  sale,
  printType: initialPrintType = 'all',
  selectedCompanyId: initialSelectedCompanyId = null,
}) => {
  const { companies } = useCompany();
  const [printType, setPrintType] = useState<'single' | 'all' | 'consolidated'>(initialPrintType);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(initialSelectedCompanyId);
  
  const sales = Array.isArray(sale) ? sale : [sale];
  const companyIds = [...new Set(sales.flatMap(s => s.items.map(item => item.companyId)))];
  const availableCompanies = companies.filter(c => companyIds.includes(c.id));
  
  // If we only have one company, automatically select it
  React.useEffect(() => {
    if (availableCompanies.length === 1 && !selectedCompanyId) {
      setSelectedCompanyId(availableCompanies[0].id);
    }
  }, [availableCompanies, selectedCompanyId]);
  
  // Helper function to get company info
  const getCompanyById = (id: string): Company | undefined => {
    return companies.find(c => c.id === id);
  };
  
  // Filter items for specific company if needed
  const getItemsForCompany = (companyId: string) => {
    const saleItems = sales.flatMap(s => s.items);
    return saleItems.filter(item => item.companyId === companyId);
  };

  // Render bill based on selected type
  const renderBillPreview = () => {
    if (printType === 'consolidated') {
      return (
        <BillPDFViewer>
          <ConsolidatedBillTemplate sale={sale} />
        </BillPDFViewer>
      );
    } else if (printType === 'single' && selectedCompanyId) {
      const company = getCompanyById(selectedCompanyId);
      const items = getItemsForCompany(selectedCompanyId);
      
      if (company && items.length > 0) {
        return (
          <BillPDFViewer>
            <CompanyBillTemplate company={company} sale={sales[0]} items={items} />
          </BillPDFViewer>
        );
      }
    } else {
      // All companies individual view - show first one
      if (availableCompanies.length > 0) {
        const company = availableCompanies[0];
        const items = getItemsForCompany(company.id);
        
        return (
          <BillPDFViewer>
            <CompanyBillTemplate company={company} sale={sales[0]} items={items} />
          </BillPDFViewer>
        );
      }
    }
    
    return <div>No items to display</div>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{printType === 'consolidated' ? 'Consolidated Bill' : 'Company Bill'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Bill Type</Label>
            <RadioGroup 
              value={printType} 
              onValueChange={(value) => setPrintType(value as 'single' | 'all' | 'consolidated')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All Companies</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single Company</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="consolidated" id="consolidated" />
                <Label htmlFor="consolidated">Consolidated</Label>
              </div>
            </RadioGroup>
          </div>
          
          {printType === 'single' && (
            <div className="space-y-2">
              <Label>Select Company</Label>
              <Select 
                value={selectedCompanyId || ''} 
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          {renderBillPreview()}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {printType === 'consolidated' && (
            <PDFDownloadLink
              document={<ConsolidatedBillTemplate sale={sale} />}
              fileName={`consolidated-bill-${Date.now()}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button disabled={loading} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Consolidated Bill
                </Button>
              )}
            </PDFDownloadLink>
          )}
          
          {printType === 'single' && selectedCompanyId && (
            <PDFDownloadLink
              document={
                <CompanyBillTemplate 
                  company={getCompanyById(selectedCompanyId)!} 
                  sale={sales[0]} 
                  items={getItemsForCompany(selectedCompanyId)} 
                />
              }
              fileName={`bill-${selectedCompanyId}-${Date.now()}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button disabled={loading} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Company Bill
                </Button>
              )}
            </PDFDownloadLink>
          )}
          
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
