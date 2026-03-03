'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2, Play, RefreshCw } from 'lucide-react';

import { getItem, setItem } from '@/lib/storage';
import {
  getSubjects,
  getChaptersBySubject,
  getStats
} from '@/lib/riddles-api';
import { adaptChapter, DIFFICULTY_LEVELS, type ChapterDisplay } from '@/types/riddles';

// Storage key for data loss warning
const DATA_LOSS_WARNING_KEY = 'aiquiz:riddle-data-loss-warning-dismissed';

interface ChapterWithRiddles extends ChapterDisplay {
  riddleCount: number;
  subjectEmoji?: string;
}

import { RiddleStatsBanner } from './components/RiddleStatsBanner';

export default function RiddlesPage(): JSX.Element {
  const [chapters, setChapters] = useState<ChapterWithRiddles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [showDataLossWarning, setShowDataLossWarning] = useState(false);
  const [stats, setStats] = useState<{ totalSubjects: number, totalChapters: number, totalQuizRiddles: number } | null>(null);

  // Fetch chapters from backend
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        setDebugInfo('Fetching data...');

        // Fetch stats and subjects in parallel
        const [statsData, subjectsData] = await Promise.all([
          getStats().catch(err => {
            console.error('Failed to get stats:', err);
            return null;
          }),
          getSubjects()
        ]);

        if (statsData) {
          setStats(statsData);
          setDebugInfo(prev => `${prev}\nStats: ${statsData.totalSubjects} subjects, ${statsData.totalChapters} chapters, ${statsData.totalQuizRiddles} riddles`);
        }

        console.log('Fetched subjects:', subjectsData);
        setDebugInfo(prev => `${prev}\nFetched ${subjectsData.length} subjects`);

        const allChapters: ChapterWithRiddles[] = [];

        for (const subject of subjectsData) {
          if (!subject.id) continue;

          try {
            const subjectChapters = await getChaptersBySubject(subject.id);
            for (const chapter of subjectChapters) {
              allChapters.push({
                ...adaptChapter(chapter),
                subjectName: subject.name,
                subjectEmoji: subject.emoji,
              });
            }
          } catch (err) {
            console.warn(`Failed to fetch chapters for subject ${subject.name}:`, err);
          }
        }

        // Sort by subject order, then chapter number
        allChapters.sort((a, b) => {
          if (a.subjectId !== b.subjectId) {
            return (a.order || 0) - (b.order || 0);
          }
          return a.chapterNumber - b.chapterNumber;
        });

        setChapters(allChapters);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Load data loss warning state
  useEffect(() => {
    const warningDismissed = getItem(DATA_LOSS_WARNING_KEY, false);
    setShowDataLossWarning(!warningDismissed);
  }, []);

  const dismissDataLossWarning = () => {
    setShowDataLossWarning(false);
    setItem(DATA_LOSS_WARNING_KEY, true);
  };

  // Filter chapters with riddles vs empty
  const chaptersWithRiddles = chapters.filter(c => c.riddleCount > 0);
  const totalRiddles = stats?.totalQuizRiddles || chapters.reduce((sum, c) => sum + c.riddleCount, 0);

  // Group chapters by subject for display
  const chaptersBySubject = chaptersWithRiddles.reduce((acc, chapter) => {
    const subjectName = chapter.subjectName || 'Other';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(chapter);
    return acc;
  }, {} as Record<string, ChapterWithRiddles[]>);

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

            {/* Debug Info */}
            {debugInfo && (
              <div className="text-left max-w-2xl mx-auto mb-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 mb-2">Debug Info:</p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}

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

        {/* Data Loss Warning Banner */}
        <AnimatePresence>
          {showDataLossWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 rounded-xl bg-amber-50 border-2 border-amber-200 p-4 flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 leading-relaxed">
                  <strong>Important:</strong> Your riddle progress is saved on this device only.
                  Clearing browser data will erase your history.
                </p>
              </div>
              <button
                onClick={dismissDataLossWarning}
                className="p-1 hover:bg-amber-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-amber-600" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-5xl font-extrabold text-gray-800 tracking-tight">
            <span className="mx-3 opacity-80 filter grayscale-[0.2]">🎭</span>
            Riddles
            <span className="mx-3 opacity-80 filter grayscale-[0.2]">🎭</span>
          </h1>
          <p className="text-xl text-gray-500 font-medium">Challenge your brain with clever puzzles!</p>
        </div>

        {/* Stats Banner */}
        <RiddleStatsBanner
          totalRiddles={totalRiddles}
          totalSubjects={stats?.totalSubjects || 0}
          totalChapters={stats?.totalChapters || chaptersWithRiddles.length}
        />

        {/* Mode Selection Cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2" role="group" aria-label="Game mode selection">
          {/* Timer Challenge Card */}
          <Link href="/riddles/challenge">
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
          <Link href="/riddles/practice">
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

        {/* Chapters Section */}
        <div className="mb-6 text-center">
          <h2 className="mb-8 text-2xl font-bold text-gray-700">
            <span className="mr-2">📚</span>
            Browse by Chapter
          </h2>
        </div>

        {/* Debug Toggle */}
        <details className="mb-6 text-center">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">Show Debug Info</summary>
          <div className="mt-2 text-left max-w-2xl mx-auto p-4 bg-gray-100 rounded-lg text-xs font-mono">
            <p>API URL: {process.env['NEXT_PUBLIC_API_URL']}</p>
            <p>Total Chapters: {chapters.length}</p>
            <p>Chapters with Riddles: {chaptersWithRiddles.length}</p>
            <pre className="mt-2 whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        </details>

        {/* No Chapters State */}
        {chaptersWithRiddles.length === 0 && (
          <div className="text-center py-12 bg-white/50 rounded-xl">
            <p className="text-gray-500 text-lg">No chapters available yet.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon!</p>
            <p className="text-xs text-gray-400 mt-4">
              API: {process.env['NEXT_PUBLIC_API_URL']}<br />
              Total fetched: {chapters.length} chapters
            </p>
          </div>
        )}

        {/* Chapters Grouped by Subject */}
        <div className="space-y-8">
          {Object.entries(chaptersBySubject).map(([subjectName, subjectChapters]) => (
            <div key={subjectName} className="bg-white/40 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span>{subjectChapters[0]?.subjectEmoji || '📚'}</span>
                {subjectName}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {subjectChapters.map((chapter) => {
                  const isSelected = selectedChapter === chapter.id;

                  return (
                    <div
                      key={chapter.id}
                      className={`group relative rounded-xl p-5 text-center shadow-md transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer
                        ${isSelected ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white'}
                      `}
                    >
                      {/* Main click area for selection */}
                      <div
                        onClick={() => setSelectedChapter(isSelected ? null : chapter.id)}
                        className="absolute inset-0 z-10"
                      />

                      <div className="mb-3 flex justify-center">
                        <span className="text-3xl" aria-hidden="true">{chapter.icon}</span>
                      </div>
                      <h4 className="mb-1 text-sm font-bold text-gray-800">{chapter.title}</h4>
                      <p className="text-xs text-gray-500">{chapter.riddleCount} Riddles</p>

                      {/* Difficulty Indicators */}
                      <div className="mt-3 flex justify-center gap-1">
                        {DIFFICULTY_LEVELS.slice(0, 3).map((diff) => (
                          <div
                            key={diff.key}
                            className={`w-2 h-2 rounded-full ${chapter.riddleCount > 0 ? 'bg-gray-300' : 'bg-gray-100'
                              }`}
                            title={diff.label}
                          />
                        ))}
                      </div>

                      {/* Play Button - appears on hover or when selected */}
                      <div className={`mt-4 transition-all duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <Link
                          href={`/riddles/play?chapterId=${chapter.id}&mode=practice`}
                          onClick={(e) => e.stopPropagation()}
                          className="relative z-20 inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Play className="h-3 w-3" />
                          Play
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
