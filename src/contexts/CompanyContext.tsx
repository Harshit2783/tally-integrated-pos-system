
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Company, CompanyContextType } from '../types';
import { companies as mockCompanies } from '../data/mockData';
import { generateId } from '../data/mockData';
import { toast } from 'sonner';

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(
    mockCompanies.length > 0 ? mockCompanies[0] : null
  );

  const addCompany = (companyData: Omit<Company, 'id' | 'createdAt'>) => {
    const newCompany: Company = {
      ...companyData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    setCompanies((prev) => [...prev, newCompany]);
    toast.success('Company added successfully');
    
    // Set as current company if it's the first one
    if (companies.length === 0) {
      setCurrentCompany(newCompany);
    }
  };

  const updateCompany = (updatedCompany: Company) => {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === updatedCompany.id ? updatedCompany : company
      )
    );
    
    // Update current company if it's the one being updated
    if (currentCompany && currentCompany.id === updatedCompany.id) {
      setCurrentCompany(updatedCompany);
    }
    
    toast.success('Company updated successfully');
  };

  const deleteCompany = (id: string) => {
    setCompanies((prev) => prev.filter((company) => company.id !== id));
    
    // Reset current company if it's the one being deleted
    if (currentCompany && currentCompany.id === id) {
      const remainingCompanies = companies.filter((company) => company.id !== id);
      setCurrentCompany(remainingCompanies.length > 0 ? remainingCompanies[0] : null);
    }
    
    toast.success('Company deleted successfully');
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        setCurrentCompany,
        addCompany,
        updateCompany,
        deleteCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  
  return context;
};
