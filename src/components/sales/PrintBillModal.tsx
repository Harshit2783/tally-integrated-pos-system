
import React from 'react';
import { Sale } from '../../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCompany } from '../../contexts/CompanyContext';
import { BillPDFViewer } from './BillTemplates';

interface PrintBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale;
  sales?: Sale[];
  printType: 'company' | 'consolidated';
}

const PrintBillModal: React.FC<PrintBillModalProps> = ({ isOpen, onClose, sale, sales, printType }) => {
  const { companies } = useCompany();
  
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown Company';
  };
  
  // Calculate total for consolidated bill
  let totalAmount = 0;
  let customerName = '';
  let date = '';
  
  if (sales && sales.length > 0) {
    totalAmount = sales.reduce((total, s) => total + s.totalAmount, 0);
    customerName = sales[0].customerName;
    date = sales[0].date;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {printType === 'company' ? 'Company Bill' : 'Consolidated Bill'}
          </DialogTitle>
          <DialogDescription>
            {printType === 'company' 
              ? `Printing bill for ${sale ? getCompanyName(sale.companyId) : 'Unknown Company'}`
              : 'Printing consolidated bill for all companies'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="pt-4 h-full">
          {printType === 'company' && sale && (
            <BillPDFViewer 
              billType="company" 
              sale={sale} 
              companyName={getCompanyName(sale.companyId)} 
            />
          )}
          
          {printType === 'consolidated' && sales && (
            <BillPDFViewer 
              billType="consolidated" 
              sales={sales} 
              customerName={customerName}
              totalAmount={totalAmount}
              date={date}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintBillModal;
