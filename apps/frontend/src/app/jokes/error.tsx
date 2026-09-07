'use client';

import Link from 'next/link';

export default function JokesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-orange-50 dark:bg-orange-500/10 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-secondary-800 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20 text-4xl">
          😅
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-secondary-100">
          Dad Jokes Error
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-secondary-400">
          {error?.message || 'Our joke teller tripped on the punchline. Please try again!'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Try Again
          </button>
          <Link
            href="/jokes"
            className="rounded-lg border border-gray-300 dark:border-secondary-600 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-secondary-200 transition-colors hover:bg-gray-50 dark:hover:bg-secondary-800/70 dark:hover:bg-secondary-800"
          >
            Back to Jokes
          </Link>
        </div>
      </div>
    </div>
  );
}
