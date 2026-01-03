'use client';

import { LoginForm } from '@/components/auth/login-form';
import { AuthLayout } from '@/components/layout/auth-layout';
import { LightThemeWrapper } from '@/components/layout/light-theme-wrapper';
import { login } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await login(credentials);
      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (error) {
      // Error is handled by LoginForm component
      throw error;
    }
  };

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
