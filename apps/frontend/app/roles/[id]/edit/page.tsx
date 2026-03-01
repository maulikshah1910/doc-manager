'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api-client';

interface PermissionData {
    id: number;
    name: string;
    displayName: string;
    description?: string;
    module: string;
}

interface RoleData {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    isActive: boolean;
    permissions: PermissionData[];
}

interface GroupedPermissions {
    [module: string]: PermissionData[];
}

export default function EditRolePage() {
    const router = useRouter();
    const params = useParams();
    const roleId = params.id as string;
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();

    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
    const [allPermissions, setAllPermissions] = useState<PermissionData[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const permissions = user?.permissions || [];

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            router.push('/');
            return;
        }

        loadData();
    }, [authLoading, isAuthenticated, router, roleId]);

    const loadData = async () => {
        try {
            setIsLoadingData(true);
            setError('');

            const [roleResponse, permissionsResponse] = await Promise.all([
                apiClient.get<{ data: RoleData }>(`/api/v1/roles/${roleId}`),
                apiClient.get<{ data: PermissionData[] }>('/api/v1/roles/permissions'),
            ]);

            const role = roleResponse.data.data;
            setName(role.name);
            setDisplayName(role.displayName);
            setDescription(role.description || '');
            setIsActive(role.isActive);
            setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
            setAllPermissions(permissionsResponse.data.data);
        } catch (err: any) {
            console.error('Failed to load data:', err);
            const message = err.response?.data?.message || 'Failed to load role data';
            setError(message);
        } finally {
            setIsLoadingData(false);
        }
    };

    const groupedPermissions: GroupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {} as GroupedPermissions);

    const togglePermission = (id: number) => {
        setSelectedPermissionIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleModule = (module: string) => {
        const modulePerms = groupedPermissions[module];
        const allSelected = modulePerms.every((p) => selectedPermissionIds.has(p.id));

        setSelectedPermissionIds((prev) => {
            const next = new Set(prev);
            modulePerms.forEach((p) => {
                if (allSelected) {
                    next.delete(p.id);
                } else {
                    next.add(p.id);
                }
            });
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !displayName.trim()) {
            setError('Name and Display Name are required');
            return;
        }

        if (selectedPermissionIds.size === 0) {
            setError('At least one permission must be selected');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiClient.put(`/api/v1/roles/${roleId}`, {
                name: name.trim(),
                displayName: displayName.trim(),
                description: description.trim() || undefined,
                isActive,
                permissionIds: Array.from(selectedPermissionIds).map(Number),
            });

            router.push('/roles');
        } catch (err: any) {
            console.error('Failed to update role:', err);
            const message = err.response?.data?.message || 'Failed to update role';
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
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Role</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Modify role details and permissions
                        </p>
                    </div>
                    <Link
                        href="/roles"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        ← Back to Roles
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}

                {isLoadingData ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Role Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Role Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., content_editor"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Unique identifier (lowercase, underscores)
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Display Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="e.g., Content Editor"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Brief description of this role..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={(e) => setIsActive(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Active
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Permissions */}
                        <Card className="mt-6">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>
                                        Permissions
                                        {selectedPermissionIds.size > 0 && (
                                            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                ({selectedPermissionIds.size} selected)
                                            </span>
                                        )}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {Object.entries(groupedPermissions).map(([module, perms]) => {
                                        const allSelected = perms.every((p) => selectedPermissionIds.has(p.id));
                                        const someSelected = perms.some((p) => selectedPermissionIds.has(p.id));

                                        return (
                                            <div
                                                key={module}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                                            >
                                                {/* Module Header */}
                                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
                                                    <label className="flex items-center space-x-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            ref={(el) => {
                                                                if (el) el.indeterminate = someSelected && !allSelected;
                                                            }}
                                                            onChange={() => toggleModule(module)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                                                            {module}
                                                        </span>
                                                    </label>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {perms.filter((p) => selectedPermissionIds.has(p.id)).length}/{perms.length}
                                                    </span>
                                                </div>

                                                {/* Permission Checkboxes */}
                                                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {perms.map((perm) => (
                                                        <label
                                                            key={perm.id}
                                                            className="flex items-center space-x-3 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 -mx-2 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPermissionIds.has(perm.id)}
                                                                onChange={() => togglePermission(perm.id)}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                            <div>
                                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {perm.displayName}
                                                                </span>
                                                                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                                                                    {perm.name}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit */}
                        <div className="mt-6 flex items-center justify-end space-x-3">
                            <Link
                                href="/roles"
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
                )}
            </div>
        </DashboardLayout>
    );
}
