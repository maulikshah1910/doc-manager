'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api-client';

interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    role: { id: string; name: string; displayName: string } | null;
    createdAt: string;
    updatedAt: string;
}

interface RoleOption {
    id: string;
    name: string;
    displayName: string;
}

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [roleId, setRoleId] = useState('');
    const [status, setStatus] = useState('active');
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const permissions = user?.permissions || [];

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            router.push('/');
            return;
        }

        // Prevent self-editing — redirect if user tries to edit their own profile
        if (user && String(user.id) === String(userId)) {
            router.push('/users');
            return;
        }

        loadData();
    }, [authLoading, isAuthenticated, router, userId, user]);

    const loadData = async () => {
        try {
            setIsLoadingData(true);
            setError('');

            const [userResponse, rolesResponse] = await Promise.all([
                apiClient.get<{ data: UserData }>(`/api/v1/users/${userId}`),
                apiClient.get<{ data: RoleOption[] }>('/api/v1/roles'),
            ]);

            const fetchedUser = userResponse.data.data;
            setUserData(fetchedUser);
            setRoleId(fetchedUser.role?.id?.toString() || '');
            setStatus(fetchedUser.status);
            setRoles(rolesResponse.data.data);
        } catch (err: any) {
            console.error('Failed to load data:', err);
            const message = err.response?.data?.message || 'Failed to load user data';
            setError(message);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            setIsSubmitting(true);
            await apiClient.put(`/api/v1/users/${userId}`, {
                roleId: roleId ? Number(roleId) : null,
                status,
            });

            router.push('/users');
        } catch (err: any) {
            console.error('Failed to update user:', err);
            const message = err.response?.data?.message || 'Failed to update user';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <DashboardLayout permissions={permissions}>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit User</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Update user role and account status
                        </p>
                    </div>
                    <Link
                        href="/users"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        ← Back to Users
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Success */}
                {successMessage && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-green-700 dark:text-green-400">{successMessage}</p>
                    </div>
                )}

                {isLoadingData ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : userData ? (
                    <form onSubmit={handleSubmit}>
                        {/* User Info (Read-only) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center mb-6">
                                    <div className="flex-shrink-0 h-16 w-16">
                                        {userData.profileImage ? (
                                            <img
                                                className="h-16 w-16 rounded-full object-cover"
                                                src={userData.profileImage}
                                                alt={`${userData.firstName} ${userData.lastName}`}
                                            />
                                        ) : (
                                            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                                                <span className="text-xl font-medium text-white">
                                                    {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {userData.firstName} {userData.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {userData.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            First Name
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {userData.firstName}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            Last Name
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {userData.lastName}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            Email
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {userData.email}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            Account Created
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {new Date(userData.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Editable: Role & Status */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Role & Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={roleId}
                                            onChange={(e) => setRoleId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">No role assigned</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.displayName}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Changing the role will update the user&apos;s permissions
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Inactive or suspended users cannot log in
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit */}
                        <div className="mt-6 flex items-center justify-end space-x-3">
                            <Link
                                href="/users"
                                className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p>User not found</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
