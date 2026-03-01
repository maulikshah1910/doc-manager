'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const statusStyles: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export default function UsersPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const permissions = user?.permissions || [];

    const hasPermission = (perm: string) => {
        return permissions.includes(perm) || permissions.includes('*');
    };

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            router.push('/');
            return;
        }

        loadUsers();
    }, [authLoading, isAuthenticated, router, page, limit]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            setError('');
            const response = await apiClient.get<{ data: UserData[], meta: { total: number } }>(`/api/v1/users?page=${page}&limit=${limit}`);
            setUsers(response.data.data);
            if (response.data.meta) {
                setTotal(response.data.meta.total);
            }
        } catch (err: any) {
            console.error('Failed to load users:', err);
            const message = err.response?.data?.message || 'Failed to load users';
            setError(message);
        } finally {
            setIsLoading(false);
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

    // Pagination logic
    const totalPages = Math.ceil(total / limit);
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (page <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (page >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <DashboardLayout permissions={permissions}>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Manage user accounts and their roles
                        </p>
                    </div>
                    {hasPermission('users.create') && (
                        <Link
                            href="/users/create"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add  User
                        </Link>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                                <p className="text-lg font-medium">No users found</p>
                                <p className="mt-1">Get started by creating a new user.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            {hasPermission('users.edit') && (
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            {u.profileImage ? (
                                                                <img
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                    src={u.profileImage}
                                                                    alt={`${u.firstName} ${u.lastName}`}
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-white">
                                                                        {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {u.firstName} {u.lastName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{u.email}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {u.role?.displayName || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[u.status] || statusStyles.inactive
                                                            }`}
                                                    >
                                                        {u.status}
                                                    </span>
                                                </td>
                                                {hasPermission('users.edit') && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {String(u.id) === String(user?.id) ? (
                                                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                You
                                                            </span>
                                                        ) : (
                                                            <Link
                                                                href={`/users/${u.id}/edit`}
                                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                            >
                                                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                Edit
                                                            </Link>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {!isLoading && total > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 gap-4">
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">Rows per page:</span>
                                    <select
                                        value={limit}
                                        onChange={(e) => {
                                            setLimit(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 py-1"
                                    >
                                        {[5, 10, 25, 50, 100].map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                                    </span>

                                    <nav className="flex items-center space-x-1" aria-label="Pagination">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                            aria-label="Previous page"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        {getPageNumbers().map((pageNum, idx) => (
                                            pageNum === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="px-3 py-1 text-gray-500 dark:text-gray-400">...</span>
                                            ) : (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum as number)}
                                                    className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${page === pageNum
                                                            ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-400'
                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        ))}

                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={page * limit >= total}
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                            aria-label="Next page"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
