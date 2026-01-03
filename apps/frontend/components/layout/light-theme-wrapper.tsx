'use client';

import { useEffect } from 'react';

/**
 * Light Theme Wrapper
 *
 * Forces light theme on wrapped content.
 * Use this for pages that should not have dark mode (like login).
 */
export const LightThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Force light theme
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    // Clean up on unmount
    return () => {
      document.documentElement.classList.remove('light');
    };
  }, []);

  return <>{children}</>;
};
