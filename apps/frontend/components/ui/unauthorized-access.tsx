'use client';

import Link from 'next/link';

interface UnauthorizedAccessProps {
    /** The name of the module or resource the user tried to access */
    moduleName?: string;
    /** Custom message to display */
    message?: string;
    /** Link to redirect back to (defaults to /dashboard) */
    backHref?: string;
    /** Label for the back link */
    backLabel?: string;
}

/**
 * UnauthorizedAccess
 *
 * A full-width, dashboard-integrated screen that is displayed when a user
 * navigates to a page they do not have permission to access.
 *
 * Usage:
 *   if (!hasPermission('documents.view')) {
 *     return <UnauthorizedAccess moduleName="Documents" />;
 *   }
 */
export function UnauthorizedAccess({
    moduleName = 'this page',
    message,
    backHref = '/dashboard',
    backLabel = 'Go to Dashboard',
}: UnauthorizedAccessProps) {
    const defaultMessage = `You do not have permission to access the ${moduleName} module. Please contact your administrator if you require access.`;

    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                    className="h-10 w-10 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                </svg>
            </div>

            {/* Heading */}
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Access Denied
            </h2>

            {/* Subheading */}
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                Unauthorized
            </p>

            {/* Message */}
            <p className="mb-8 max-w-md text-base text-gray-600 dark:text-gray-400">
                {message ?? defaultMessage}
            </p>

            {/* Back link */}
            <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
                <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                </svg>
                {backLabel}
            </Link>
        </div>
    );
}
