import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Download } from 'lucide-react';
import { Sale, Company } from '../../types';
import BillPDFViewer from './BillPDFViewer';
import { CompanyBillTemplate, ConsolidatedBillTemplate } from './BillTemplates';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { toast } from 'sonner';

type BillType = 'single' | 'all' | 'consolidated';

interface PrintBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | Sale[];
  printType?: BillType;
  selectedCompanyName?: string | null;
}

export const PrintBillModal: React.FC<PrintBillModalProps> = ({
  isOpen,
  onClose,
  sale,
  printType: initialPrintType = 'all',
  selectedCompanyName: initialSelectedCompanyName = null,
}) => {
  const [printType, setPrintType] = useState<BillType>(initialPrintType);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(initialSelectedCompanyName);
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  
  const sales = Array.isArray(sale) ? sale : [sale];
  
  // Get unique companies from sale items with their details
  const getCompaniesFromSales = () => {
    const companiesMap = new Map<string, Company>();
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.companyName && !companiesMap.has(item.companyName)) {
          companiesMap.set(item.companyName, {
            id: item.companyName, // Use company name as ID since we're not using IDs
            name: item.companyName,
            address: '', // These fields are required by the Company interface
            phone: '',   // but may not be available in the sale item
            email: '',
            gstNumber: '',
            panNumber: '',
            cinNumber: '',
            tanNumber: '',
            gstin: '',
            createdAt: new Date().toISOString()
          });
        }
      });
    });
    
    return Array.from(companiesMap.values());
  };

  const availableCompanies = getCompaniesFromSales();
  
  // Reset current company index when print type changes
  useEffect(() => {
    setCurrentCompanyIndex(0);
  }, [printType]);

  // If we only have one company, automatically select it
  useEffect(() => {
    if (availableCompanies.length === 1 && !selectedCompanyName) {
      setSelectedCompanyName(availableCompanies[0].name);
    }
  }, [availableCompanies, selectedCompanyName]);
  
  // Helper function to get company info by name
  const getCompanyByName = (name: string): Company | undefined => {
    return availableCompanies.find(c => c.name === name);
  };
  
  // Filter items for specific company
  const getItemsForCompany = (companyName: string) => {
    return sales.flatMap(s => s.items.filter(item => item.companyName === companyName));
  };

  // Handle navigation between company bills in 'all' mode
  const handlePreviousCompany = () => {
    if (currentCompanyIndex > 0) {
      setCurrentCompanyIndex(prev => prev - 1);
    }
  };

  const handleNextCompany = () => {
    if (currentCompanyIndex < availableCompanies.length - 1) {
      setCurrentCompanyIndex(prev => prev + 1);
    }
  };

  // Get dialog title based on print type
  const getDialogTitle = (type: BillType): string => {
    switch (type) {
      case 'consolidated':
        return 'Consolidated Bill';
      case 'single':
        return 'Single Company Bill';
      case 'all':
        return 'All Company Bills';
      default:
        return 'Bill Preview';
    }
  };

  // Render bill based on selected type
  const renderBillPreview = () => {
    if (!availableCompanies || availableCompanies.length === 0) {
      return <div className="p-4 text-center text-gray-500">No companies available</div>;
    }

    if (printType === 'consolidated') {
      return (
        <BillPDFViewer>
          <ConsolidatedBillTemplate sale={sale} />
        </BillPDFViewer>
      );
    } 
    
    if (printType === 'single' && selectedCompanyName) {
      const company = getCompanyByName(selectedCompanyName);
      const items = getItemsForCompany(selectedCompanyName);
      
      if (!company) {
        return <div className="p-4 text-center text-gray-500">Selected company not found</div>;
      }
      
      if (items.length === 0) {
        return <div className="p-4 text-center text-gray-500">No items found for selected company</div>;
      }
      
      return (
        <BillPDFViewer>
          <CompanyBillTemplate company={company} sale={sales[0]} items={items} />
        </BillPDFViewer>
      );
    } 
    
    if (printType === 'all') {
      const currentCompany = availableCompanies[currentCompanyIndex];
      if (!currentCompany) {
        return <div className="p-4 text-center text-gray-500">Company not found</div>;
      }

      const items = getItemsForCompany(currentCompany.name);
      
      if (items.length === 0) {
        return <div className="p-4 text-center text-gray-500">No items found for {currentCompany.name}</div>;
      }
      
      return (
        <>
          <div className="flex justify-between items-center mb-2 px-4">
            <Button
              variant="outline"
              onClick={handlePreviousCompany}
              disabled={currentCompanyIndex === 0}
            >
              Previous
            </Button>
            <span className="text-sm">
              Company {currentCompanyIndex + 1} of {availableCompanies.length}
            </span>
            <Button
              variant="outline"
              onClick={handleNextCompany}
              disabled={currentCompanyIndex === availableCompanies.length - 1}
            >
              Next
            </Button>
          </div>
          <BillPDFViewer>
            <CompanyBillTemplate company={currentCompany} sale={sales[0]} items={items} />
          </BillPDFViewer>
        </>
      );
    }
    
    return <div className="p-4 text-center text-gray-500">Select a bill type to continue</div>;
  };

  // Handle print action
  const handlePrint = async () => {
    try {
      window.print();
      toast.success('Printing started');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{getDialogTitle(printType)}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Bill Type</Label>
            <RadioGroup 
              value={printType} 
              onValueChange={(value: BillType) => {
                setPrintType(value);
                if (value === 'all') {
                  setSelectedCompanyName(null);
                }
              }}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">
                  All Companies ({availableCompanies?.length || 0} bills)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single Company</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="consolidated" id="consolidated" />
                <Label htmlFor="consolidated">Consolidated Bill</Label>
              </div>
            </RadioGroup>
          </div>
          
          {printType === 'single' && availableCompanies && availableCompanies.length > 0 && (
            <div className="space-y-2">
              <Label>Select Company</Label>
              <Select 
                value={selectedCompanyName || ''} 
                onValueChange={setSelectedCompanyName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((company) => (
                    company && company.name ? (
                      <SelectItem key={company.name} value={company.name}>
                        {company.name} ({getItemsForCompany(company.name).length} items)
                      </SelectItem>
                    ) : null
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-white">
          {renderBillPreview()}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handlePrint} 
            className="w-full"
            disabled={!availableCompanies || availableCompanies.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print {printType === 'all' ? 'All Bills' : 'Bill'}
          </Button>
          
          {printType === 'consolidated' && availableCompanies && availableCompanies.length > 0 && (
            <PDFDownloadLink
              document={<ConsolidatedBillTemplate sale={sale} />}
              fileName={`consolidated-bill-${Date.now()}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button variant="secondary" disabled={loading} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </PDFDownloadLink>
          )}
          
          {printType === 'single' && selectedCompanyName && (
            <PDFDownloadLink
              document={
                <CompanyBillTemplate 
                  company={getCompanyByName(selectedCompanyName)!} 
                  sale={sales[0]} 
                  items={getItemsForCompany(selectedCompanyName)} 
                />
              }
              fileName={`bill-${selectedCompanyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button variant="secondary" disabled={loading} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </PDFDownloadLink>
          )}
          
          {printType === 'all' && availableCompanies && availableCompanies.length > 0 && (
            <PDFDownloadLink
              document={
                <CompanyBillTemplate 
                  company={availableCompanies[currentCompanyIndex]} 
                  sale={sales[0]} 
                  items={getItemsForCompany(availableCompanies[currentCompanyIndex].name)} 
                />
              }
              fileName={`bill-${availableCompanies[currentCompanyIndex].name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button variant="secondary" disabled={loading} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Current Bill
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
