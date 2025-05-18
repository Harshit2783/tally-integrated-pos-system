
import React from 'react';
import { Company, Sale, SaleItem } from '../../types';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  section: {
    margin: 5,
  },
  header: {
    marginBottom: 10,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  billInfo: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billInfoCol: {
    flex: 1,
  },
  tableContainer: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 3,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'solid',
    paddingVertical: 5,
  },
  description: { width: '25%' },
  qty: { width: '10%' },
  mrp: { width: '15%', textAlign: 'right' },
  discount: { width: '15%', textAlign: 'right' },
  exclCost: { width: '15%', textAlign: 'right' },
  gst: { width: '10%', textAlign: 'right' },
  total: { width: '10%', textAlign: 'right' },
  summaryContainer: {
    marginTop: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  summaryTitle: {
    flex: 1,
    textAlign: 'right',
    marginRight: 5,
  },
  summaryValue: {
    width: '25%',
    textAlign: 'right',
  },
  grandTotal: {
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    paddingTop: 3,
    marginTop: 5,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 9,
  },
});

interface CompanyBillTemplateProps {
  company: Company;
  sale: Sale;
  items: SaleItem[];
}

export const CompanyBillTemplate: React.FC<CompanyBillTemplateProps> = ({ company, sale, items }) => {
  // Calculate total quantities and amounts
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalExclusiveCost = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discountValue || 0), 0);
  const totalGst = items.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
  const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Round off calculation
  const roundedGrandTotal = Math.round(grandTotal);
  const roundOff = roundedGrandTotal - grandTotal;

  // Check if any item has GST or discount
  const hasGst = items.some(item => item.gstPercentage && item.gstPercentage > 0);
  const hasDiscount = items.some(item => item.discountValue && item.discountValue > 0);

  return (
    <Document>
      <Page size={[226, 600]} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text>{company.address}</Text>
          {company.gstin && <Text>GSTIN: {company.gstin}</Text>}
        </View>
        
        <View style={styles.billInfo}>
          <View style={styles.billInfoCol}>
            <Text>Bill No: {sale.billNumber}</Text>
            <Text>Date: {new Date(sale.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.billInfoCol}>
            <Text>Customer: {sale.customerName}</Text>
          </View>
        </View>
        
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.description}>Item</Text>
            <Text style={styles.qty}>Qty</Text>
            <Text style={styles.mrp}>MRP</Text>
            {hasDiscount && <Text style={styles.discount}>Disc</Text>}
            <Text style={styles.exclCost}>Excl</Text>
            {hasGst && <Text style={styles.gst}>GST</Text>}
            <Text style={styles.total}>Total</Text>
          </View>
          
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.description}>{item.name}</Text>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Text style={styles.mrp}>₹{(item.mrp || item.unitPrice).toFixed(2)}</Text>
              {hasDiscount && (
                <Text style={styles.discount}>
                  {item.discountValue ? `₹${item.discountValue.toFixed(2)}` : '-'}
                </Text>
              )}
              <Text style={styles.exclCost}>₹{item.unitPrice.toFixed(2)}</Text>
              {hasGst && (
                <Text style={styles.gst}>
                  {item.gstPercentage ? `${item.gstPercentage}%` : '-'}
                </Text>
              )}
              <Text style={styles.total}>₹{item.totalPrice.toFixed(2)}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>Total Qty:</Text>
            <Text style={styles.summaryValue}>{totalQuantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>Total Excl. GST:</Text>
            <Text style={styles.summaryValue}>₹{totalExclusiveCost.toFixed(2)}</Text>
          </View>
          {hasDiscount && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTitle}>Total Discount:</Text>
              <Text style={styles.summaryValue}>₹{totalDiscount.toFixed(2)}</Text>
            </View>
          )}
          {hasGst && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTitle}>Total GST:</Text>
              <Text style={styles.summaryValue}>₹{totalGst.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>Round Off:</Text>
            <Text style={styles.summaryValue}>₹{roundOff.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotal]}>
            <Text style={styles.summaryTitle}>Grand Total:</Text>
            <Text style={styles.summaryValue}>₹{roundedGrandTotal.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

export const ConsolidatedBillTemplate: React.FC<{ sale: Sale }> = ({ sale }) => {
  // Group items by company
  const itemsByCompany = sale.items.reduce<Record<string, { company: string, items: SaleItem[] }>>((acc, item) => {
    if (!acc[item.companyId]) {
      acc[item.companyId] = { 
        company: item.companyName,
        items: []
      };
    }
    acc[item.companyId].items.push(item);
    return acc;
  }, {});

  const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalExclusiveCost = sale.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalDiscount = sale.items.reduce((sum, item) => sum + (item.discountValue || 0), 0);
  const totalGst = sale.items.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
  const grandTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Round off calculation
  const roundedGrandTotal = Math.round(grandTotal);
  const roundOff = roundedGrandTotal - grandTotal;

  // Check if any item has GST or discount
  const hasGst = sale.items.some(item => item.gstPercentage && item.gstPercentage > 0);
  const hasDiscount = sale.items.some(item => item.discountValue && item.discountValue > 0);

  return (
    <Document>
      <Page size={[226, 700]} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>Consolidated Bill</Text>
          <Text>Bill No: {sale.billNumber}</Text>
          <Text>Date: {new Date(sale.date).toLocaleDateString()}</Text>
          <Text>Customer: {sale.customerName}</Text>
        </View>
        
        {Object.values(itemsByCompany).map((group, groupIndex) => (
          <View key={groupIndex} style={[styles.section, { marginTop: 10 }]}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{group.company}</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={styles.description}>Item</Text>
                <Text style={styles.qty}>Qty</Text>
                <Text style={styles.mrp}>MRP</Text>
                {hasDiscount && <Text style={styles.discount}>Disc</Text>}
                <Text style={styles.exclCost}>Excl</Text>
                {hasGst && <Text style={styles.gst}>GST</Text>}
                <Text style={styles.total}>Total</Text>
              </View>
              
              {group.items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.description}>{item.name}</Text>
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <Text style={styles.mrp}>₹{(item.mrp || item.unitPrice).toFixed(2)}</Text>
                  {hasDiscount && (
                    <Text style={styles.discount}>
                      {item.discountValue ? `₹${item.discountValue.toFixed(2)}` : '-'}
                    </Text>
                  )}
                  <Text style={styles.exclCost}>₹{item.unitPrice.toFixed(2)}</Text>
                  {hasGst && (
                    <Text style={styles.gst}>
                      {item.gstPercentage ? `${item.gstPercentage}%` : '-'}
                    </Text>
                  )}
                  <Text style={styles.total}>₹{item.totalPrice.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        
        <View style={[styles.summaryContainer, { marginTop: 20 }]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>Total Qty:</Text>
            <Text style={styles.summaryValue}>{totalQuantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>Total Excl. GST:</Text>
            <Text style={styles.summaryValue}>₹{totalExclusiveCost.toFixed(2)}</Text>
          </View>
          {hasDiscount && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTitle}>Total Discount:</Text>
              <Text style={styles.summaryValue}>₹{totalDiscount.toFixed(2)}</Text>
            </View>
          )}
          {hasGst && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTitle}>Total GST:</Text>
              <Text style={styles.summaryValue}>₹{totalGst.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>Round Off:</Text>
            <Text style={styles.summaryValue}>₹{roundOff.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotal]}>
            <Text style={styles.summaryTitle}>Grand Total:</Text>
            <Text style={styles.summaryValue}>₹{roundedGrandTotal.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};
