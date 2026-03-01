'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import { login as authLogin, logout as authLogout, initializeAuth } from '@/lib/auth';
import { LoginCredentials } from '@/lib/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount, try to restore session from refresh token cookie
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const restoredUser = await initializeAuth();
                if (restoredUser) {
                    setUser(restoredUser);
                }
            } catch (error) {
                // No valid session — user needs to login
                console.debug('No active session found');
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
        const loggedInUser = await authLogin(credentials);
        setUser(loggedInUser);
        return loggedInUser;
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        await authLogout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
