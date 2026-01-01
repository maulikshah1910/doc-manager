'use client';

import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            &copy; {currentYear} Document Manager. All rights reserved.
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Internal Document Management Platform - Phase 1
          </div>
        </div>
      </div>
    </footer>
  );
};
