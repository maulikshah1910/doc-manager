'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';
import { Button } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication on mount
    if (!isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Welcome to Document Manager
          </h2>
          <p className="text-gray-600">
            You have successfully logged in. Dashboard content will be implemented in future phases.
          </p>
        </div>
      </main>
    </div>
  );
}
