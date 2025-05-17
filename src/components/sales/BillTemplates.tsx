
import React from 'react';
import { Sale, SaleItem } from '../../types';
import { Page, Text, View, Document, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { useInventory } from '../../contexts/InventoryContext';

// Styles for PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 18,
    marginBottom: 10,
  },
  billInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  billInfoItem: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 5,
  },
  tableNameCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 5,
  },
  tableColAmount: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 5,
  },
  tableCell: {
    margin: 'auto',
    fontSize: 10,
  },
  tableCellLeft: {
    margin: 5,
    fontSize: 10,
    textAlign: 'left',
  },
  tableCellRight: {
    margin: 5,
    fontSize: 10,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalLabel: {
    width: '75%',
    textAlign: 'right',
    padding: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    width: '25%',
    textAlign: 'right',
    padding: 5,
    fontSize: 12,
    fontWeight: 'bold',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
});

interface CompanyBillProps {
  sale: Sale;
  companyName: string;
}

export const CompanyBillTemplate: React.FC<CompanyBillProps> = ({ sale, companyName }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{companyName}</Text>
        <Text style={styles.subheader}>Bill #{sale.billNumber}</Text>
        
        <View style={styles.billInfo}>
          <View>
            <Text style={styles.billInfoItem}>Customer: {sale.customerName}</Text>
            <Text style={styles.billInfoItem}>Date: {format(new Date(sale.date), 'dd/MM/yyyy')}</Text>
          </View>
          <View>
            <Text style={styles.billInfoItem}>Bill Type: {sale.billType}</Text>
          </View>
        </View>
        
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableNameCol}><Text style={styles.tableCell}>Item</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Qty</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Unit</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Rate</Text></View>
            {sale.billType === 'GST' && <View style={styles.tableCol}><Text style={styles.tableCell}>GST %</Text></View>}
            {sale.billType === 'GST' && <View style={styles.tableCol}><Text style={styles.tableCell}>GST Amt</Text></View>}
            <View style={styles.tableColAmount}><Text style={styles.tableCell}>Amount</Text></View>
          </View>
          
          {sale.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.tableNameCol}><Text style={styles.tableCellLeft}>{item.name}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{item.quantity}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{item.salesUnit}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>₹{item.unitPrice.toFixed(2)}</Text></View>
              {sale.billType === 'GST' && <View style={styles.tableCol}><Text style={styles.tableCell}>{item.gstPercentage}%</Text></View>}
              {sale.billType === 'GST' && <View style={styles.tableCol}><Text style={styles.tableCell}>₹{(item.gstAmount || 0).toFixed(2)}</Text></View>}
              <View style={styles.tableColAmount}><Text style={styles.tableCellRight}>₹{item.totalPrice.toFixed(2)}</Text></View>
            </View>
          ))}
        </View>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>₹{sale.totalAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

interface ConsolidatedBillProps {
  sales: Sale[];
  customerName: string;
  totalAmount: number;
  date: string;
}

export const ConsolidatedBillTemplate: React.FC<ConsolidatedBillProps> = ({ 
  sales, 
  customerName, 
  totalAmount, 
  date 
}) => {
  // Group items by company
  const itemsByCompany: Record<string, { companyName: string; items: SaleItem[]; total: number }> = {};
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!itemsByCompany[item.companyId]) {
        itemsByCompany[item.companyId] = {
          companyName: item.companyName || 'Unknown Company',
          items: [],
          total: 0
        };
      }
      
      itemsByCompany[item.companyId].items.push(item);
      itemsByCompany[item.companyId].total += item.totalPrice;
    });
  });
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Consolidated Bill</Text>
        
        <View style={styles.billInfo}>
          <View>
            <Text style={styles.billInfoItem}>Customer: {customerName}</Text>
            <Text style={styles.billInfoItem}>Date: {format(new Date(date), 'dd/MM/yyyy')}</Text>
          </View>
        </View>
        
        <Text style={styles.subheader}>Summary by Company</Text>
        
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableNameCol}><Text style={styles.tableCell}>Company</Text></View>
            <View style={styles.tableColAmount}><Text style={styles.tableCell}>Amount</Text></View>
          </View>
          
          {Object.values(itemsByCompany).map((companyData, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.tableNameCol}><Text style={styles.tableCellLeft}>{companyData.companyName}</Text></View>
              <View style={styles.tableColAmount}><Text style={styles.tableCellRight}>₹{companyData.total.toFixed(2)}</Text></View>
            </View>
          ))}
        </View>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total:</Text>
          <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

interface BillPDFViewerProps {
  billType: 'company' | 'consolidated';
  sale?: Sale;
  sales?: Sale[];
  companyName?: string;
  customerName?: string;
  totalAmount?: number;
  date?: string;
}

export const BillPDFViewer: React.FC<BillPDFViewerProps> = (props) => {
  const { billType } = props;
  
  return (
    <PDFViewer style={{ width: '100%', height: '80vh' }}>
      {billType === 'company' && props.sale && props.companyName && (
        <CompanyBillTemplate sale={props.sale} companyName={props.companyName} />
      )}
      {billType === 'consolidated' && props.sales && props.customerName && props.totalAmount && props.date && (
        <ConsolidatedBillTemplate 
          sales={props.sales} 
          customerName={props.customerName}
          totalAmount={props.totalAmount}
          date={props.date}
        />
      )}
    </PDFViewer>
  );
};
