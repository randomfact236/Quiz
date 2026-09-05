'use client';

/**
 * ============================================================================
 * TopicSection — "Quiz Topics" (plan/13 §4b + owner design 07 blend)
 * ============================================================================
 * Subjects grouped under three fixed world banners (Academic / Professional
 * & Life / Entertainment & Culture, purple gradient bars per the owner's
 * reference). Cards are gradient tiles with emoji + question count; zero-
 * question subjects render as Coming Soon.
 *
 * Auto-ordering (owner request): groups and the subjects inside them are
 * ordered by play clicks (session_started per subject, via the public
 * GET /quiz-mcq/subject-clicks endpoint) — highest first. Falls back to the
 * original order when the popularity feed is unavailable.
 * ============================================================================
 */

import { useEffect, useState, useMemo } from 'react';
import { getSubjects, getQuestionsBySubject } from '@/lib/quiz-mcq-api';
import type { QuizSubject } from '@/lib/quiz-mcq-api';

interface Subject extends QuizSubject {
  category: string;
  order?: number;
}

/** The three fixed homepage worlds, in fallback display order. */
const CATEGORY_GROUPS = ['Academic', 'Professional & Life', 'Entertainment & Culture'] as const;

/** Gradient palette cycled across subject cards. */
const CARD_GRADIENTS = [
  'bg-gradient-to-br from-indigo-500 to-purple-400',
  'bg-gradient-to-br from-pink-500 to-pink-300',
  'bg-gradient-to-br from-sky-400 to-cyan-300',
  'bg-gradient-to-br from-green-400 to-emerald-300',
  'bg-gradient-to-br from-orange-400 to-amber-300',
  'bg-gradient-to-br from-indigo-900 to-purple-900',
];

interface SectionProps {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/** Purple gradient banner header with decorative lines + chevron. */
function Banner({ title, count, expanded, onToggle, children }: SectionProps): JSX.Element {
  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${title} section` : `Expand ${title} section`}
        className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-[#c3b9f5] via-[#a79bf0] to-[#c3b9f5] px-6 py-3 shadow-[0_6px_16px_rgba(109,91,208,.28)]"
      >
        <span className="h-0.5 flex-1 rounded bg-white/80" />
        <span className="whitespace-nowrap text-base font-extrabold uppercase tracking-wider text-white drop-shadow-[0_2px_5px_rgba(60,45,140,.45)]">
          {title}
        </span>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold text-[#6d5bd0]">
          {count}
        </span>
        <span className="h-0.5 flex-1 rounded bg-white/80" />
        <span className={`text-white transition-transform ${expanded ? '' : '-rotate-90'}`}>▼</span>
      </button>
      {expanded && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function TopicsSection(): JSX.Element {
  const [topicsExpanded, setTopicsExpanded] = useState(true);
  const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [clicks, setClicks] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const subjectsData = (await getSubjects(false)) as Subject[];
        const sortedSubjects = subjectsData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const counts: Record<string, number> = {};
        for (const subject of subjectsData) {
          try {
            const questions = await getQuestionsBySubject(subject.slug, { status: 'published' });
            if (questions.total > 0) {
              counts[subject.slug] = questions.total;
            }
          } catch (err) {
            console.error(`Failed to load questions for ${subject.slug}:`, err);
          }
        }

        setSubjects(sortedSubjects);
        setQuestionCounts(counts);

        // Initialize found categories expanded
        const uniqueCategories = Array.from(
          new Set(sortedSubjects.map((s) => s.category || 'Other'))
        );
        setCategoryExpanded((prev) => {
          const initial: Record<string, boolean> = {};
          uniqueCategories.forEach((cat) => {
            initial[cat] = true;
          });
          return { ...initial, ...prev };
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load topics');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Popularity feed (separate effect: optional — failure keeps default order).
  useEffect(() => {
    if (subjects.length === 0) return;
    let stale = false;
    fetch(
      `${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api'}/v1/quiz-mcq/subject-clicks`
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((rows: { subject: string; clicks: number }[]) => {
        if (stale) return;
        const map: Record<string, number> = {};
        rows.forEach((r) => {
          map[r.subject] = r.clicks;
        });
        setClicks(map);
      })
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [subjects.length]);

  const toggleCategory = (category: string) => {
    setCategoryExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  /** Assign each subject to one of the three fixed worlds (or Other). */
  const groupOf = (subject: Subject): string => {
    const cat = (subject.category || '').trim().toLowerCase();
    if (cat === 'academic') return 'Academic';
    if (cat === 'professional' || cat === 'professional & life' || cat === 'professional and life')
      return 'Professional & Life';
    if (
      cat === 'entertainment' ||
      cat === 'entertainment & culture' ||
      cat === 'entertainment and culture'
    )
      return 'Entertainment & Culture';
    return 'Other';
  };

  const orderedGroups = useMemo(() => {
    const grouped: Record<string, Subject[]> = {};
    subjects.forEach((subject) => {
      const key = groupOf(subject);
      (grouped[key] ??= []).push(subject);
    });

    const clickOf = (s: Subject): number => clicks[s.slug] ?? 0;
    const sorter = (a: Subject, b: Subject): number =>
      clickOf(b) - clickOf(a) || (a.order ?? 0) - (b.order ?? 0);

    // The three fixed worlds ALWAYS render (empty ones show Coming Soon);
    // subjects outside them land in an "Other" group only when present.
    const ordered: { name: string; items: Subject[] }[] = CATEGORY_GROUPS.map((name) => ({
      name,
      items: (grouped[name] ?? []).sort(sorter),
    }));
    const other = (grouped['Other'] ?? []).sort(sorter);
    if (other.length > 0) ordered.push({ name: 'Other', items: other });
    // Re-sort worlds by total clicks, descending.
    ordered.sort(
      (a, b) =>
        b.items.reduce((acc, s) => acc + (clicks[s.slug] ?? 0), 0) -
        a.items.reduce((acc, s) => acc + (clicks[s.slug] ?? 0), 0)
    );
    return ordered;
    // clicks intentionally re-triggers ordering as the popularity feed lands.
  }, [subjects, clicks]);

  const hasAnySubjects = subjects.length > 0;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
      <button
        onClick={() => setTopicsExpanded(!topicsExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
        aria-label={topicsExpanded ? 'Collapse Quiz Topics section' : 'Expand Quiz Topics section'}
        aria-expanded={topicsExpanded}
      >
        <h2 className="text-xl font-bold text-gray-800">🗂️ Quiz Topics</h2>
        <span
          className={`text-gray-500 transition-transform ${topicsExpanded ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>

      {topicsExpanded && (
        <div className="space-y-5 p-4 pt-0">
          {error ? (
            <div className="py-8 text-center text-red-400">
              <p className="mb-2 text-3xl">⚠️</p>
              <p className="text-sm font-medium">Failed to load topics</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="py-8 text-center text-gray-400">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              <p className="text-sm">Loading topics...</p>
            </div>
          ) : !hasAnySubjects ? (
            <div className="py-8 text-center text-gray-400">
              <p className="mb-2 text-3xl">📭</p>
              <p className="text-sm font-medium">No quiz topics available yet.</p>
              <p className="mt-1 text-xs">Check back soon or ask the admin to add subjects.</p>
            </div>
          ) : (
            orderedGroups.map(({ name, items }) => {
              const isExpanded = categoryExpanded[name] ?? true;
              const totalClicks = items.reduce((acc, s) => acc + (clicks[s.slug] ?? 0), 0);
              return (
                <Banner
                  key={name}
                  title={name}
                  count={items.length}
                  expanded={isExpanded}
                  onToggle={() => toggleCategory(name)}
                >
                  {name === 'Other' && totalClicks === 0 && (
                    <p className="mb-3 text-xs text-gray-400">
                      Subjects without a world — assign Academic / Professional &amp; Life /
                      Entertainment &amp; Culture in the admin panel.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {items.length === 0 && (
                      <div className="relative flex min-h-[112px] flex-col items-center justify-end gap-1.5 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-200 px-3 pb-3 pt-4 text-center text-slate-500 shadow-[0_8px_18px_rgba(61,53,100,.12)]">
                        <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-0.5 text-[11px] font-extrabold text-gray-700 shadow">
                          Coming Soon
                        </span>
                        <span className="mb-auto mt-1 text-4xl opacity-50">🕒</span>
                        <span className="text-sm font-extrabold">New subjects soon</span>
                        <span className="text-[11px] font-semibold opacity-75">
                          assignable in admin
                        </span>
                      </div>
                    )}
                    {items.map((subject, idx) => {
                      const questionTotal = questionCounts[subject.slug] || 0;
                      const coming = questionTotal === 0;
                      return (
                        <a
                          key={subject.id}
                          href={coming ? undefined : `/quiz-mcq?subject=${subject.slug}`}
                          className={`relative flex min-h-[112px] flex-col items-center justify-end gap-1.5 rounded-2xl px-3 pb-3 pt-4 text-center text-white shadow-[0_8px_18px_rgba(61,53,100,.2)] transition-transform ${
                            coming ? 'cursor-default' : 'hover:-translate-y-1 hover:scale-[1.02]'
                          } ${CARD_GRADIENTS[idx % CARD_GRADIENTS.length]}`}
                        >
                          {coming && (
                            <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-0.5 text-[11px] font-extrabold text-gray-700 shadow">
                              Coming Soon
                            </span>
                          )}
                          <span
                            className={`mb-auto mt-1 text-4xl drop-shadow-[0_3px_4px_rgba(0,0,0,.25)] ${
                              coming ? 'opacity-55' : ''
                            }`}
                          >
                            {subject.emoji || '📚'}
                          </span>
                          <span
                            className={`text-sm font-extrabold leading-tight drop-shadow-[0_2px_5px_rgba(0,0,0,.3)] ${
                              coming ? 'opacity-55' : ''
                            }`}
                          >
                            {subject.name}
                          </span>
                          <span className="text-[11px] font-semibold opacity-85">
                            {coming
                              ? 'Coming Soon'
                              : `${questionTotal} question${questionTotal === 1 ? '' : 's'}`}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </Banner>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
