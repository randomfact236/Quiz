/**
 * ============================================================================
 * Riddle Practice Mode Page (Backend Connected)
 * ============================================================================
 * Multiple riddle modes without timer - Chapter wise, Level wise, Complete Mix
 * URL: /riddles/practice
 * ============================================================================
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, Target, Layers, Grid3X3, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';

import { getSubjects, getChaptersBySubject, getStats, type RiddlesStats } from '@/lib/riddles-api';
import type { RiddleChapter } from '@/types/riddles';

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


export default function RiddlePracticePage(): JSX.Element {
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
  // (no longer used - clicking a chapter goes directly to play)

  // Fetch data from backend
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats, subjects and chapters from backend (only those with content)
        const [statsData, subjectsData] = await Promise.all([
          getStats().catch(err => {
            console.error('Failed to get stats:', err);
            return null;
          }),
          getSubjects(true) // hasContent = true
        ]);

        setStats(statsData);

        // Fetch chapters for each subject (only those with content)
        const allChapters: ChapterWithSubject[] = [];
        for (const subject of subjectsData) {
          if (subject.id) {
            try {
              const subjectChapters = await getChaptersBySubject(subject.id, true); // hasContent = true
              for (const chapter of subjectChapters) {
                allChapters.push({
                  ...chapter,
                  subjectName: subject.name,
                  subjectEmoji: subject.emoji || '📚',
                  subjectId: subject.id
                });
              }
            } catch (err) {
              console.warn(`Failed to fetch chapters for subject ${subject.name}:`, err);
            }
          }
        }

        // Sort by subject order (if available) then chapter number
        allChapters.sort((a, b) => {
          // If subjects have an order property, use it. Otherwise, subjects are already in API order.
          // For chapters within a subject, sort by chapter number.
          return a.chapterNumber - b.chapterNumber;
        });

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
        if (counts.chapterWise[chapterName]) {
          const l = level as keyof typeof counts.chapterWise[string];
          if (counts.chapterWise[chapterName]![l] === undefined) {
            counts.chapterWise[chapterName]![l] = 0;
          }
          counts.chapterWise[chapterName]![l]!++;
        }

        // Count total per level
        if (level in counts.allChapter) {
          const levelKey = level as keyof typeof counts.allChapter;
          counts.allChapter[levelKey] = (counts.allChapter[levelKey] ?? 0) + 1;
        }
      }
    }

    return counts;
  }, [chapters, stats]);

  const getAllChapterCount = (level: Level): number => {
    return levelCounts.allChapter[level.toLowerCase()] || 0;
  };

  const getTotalRiddlesForChapter = (chapterName: string): number => {
    const chapterCounts = levelCounts.chapterWise[chapterName] || {};
    return Object.values(chapterCounts).reduce((sum, count) => sum + count, 0);
  };


  const handleStartMixForChapter = (chapterId: string) => {
    router.push(`/riddles/play?chapterId=${encodeURIComponent(chapterId)}&level=all&mode=practice`);
  };

  const handleStartAllChapterLevelWise = (level: Level) => {
    router.push(`/riddles/play?chapterId=all&level=${level.toLowerCase()}&mode=practice`);
  };

  const handleStartCompleteMix = () => {
    router.push(`/riddles/play?chapterId=all&level=all&mode=practice`);
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
          <span className="mr-3 opacity-80">📚</span>
          Practice Mode
        </motion.h1>

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
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
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
                {/* Chapters as a flat grid - no subject grouping */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {chapters.map((chapter) => {
                    const totalRiddles = getTotalRiddlesForChapter(chapter.name);
                    if (totalRiddles === 0) return null;
                    const chapterIcon = chapter.subjectEmoji || '📖';

                    return (
                      <button
                        key={chapter.id}
                        onClick={() => handleStartMixForChapter(chapter.id)}
                        disabled={totalRiddles === 0}
                        className="w-full flex flex-col items-center rounded-xl p-4 text-center shadow-md transition-all hover:scale-105 hover:shadow-lg bg-white border-2 border-gray-200 hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-3xl mb-1">{chapterIcon}</span>
                        <span className="font-semibold text-sm text-gray-800">{chapter.name}</span>
                        <span className="text-xs mt-1 text-gray-500">{totalRiddles} riddles</span>
                      </button>
                    );
                  })}
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
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Grid3X3 className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">Complete Mix</span>
                  <span className="text-sm opacity-90">All chapters, all levels - Ultimate practice!</span>
                </div>
              </div>
              {completeMixOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>

            {completeMixOpen && (
              <div className="p-6 text-center">
                <p className="mb-4 text-gray-600">
                  Practice with riddles from all chapters and all difficulty levels!
                </p>
                <div className="mb-6 flex justify-center gap-4 text-sm">
                  <span className="rounded-full bg-purple-100 px-4 py-2 text-purple-700">
                    {levelCounts.completeMix} Total Riddles
                  </span>
                  <span className="rounded-full bg-pink-100 px-4 py-2 text-pink-700">
                    4 Difficulty Levels
                  </span>
                </div>
                <button
                  onClick={handleStartCompleteMix}
                  disabled={levelCounts.completeMix === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GraduationCap className="h-5 w-5" />
                  Start Complete Mix Practice
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
