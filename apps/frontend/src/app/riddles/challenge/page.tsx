/**
 * ============================================================================
 * Riddle Timer Challenge Mode Page (Backend Connected)
 * ============================================================================
 * Multiple riddle modes with timer - Chapter wise, Level wise, Complete Mix
 * URL: /riddles/challenge
 * ============================================================================
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Timer, Target, Layers, Grid3X3, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';

import { getSubjects, getChaptersBySubject, getStats, type RiddlesStats } from '@/lib/riddles-api';
import type { RiddleChapter } from '@/types/riddles';
import { DEFAULT_CHAPTER_ICONS } from '@/types/riddles';
import { RiddleStatsBanner } from '../components/RiddleStatsBanner';

// Riddle difficulty levels
const levels = ['Easy', 'Medium', 'Hard', 'Expert'] as const;

type Level = typeof levels[number];

const levelEmojis: Record<Level, string> = {
  'Easy': '🌱',
  'Medium': '🌿',
  'Hard': '🌲',
  'Expert': '🔥'
};

const levelColors: Record<Level, string> = {
  'Easy': 'from-green-400 to-green-600',
  'Medium': 'from-blue-400 to-blue-600',
  'Hard': 'from-orange-400 to-orange-600',
  'Expert': 'from-red-400 to-red-600'
};

interface ChapterWithSubject extends RiddleChapter {
  subjectName: string;
  subjectEmoji: string;
  subjectId: string;
}

interface LevelCount {
  chapterWise: Record<string, Record<string, number>>;
  allChapter: Record<string, number>;
  completeMix: number;
}


export default function RiddleChallengePage(): JSX.Element {
  const router = useRouter();

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [chapters, setChapters] = useState<ChapterWithSubject[]>([]);
  const [stats, setStats] = useState<RiddlesStats | null>(null);

  // Foldable sections state - default expanded
  const [chapterWiseOpen, setChapterWiseOpen] = useState(true);
  const [allChapterOpen, setAllChapterOpen] = useState(true);
  const [completeMixOpen, setCompleteMixOpen] = useState(true);

  // Expanded chapter for showing levels
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  // Fetch data from backend
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats, subjects and chapters from backend
        const [statsData, subjectsData] = await Promise.all([
          getStats().catch(err => {
            console.error('Failed to get stats:', err);
            return null;
          }),
          getSubjects()
        ]);

        setStats(statsData);

        // Fetch chapters for each subject
        const allChapters: ChapterWithSubject[] = [];
        for (const subject of subjectsData) {
          if (subject.id) {
            try {
              const subjectChapters = await getChaptersBySubject(subject.id);
              for (const chapter of subjectChapters) {
                allChapters.push({
                  ...chapter,
                  subjectName: subject.name,
                  subjectEmoji: subject.emoji,
                  subjectId: subject.id
                });
              }
            } catch (err) {
              console.warn(`Failed to fetch chapters for subject ${subject.name}:`, err);
            }
          }
        }

        // Sort by chapter number
        allChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

        setChapters(allChapters);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate level counts from backend data
  const levelCounts: LevelCount = useMemo(() => {
    const counts: LevelCount = {
      chapterWise: {},
      allChapter: { easy: 0, medium: 0, hard: 0, expert: 0 },
      completeMix: stats?.totalQuizRiddles || 0
    };

    // Calculate per-chapter and total counts by difficulty
    for (const chapter of chapters) {
      if (!chapter.riddles) continue;

      const chapterName = chapter.name;
      counts.chapterWise[chapterName] = {};

      for (const riddle of chapter.riddles) {
        let level = riddle.level?.toLowerCase() || 'medium';
        if (level === 'extreme') level = 'expert';

        // Skip if not a valid level
        if (!level || !(level in counts.allChapter)) continue;

        // Count per chapter
        if (!counts.chapterWise[chapterName][level]) {
          counts.chapterWise[chapterName][level] = 0;
        }
        counts.chapterWise[chapterName][level]++;

        // Count total per level
        counts.allChapter[level]++;
      }
    }

    return counts;
  }, [chapters, stats]);

  // Group chapters by subject for display
  const chaptersBySubject = useMemo(() => {
    const grouped: Record<string, ChapterWithSubject[]> = {};
    for (const chapter of chapters) {
      if (!grouped[chapter.subjectName]) {
        grouped[chapter.subjectName] = [];
      }
      grouped[chapter.subjectName].push(chapter);
    }
    return grouped;
  }, [chapters]);

  // Convert to rows for display
  const subjectEntries = useMemo(() => Object.entries(chaptersBySubject), [chaptersBySubject]);

  const handleStartChapterWise = (chapterId: string, _chapterName: string, level: Level) => {
    router.push(`/riddles/play?chapterId=${encodeURIComponent(chapterId)}&level=${level.toLowerCase()}&mode=timer`);
  };

  const handleStartAllChapterLevelWise = (level: Level) => {
    router.push(`/riddles/play?chapterId=all&level=${level.toLowerCase()}&mode=timer`);
  };

  const handleStartCompleteMix = () => {
    router.push(`/riddles/play?chapterId=all&level=all&mode=timer`);
  };

  const getChapterWiseCount = (chapterName: string, level: Level): number => {
    return levelCounts.chapterWise[chapterName]?.[level.toLowerCase()] || 0;
  };

  const getAllChapterCount = (level: Level): number => {
    return levelCounts.allChapter[level.toLowerCase()] || 0;
  };

  const getTotalRiddlesForChapter = (chapterName: string): number => {
    const chapterCounts = levelCounts.chapterWise[chapterName] || {};
    return Object.values(chapterCounts).reduce((sum, count) => sum + count, 0);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapterId(expandedChapterId === chapterId ? null : chapterId);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
        <div className="mx-auto max-w-4xl flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading chapters from backend...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/riddles"
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white/60 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Riddles
          </Link>

          <div className="text-center py-20 bg-white/50 rounded-2xl">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/riddles"
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white/60 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Riddles
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center text-4xl font-extrabold text-gray-800 tracking-tight"
        >
          <span className="mr-3 opacity-80">⏱️</span>
          Timer Challenge
        </motion.h1>

        <RiddleStatsBanner
          totalRiddles={stats?.totalQuizRiddles || 0}
          totalSubjects={stats?.totalSubjects || 0}
          totalChapters={stats?.totalChapters || 0}
        />

        <div className="space-y-6">
          {/* Chapter Wise Mix */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setChapterWiseOpen(!chapterWiseOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">Chapter Wise Mix</span>
                  <span className="text-sm opacity-90">Click a chapter to select difficulty level</span>
                </div>
              </div>
              {chapterWiseOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>

            {chapterWiseOpen && (
              <div className="p-6">
                {/* Chapters grouped by subject */}
                <div className="flex flex-col gap-6">
                  {subjectEntries.map(([subjectName, subjectChapters]) => (
                    <div key={subjectName} className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span>{subjectChapters[0]?.subjectEmoji || '📚'}</span>
                        {subjectName}
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {subjectChapters.map((chapter) => {
                          const totalRiddles = getTotalRiddlesForChapter(chapter.name);
                          const isExpanded = expandedChapterId === chapter.id;
                          const chapterIcon = DEFAULT_CHAPTER_ICONS[chapter.name] || '📖';

                          return (
                            <div key={chapter.id}>
                              <button
                                onClick={() => toggleChapter(chapter.id)}
                                disabled={totalRiddles === 0}
                                className={`w-full flex flex-col items-center rounded-xl p-4 text-center shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isExpanded
                                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-2 ring-indigo-300'
                                  : 'bg-white border-2 border-gray-200 hover:border-indigo-200'
                                  }`}
                              >
                                <span className="text-3xl mb-1">{chapterIcon}</span>
                                <span className={`font-semibold text-sm ${isExpanded ? 'text-white' : 'text-gray-800'}`}>
                                  {chapter.name}
                                </span>
                                <span className={`text-xs mt-1 ${isExpanded ? 'text-white/80' : 'text-gray-500'}`}>
                                  {totalRiddles} riddles
                                </span>
                              </button>

                              {/* Level selection - shown when expanded */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden mt-3"
                                  >
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border-2 border-indigo-200">
                                      <p className="text-center text-xs text-gray-600 mb-2">
                                        Select difficulty for <span className="font-semibold text-indigo-600">{chapter.name}</span>
                                      </p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {levels.map((level) => {
                                          const count = getChapterWiseCount(chapter.name, level);
                                          return (
                                            <button
                                              key={`${chapter.id}-${level}`}
                                              onClick={() => handleStartChapterWise(chapter.id, chapter.name, level)}
                                              disabled={count === 0}
                                              title={`${level}: ${count} riddles`}
                                              className={`flex items-center justify-center gap-1 rounded-lg p-2 text-xs font-medium text-white shadow-sm transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed ${count > 0 ? `bg-gradient-to-br ${levelColors[level]}` : 'bg-gray-300'
                                                }`}
                                            >
                                              <span>{levelEmojis[level]}</span>
                                              <span>{level}</span>
                                              <span className="opacity-75">({count})</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {chapters.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No chapters available. Please check back later!</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* All Chapter Level Wise Mix */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setAllChapterOpen(!allChapterOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Layers className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">All Chapter Level Wise Mix</span>
                  <span className="text-sm opacity-90">Riddles from all chapters at selected difficulty</span>
                </div>
              </div>
              {allChapterOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>

            {allChapterOpen && (
              <div className="p-6">
                <p className="mb-4 text-sm text-gray-600">Select difficulty level:</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {levels.map((level) => {
                    const count = getAllChapterCount(level);
                    return (
                      <button
                        key={`all-chapter-${level}`}
                        onClick={() => handleStartAllChapterLevelWise(level)}
                        disabled={count === 0}
                        className={`flex flex-col items-center rounded-xl bg-gradient-to-br ${levelColors[level]} p-4 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="text-2xl mb-1">{levelEmojis[level]}</span>
                        <span className="font-semibold text-sm">{level}</span>
                        <span className="mt-1 text-xs opacity-90">
                          {count} riddles
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Complete Mix */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setCompleteMixOpen(!completeMixOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-pink-500 to-rose-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Grid3X3 className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">Complete Mix</span>
                  <span className="text-sm opacity-90">All chapters, all levels - Ultimate challenge!</span>
                </div>
              </div>
              {completeMixOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>

            {completeMixOpen && (
              <div className="p-6 text-center">
                <p className="mb-4 text-gray-600">
                  Challenge yourself with riddles from all chapters and all difficulty levels!
                </p>
                <div className="mb-6 flex justify-center gap-4 text-sm">
                  <span className="rounded-full bg-pink-100 px-4 py-2 text-pink-700">
                    {levelCounts.completeMix} Total Riddles
                  </span>
                  <span className="rounded-full bg-rose-100 px-4 py-2 text-rose-700">
                    4 Difficulty Levels
                  </span>
                </div>
                <button
                  onClick={handleStartCompleteMix}
                  disabled={levelCounts.completeMix === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Timer className="h-5 w-5" />
                  Start Complete Mix Challenge
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
