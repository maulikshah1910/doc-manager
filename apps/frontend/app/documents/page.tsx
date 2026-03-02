'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UnauthorizedAccess } from '@/components/ui/unauthorized-access';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentMeta {
    id: string;
    title: string;
    description?: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    storagePath: string;
    currentVersion: number;
    uploadedBy: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function getMimeLabel(mimeType: string): string {
    const map: Record<string, string> = {
        'application/pdf': 'PDF',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'application/vnd.ms-excel': 'XLS',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
        'application/vnd.ms-powerpoint': 'PPT',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
        'image/jpeg': 'JPEG',
        'image/png': 'PNG',
        'image/gif': 'GIF',
        'image/webp': 'WEBP',
        'text/plain': 'TXT',
        'text/csv': 'CSV',
        'application/zip': 'ZIP',
    };
    return map[mimeType] ?? mimeType.split('/').pop()?.toUpperCase() ?? 'FILE';
}

function getMimeBadgeColor(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    if (mimeType.startsWith('image/')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
    if (mimeType.includes('word') || mimeType === 'application/msword') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    if (mimeType.includes('sheet') || mimeType === 'application/vnd.ms-excel') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    if (mimeType.includes('presentation') || mimeType === 'application/vnd.ms-powerpoint') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function DocumentsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();

    const [documents, setDocuments] = useState<DocumentMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    /**  Confirmation dialog state for deletion */
    const [deleteTarget, setDeleteTarget] = useState<DocumentMeta | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const permissions = user?.permissions ?? [];

    const hasPermission = (perm: string): boolean =>
        permissions.includes('*') || permissions.includes(perm);

    // ── Debounce search ────────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    // ── Redirect if not authenticated ─────────────────────────────────────────
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [authLoading, isAuthenticated, router]);

    // ── Load documents ─────────────────────────────────────────────────────────
    const loadDocuments = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setIsLoading(true);
            setError('');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
            });
            const res = await apiClient.get<{ data: DocumentMeta[]; meta: { total: number } }>(
                `/api/v1/documents?${params.toString()}`
            );
            setDocuments(res.data.data);
            setTotal(res.data.meta?.total ?? 0);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message ?? 'Failed to load documents.');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, page, limit, debouncedSearch]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadDocuments();
        }
    }, [authLoading, isAuthenticated, loadDocuments]);

    // ── Delete handler ─────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setIsDeleting(true);
            await apiClient.delete(`/api/v1/documents/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadDocuments();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message ?? 'Failed to delete document.');
            setDeleteTarget(null);
        } finally {
            setIsDeleting(false);
        }
    };

    // ── Pagination helpers ─────────────────────────────────────────────────────
    const totalPages = Math.ceil(total / limit);

    const getPageNumbers = (): (number | '...')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', page - 1, page, page + 1, '...', totalPages];
    };

    // ── Guards ─────────────────────────────────────────────────────────────────

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    // Permission gate — displayed inside the dashboard shell so the layout remains consistent
    if (!hasPermission('documents.view')) {
        return (
            <DashboardLayout permissions={permissions}>
                <UnauthorizedAccess moduleName="Documents" />
            </DashboardLayout>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout permissions={permissions}>
            <div className="space-y-6">

                {/* ── Page Header ──────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Documents</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            View and manage the documents you have uploaded
                        </p>
                    </div>

                    {/* "Add a document" — only shown when user has documents.create */}
                    {hasPermission('documents.create') && (
                        <button
                            onClick={() => router.push('/documents/upload')}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add a Document
                        </button>
                    )}
                </div>

                {/* ── Search bar ───────────────────────────────────────────────────── */}
                <div className="flex items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            id="documents-search"
                            type="text"
                            placeholder="Search by title or file name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {/* ── Error banner ─────────────────────────────────────────────────── */}
                {error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* ── Documents Table ───────────────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Uploaded Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Document
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Size
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Version
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Uploaded On
                                            </th>
                                            {(hasPermission('documents.edit') || hasPermission('documents.delete')) && (
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {documents.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={(hasPermission('documents.edit') || hasPermission('documents.delete')) ? 6 : 5}
                                                    className="px-6 py-16 text-center"
                                                >
                                                    <svg
                                                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">No documents found</p>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        {search
                                                            ? 'No documents match your search. Try a different keyword.'
                                                            : hasPermission('documents.create')
                                                                ? 'Get started by uploading your first document.'
                                                                : 'You have not uploaded any documents yet.'}
                                                    </p>
                                                    {search && (
                                                        <button
                                                            onClick={() => setSearch('')}
                                                            className="mt-4 inline-flex items-center px-4 py-2 border border-blue-600 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                                        >
                                                            Clear Search
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            documents.map((doc) => (
                                                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                                                    {/* Title + file name */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                <svg
                                                                    className="h-8 w-8 text-blue-500 dark:text-blue-400"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                    aria-hidden="true"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={1.5}
                                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                                    {doc.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                                    {doc.fileName}
                                                                </p>
                                                                {doc.description && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                                                        {doc.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* MIME badge */}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${getMimeBadgeColor(doc.mimeType)}`}
                                                        >
                                                            {getMimeLabel(doc.mimeType)}
                                                        </span>
                                                    </td>

                                                    {/* File size */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                        {formatFileSize(doc.fileSize)}
                                                    </td>

                                                    {/* Version */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                        v{doc.currentVersion}
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                        {formatDate(doc.createdAt)}
                                                    </td>

                                                    {/* Actions */}
                                                    {(hasPermission('documents.edit') || hasPermission('documents.delete')) && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="inline-flex items-center gap-2">
                                                                {hasPermission('documents.edit') && (
                                                                    <button
                                                                        onClick={() => router.push(`/documents/${doc.id}/edit`)}
                                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                                        title="Edit document"
                                                                    >
                                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                        Edit
                                                                    </button>
                                                                )}
                                                                {hasPermission('documents.delete') && (
                                                                    <button
                                                                        onClick={() => setDeleteTarget(doc)}
                                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                                                        title="Delete document"
                                                                    >
                                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Pagination ──────────────────────────────────────────────── */}
                        {!isLoading && total > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 gap-4">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} document{total !== 1 ? 's' : ''}
                                </span>

                                <nav className="flex items-center space-x-1" aria-label="Pagination">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                        aria-label="Previous page"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    {getPageNumbers().map((p, idx) =>
                                        p === '...' ? (
                                            <span key={`ellipsis-${idx}`} className="px-3 py-1 text-gray-500 dark:text-gray-400">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p as number)}
                                                className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${page === p
                                                        ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-400'
                                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}

                                    <button
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page * limit >= total}
                                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                        aria-label="Next page"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-dialog-title"
                >
                    <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 id="delete-dialog-title" className="text-base font-semibold text-gray-900 dark:text-white">
                                    Delete Document
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Are you sure you want to delete{' '}
                                    <span className="font-medium text-gray-900 dark:text-white">"{deleteTarget.title}"</span>?
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting && (
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                {isDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
