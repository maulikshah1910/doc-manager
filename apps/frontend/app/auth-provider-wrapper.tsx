'use client';

import { AuthProvider } from '@/contexts/auth-context';

export const AuthProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <AuthProvider>{children}</AuthProvider>;
};
