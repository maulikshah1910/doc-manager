'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import ProfileForm from '@/components/profile/profile-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from '@/components/ui';
import { getProfile, updateProfile, UpdateProfileDto } from '@/lib/profile';
import { isAuthenticated } from '@/lib/auth';
import { User } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    loadProfile();

    const mockPermissions = ['*']; // Wildcard - all permissions
    setPermissions(mockPermissions);
  }, [router]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      const profileData = await getProfile();
      setUser(profileData);
      setPermissions(profileData.permissions || []);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      const message = err.response?.data?.message || 'Failed to load profile';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (data: UpdateProfileDto) => {
    const updatedUser = await updateProfile(data);
    setUser(updatedUser);
    setPermissions(updatedUser.permissions || []);
  };

  if (!isAuthenticated()) {
    return null;
  }

  

  return (
    <DashboardLayout permissions={permissions}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal information
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your name and profile details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : user ? (
              <ProfileForm
                user={user}
                onSubmit={handleUpdateProfile}
                isLoading={isLoading}
              />
            ) : (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                Failed to load profile data
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      User ID
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {user.role?.displayName || 'No role assigned'}
                    </p>
                  </div>
                </div>
                {user.permissions && user.permissions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Permissions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {user.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
