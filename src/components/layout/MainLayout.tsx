
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart2, 
  Settings, 
  Menu, 
  X, 
  Building2, 
  Warehouse
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { currentCompany } = useCompany();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Godowns', href: '/godowns', icon: Warehouse },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-pos-primary text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out md:translate-x-0 md:relative`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-blue-900 flex items-center justify-between">
            <h1 className="text-xl font-bold">POS System</h1>
            <button 
              onClick={toggleSidebar} 
              className="md:hidden text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Company Selection */}
          <div className="p-4 border-b border-blue-900">
            <div className="text-sm text-blue-200">Current Company</div>
            <div className="font-medium text-lg truncate">
              {currentCompany ? currentCompany.name : 'Select a company'}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-800'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-blue-900 text-xs text-blue-300">
            <p>© 2025 POS System with Tally</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="md:hidden mr-4 text-gray-600 hover:text-gray-900"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                {location.pathname === '/' ? 'Dashboard' : 
                 location.pathname === '/companies' ? 'Companies' :
                 location.pathname === '/inventory' ? 'Inventory' :
                 location.pathname === '/godowns' ? 'Godowns' :
                 location.pathname === '/sales' ? 'Sales' :
                 location.pathname === '/reports' ? 'Reports' :
                 location.pathname === '/settings' ? 'Settings' : 'POS System'}
              </h1>
            </div>
            <div>
              {currentCompany && (
                <span className="text-sm text-gray-600">
                  {currentCompany.name}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
