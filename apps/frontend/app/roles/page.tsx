'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api-client';

interface RoleData {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    isActive: boolean;
    permissions: { id: string; name: string; displayName: string; module: string }[];
    createdAt: string;
    updatedAt: string;
}

export default function RolesPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();
    const [roles, setRoles] = useState<RoleData[]>([]);
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

        loadRoles();
    }, [authLoading, isAuthenticated, router, page, limit]);

    const loadRoles = async () => {
        try {
            setIsLoading(true);
            setError('');
            const response = await apiClient.get<{ data: RoleData[], meta: { total: number } }>(`/api/v1/roles?page=${page}&limit=${limit}`);
            setRoles(response.data.data);
            if (response.data.meta) {
                setTotal(response.data.meta.total);
            }
        } catch (err: any) {
            console.error('Failed to load roles:', err);
            const message = err.response?.data?.message || 'Failed to load roles';
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
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Roles</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Manage roles and their permissions
                        </p>
                    </div>
                    {hasPermission('roles.create') && (
                        <Link
                            href="/roles/create"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Role
                        </Link>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Roles Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : roles.length === 0 ? (
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
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                </svg>
                                <p className="text-lg font-medium">No roles found</p>
                                <p className="mt-1">Get started by creating a new role.</p>
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
                                                Display Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Permissions
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            {hasPermission('roles.edit') && (
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {roles.map((role) => (
                                            <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {role.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {role.displayName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                        {role.description || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.isActive
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}
                                                    >
                                                        {role.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                {hasPermission('roles.edit') && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <Link
                                                            href={`/roles/${role.id}/edit`}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                        >
                                                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Edit
                                                        </Link>
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
                                        {[10, 25].map(option => (
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
