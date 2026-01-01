'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';

interface SidebarProps {
  isExpanded: boolean;
  permissions?: string[];
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  permission?: string; // Required permission to view this item
}

export const Sidebar: React.FC<SidebarProps> = ({ isExpanded, permissions = [] }) => {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  // Check if user has permission
  const hasPermission = (required?: string): boolean => {
    if (!required) return true; // No permission required
    if (permissions.includes('*')) return true; // Wildcard permission
    if (permissions.includes(required)) return true; // Exact match

    // Check for wildcard: document.* matches document.view, document.upload, etc.
    const [resource] = required.split('.');
    if (permissions.includes(`${resource}.*`)) return true;

    return false;
  };

  // Navigation items
  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      permission: 'document.view',
    },
    {
      name: 'Upload Document',
      href: '/documents/upload',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      permission: 'document.upload',
    },
    {
      name: 'Users',
      href: '/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      permission: 'user.view',
    },
    {
      name: 'Roles',
      href: '/dashboard/roles',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      permission: 'role.manage',
    },
    {
      name: 'Audit Logs',
      href: '/logs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      permission: 'log.view',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  // Filter items based on permissions
  const filteredItems = navItems.filter(item => hasPermission(item.permission));

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        fixed left-0 top-0 h-full z-40 transition-all duration-300
        ${isExpanded ? 'w-64' : 'w-16'}
      `}
    >
      <div className="flex flex-col h-full pt-16">
        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive(item.href)
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              title={!isExpanded ? item.name : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isExpanded && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={!isExpanded ? 'Logout' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isExpanded && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
