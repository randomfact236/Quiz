/**
 * ============================================================================
 * Riddles Hub — unified mode + difficulty picker
 * ============================================================================
 * Single entry page for all riddle gameplay:
 *   1. Stats banner (real totals + real per-riddle times from settings)
 *   2. Normal / Timer mode cards — expand in place to a level grid
 *   3. Category list — each category opens the same mode+level picker
 *
 * Play URL contract (unchanged): /riddle-mcq/play?subjectId=&level=&mode=
 * NOTE: category play currently resolves to the all-subjects mix at the
 * chosen level (no public category endpoint yet); revisit when backend adds
 * GET /riddle-mcq/categories/:id/riddles.
 * ============================================================================
 */

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

import {
  getSubjects,
  getCategories,
  getPublicLevelCounts,
  type RiddleMcqCategory,
  type RiddleMcqSubject,
} from '@/lib/riddle-mcq-api';

// ============================================================================
// Level metadata (riddles have 4 levels)
// ============================================================================

type Level = 'easy' | 'medium' | 'hard' | 'expert';

const LEVELS: { key: Level; label: string; emoji: string; color: string }[] = [
  { key: 'easy', label: 'Easy', emoji: '🌱', color: 'from-green-400 to-green-600' },
  { key: 'medium', label: 'Medium', emoji: '🌿', color: 'from-blue-400 to-blue-600' },
  { key: 'hard', label: 'Hard', emoji: '🌲', color: 'from-orange-400 to-orange-600' },
  { key: 'expert', label: 'Expert', emoji: '🔥', color: 'from-red-400 to-red-600' },
];

type Mode = 'practice' | 'timer';

interface CategoryWithCount extends RiddleMcqCategory {
  riddleTotal: number;
}

function emptyLevelCounts(): Record<Level, number> {
  return { easy: 0, medium: 0, hard: 0, expert: 0 };
}

// ============================================================================
// Page shell with Suspense (useSearchParams requires it during prerender)
// ============================================================================

export default function RiddlesPage(): JSX.Element {
  return (
    <Suspense fallback={<HubLoading label="Loading riddles..." />}>
      <RiddlesPageContent />
    </Suspense>
  );
}

// ============================================================================
// Loading / error states — user-facing copy only, no internals
// ============================================================================

function HubLoading({ label }: { label: string }): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-xl font-semibold text-white">{label}</p>
      </div>
    </main>
  );
}

function HubError({ message }: { message: string }): JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="rounded-2xl bg-white/95 p-8 text-center shadow-lg">
          <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Something went wrong</h1>
          <p className="mb-6 text-gray-600">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Shared mode + level picker (used at top level and inside categories)
// ============================================================================

function ModeLevelPicker({ counts }: { counts: Record<Level, number> }): JSX.Element {
  const [normalOpen, setNormalOpen] = useState(true);
  const [timerOpen, setTimerOpen] = useState(true);

  const grid = (mode: Mode) => (
    <div className="p-6">
      <p className="mb-4 text-sm text-gray-600">Select difficulty level:</p>
      <div className="grid grid-cols-4 gap-2">
        {LEVELS.map((level) => {
          const count = counts[level.key];
          return (
            <Link
              key={`${mode}-${level.key}`}
              href={`/riddle-mcq/play?subjectId=all&level=${level.key}&mode=${mode}`}
              aria-disabled={count === 0}
              className={`flex flex-col items-center rounded-xl bg-gradient-to-br ${level.color} p-3 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg ${
                count === 0 ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <span className="mb-1 text-xl">{level.emoji}</span>
              <span className="text-xs font-semibold">{level.label}</span>
              <span className="mt-1 text-[10px] opacity-90">{count} riddles</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      {/* Normal Mode */}
      <div className="overflow-hidden rounded-2xl bg-white/95 shadow-lg">
        <button
          onClick={() => setNormalOpen(!normalOpen)}
          aria-expanded={normalOpen}
          className="flex w-full items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl" aria-hidden="true">
              🎯
            </span>
            <div className="text-left">
              <span className="block text-xl font-bold">Normal Mode</span>
              <span className="text-sm opacity-90">Take your time, no pressure</span>
            </div>
          </div>
          {normalOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
        </button>
        {normalOpen && grid('practice')}
      </div>

      {/* Timer Mode */}
      <div className="overflow-hidden rounded-2xl bg-white/95 shadow-lg">
        <button
          onClick={() => setTimerOpen(!timerOpen)}
          aria-expanded={timerOpen}
          className="flex w-full items-center justify-between bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl" aria-hidden="true">
              ⏱️
            </span>
            <div className="text-left">
              <span className="block text-xl font-bold">Timer Mode</span>
              <span className="text-sm opacity-90">Race against the clock!</span>
            </div>
          </div>
          {timerOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
        </button>
        {timerOpen && grid('timer')}
      </div>
    </div>
  );
}

// ============================================================================
// Main content
// ============================================================================

function RiddlesPageContent(): JSX.Element {
  const searchParams = useSearchParams();
  const categorySlug = searchParams?.get('category') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<RiddleMcqSubject[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [allSubjectCounts, setAllSubjectCounts] =
    useState<Record<Level, number>>(emptyLevelCounts());
  const [subjectWise, setSubjectWise] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Critical data — hub can't render without these
        const [counts, subjectsData, categoriesData] = await Promise.all([
          getPublicLevelCounts(),
          getSubjects(true),
          getCategories(),
        ]);

        if (cancelled) return;

        setSubjects(subjectsData);

        const allSubject = emptyLevelCounts();
        Object.entries(counts.allSubject || {}).forEach(([level, count]) => {
          if (level in allSubject) allSubject[level as Level] = count;
        });
        setAllSubjectCounts(allSubject);
        setSubjectWise(counts.subjectWise || {});

        const totalBySlug = new Map<string, number>();
        Object.entries(counts.subjectWise || {}).forEach(([slug, byLevel]) => {
          const sum = Object.values(byLevel || {}).reduce((a, b) => a + b, 0);
          totalBySlug.set(slug, sum);
        });

        const withCounts = categoriesData
          .map((cat) => ({
            ...cat,
            riddleTotal: subjectsData
              .filter((s) => s.categoryId === cat.id)
              .reduce((sum, s) => sum + (totalBySlug.get(s.slug) || 0), 0),
          }))
          .filter((cat) => cat.riddleTotal > 0)
          .sort((a, b) => b.riddleTotal - a.riddleTotal);
        setCategories(withCounts);

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load riddles hub data:', err);
        setError(
          'We could not load the riddles right now. Please check your connection and try again.'
        );
        setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug) || null,
    [categories, categorySlug]
  );

  /** Per-category level counts = sum of subjectWise over the category's subjects */
  const categoryCounts = useMemo((): Record<Level, number> => {
    const counts = emptyLevelCounts();
    if (!activeCategory) return counts;
    subjects
      .filter((s) => s.categoryId === activeCategory.id)
      .forEach((s) => {
        const byLevel = subjectWise[s.slug] || {};
        LEVELS.forEach((l) => {
          counts[l.key] += byLevel[l.key] || 0;
        });
      });
    return counts;
  }, [activeCategory, subjects, subjectWise]);

  if (loading) return <HubLoading label="Loading riddles..." />;
  if (error) return <HubError message={error} />;

  // ------------------------------------------------------------------
  // Category view (?category=slug)
  // ------------------------------------------------------------------
  if (categorySlug) {
    if (!activeCategory) {
      return <HubError message="That category could not be found. It may have been removed." />;
    }
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/riddle-mcq"
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            All Categories
          </Link>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-gray-800">
              <span className="mr-3">{activeCategory.emoji || '📚'}</span>
              {activeCategory.name}
            </h1>
            <p className="font-medium text-white/90">Pick a mode and difficulty to start playing</p>
          </div>

          <ModeLevelPicker counts={categoryCounts} />
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------------
  // Overview view (/riddle-mcq)
  // ------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-gray-800">
            <span className="mx-3 opacity-80">🎭</span>
            Riddles
            <span className="mx-3 opacity-80">🎭</span>
          </h1>
          <p className="text-xl font-medium text-white/90">
            Challenge your brain with clever puzzles!
          </p>
        </div>

        {/* Mode selection */}
        <section aria-label="Game mode selection" className="mb-12">
          <ModeLevelPicker counts={allSubjectCounts} />
        </section>

        {/* Categories — subject-listing tile style */}
        {categories.length > 0 && (
          <section aria-label="Browse by category" className="mb-12">
            <h2 className="mb-4 text-center text-2xl font-bold text-white">
              📂 Browse by Category
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/riddle-mcq?category=${encodeURIComponent(cat.slug)}`}
                  className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-md transition-all hover:scale-105 hover:bg-white hover:shadow-xl"
                >
                  <span className="text-4xl" aria-hidden="true">
                    {cat.emoji || '📚'}
                  </span>
                  <span className="mt-2 font-bold text-gray-800">{cat.name}</span>
                  <span className="text-sm text-gray-500">{cat.riddleTotal} riddles</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
