'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

import { getStats } from '@/lib/riddle-mcq-api';
import { RiddleStatsBanner } from './components/RiddleStatsBanner';

export default function RiddlesPage(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalSubjects: number, totalRiddleMcqs: number } | null>(null);

  // Fetch stats from backend
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats from backend
        const statsData = await getStats();
        setStats(statsData);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stats. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalRiddles = stats?.totalRiddleMcqs || 0;


  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
        <div className="mx-auto max-w-6xl flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading chapters from backend...</p>
            <p className="text-xs text-gray-400 mt-2">API: {process.env['NEXT_PUBLIC_API_URL']}</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="mb-6 inline-block rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white/60">
            ← Back to Home
          </Link>

          <div className="text-center py-12 bg-white/50 rounded-2xl">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-6">API URL: {process.env['NEXT_PUBLIC_API_URL']}</p>


            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Back Button */}
        <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white/60 hover:shadow-md">
          <span className="text-lg">←</span> Back to Home
        </Link>


        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-5xl font-extrabold text-gray-800 tracking-tight">
            <span className="mx-3 opacity-80 filter grayscale-[0.2]">🎭</span>
            Riddles
            <span className="mx-3 opacity-80 filter grayscale-[0.2]">🎭</span>
          </h1>
          <p className="text-xl text-gray-500 font-medium">Challenge your brain with clever puzzles!</p>
        </div>

        <RiddleStatsBanner
          totalRiddles={totalRiddles}
          totalSubjects={stats?.totalSubjects || 0}
        />

        {/* Mode Selection Cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2" role="group" aria-label="Game mode selection">
          {/* Timer Challenge Card */}
          <Link href="/riddle-mcq/challenge">
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg transition-all hover:scale-105 hover:shadow-xl cursor-pointer">
              <div className="mb-4 flex justify-center">
                <span className="text-4xl" aria-hidden="true">⏱️</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-800">Timer Challenge</h2>
              <p className="mb-6 text-gray-500">Race against time!</p>
              <span className="rounded-full bg-gradient-to-r from-pink-400 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md">
                Start Challenge
              </span>
            </div>
          </Link>

          {/* Practice Mode Card */}
          <Link href="/riddle-mcq/practice">
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg transition-all hover:scale-105 hover:shadow-xl cursor-pointer">
              <div className="mb-4 flex justify-center">
                <span className="text-4xl" aria-hidden="true">♾️</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-800">Practice Mode</h2>
              <p className="mb-6 text-gray-500">Take your time</p>
              <span className="rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md">
                Practice Mode
              </span>
            </div>
          </Link>
        </div>

      </div>
    </main>
  );
}
