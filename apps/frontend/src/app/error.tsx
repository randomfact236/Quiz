'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { trackBoundaryError } from '@/lib/error-tracking';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  // Analytics plan §4b A6: boundary render errors carry the server digest —
  // report once per error object; dedup/caps live in error-tracking.
  useEffect(() => {
    trackBoundaryError(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] dark:from-indigo-950 dark:to-rose-950/70 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-secondary-800 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 text-4xl">
          ⚠️
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-secondary-100">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-secondary-400">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 dark:border-secondary-600 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-secondary-200 transition-colors hover:bg-gray-50 dark:hover:bg-secondary-800/70 dark:hover:bg-secondary-800"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
