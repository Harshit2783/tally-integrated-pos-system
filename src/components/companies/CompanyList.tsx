
import React, { useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { Company } from '../../types';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CompanyListProps {
  onEdit: (company: Company) => void;
  onDelete: (companyId: string) => void;
}

const CompanyList: React.FC<CompanyListProps> = ({ onEdit, onDelete }) => {
  const { companies } = useCompany();

  if (companies.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No companies found. Please add a company to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-3">Company Name</th>
              <th className="px-6 py-3">GSTIN</th>
              <th className="px-6 py-3">Address</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr 
                key={company.id} 
                className="bg-white border-b hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-medium">
                  {company.name}
                </td>
                <td className="px-6 py-4">{company.gstin || '-'}</td>
                <td className="px-6 py-4">{company.address}</td>
                <td className="px-6 py-4">{company.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(company)}
                    >
                      <Edit size={16} className="text-blue-500" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(company.id)}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyList;
