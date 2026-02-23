'use client';

import { useEffect } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { AuthLayout } from '@/components/layout/auth-layout';
import { LightThemeWrapper } from '@/components/layout/light-theme-wrapper';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  // If already authenticated (session restored), redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await login(credentials);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  // Show nothing while checking auth (prevents login form flash)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authenticated, don't render login (redirect is happening)
  if (isAuthenticated) {
    return null;
  }

  return (
    <LightThemeWrapper>
      <AuthLayout
        title="Document Manager"
        subtitle="Sign in to access your documents"
      >
        <LoginForm onSubmit={handleLogin} />
      </AuthLayout>
    </LightThemeWrapper>
  );
}
