'use client';

import Link from 'next/link';

export default function RiddlesError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}): JSX.Element {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-4xl">
                    🧩
                </div>
                <h1 className="mb-2 text-2xl font-bold text-gray-800">Riddles Error</h1>
                <p className="mb-6 text-sm text-gray-500">
                    {error?.message || 'Something went wrong loading the riddles. Please try again.'}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        onClick={reset}
                        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                        Retry
                    </button>
                    <Link
                        href="/riddles"
                        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Back to Riddles
                    </Link>
                </div>
            </div>
        </div>
    );
}
