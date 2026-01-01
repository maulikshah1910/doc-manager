'use client';

import React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Footer } from './footer';
import { ThemeProvider } from '@/contexts/theme-context';
import { useSidebar } from '@/hooks/use-sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  permissions?: string[];
}

const DashboardLayoutContent: React.FC<DashboardLayoutProps> = ({ children, permissions }) => {
  const { isExpanded, toggle } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar isExpanded={isExpanded} permissions={permissions} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isExpanded ? 'ml-64' : 'ml-16'
        }`}
      >
        {/* Header */}
        <Header onToggleSidebar={toggle} />

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
  return (
    <ThemeProvider>
      <DashboardLayoutContent {...props} />
    </ThemeProvider>
  );
};
