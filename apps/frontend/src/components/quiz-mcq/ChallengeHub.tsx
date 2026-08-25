/**
 * ============================================================================
 * Challenge Hub — shared by /quiz-mcq/timer-challenge and /quiz-mcq/practice-mode
 * ============================================================================
 * One parameterized component for the two challenge-mode hubs (P1 refactor,
 * was ~430 duplicated lines per page). Each route keeps its own thin page
 * file and can diverge independently:
 *   - via this component's config props, or
 *   - by rendering additional sections around/beside <ChallengeHub> in the
 *     page file (extraContent slot).
 * ============================================================================
 */

'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Target,
  Layers,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react';

import { getSubjects, getQuestionsBySubject } from '@/lib/quiz-mcq-api';
import type { QuizSubject } from '@/lib/quiz-mcq-api';
import {
  QUIZ_LEVELS,
  QUIZ_LEVEL_EMOJIS,
  QUIZ_LEVEL_COLORS,
  type QuizLevel,
} from '@/lib/quiz-mcq-constants';

export interface ChallengeHubConfig {
  /** Play mode written into the /quiz-mcq/play URL. */
  mode: 'timer' | 'practice';
  /** Page title, e.g. "Timer Challenge Mode". */
  title: string;
  /** Emoji shown next to the title. */
  titleEmoji: string;
  /** Icon on the Complete Mix start button. */
  startIcon: LucideIcon;
  /** Complete Mix section tagline ("Ultimate challenge!"). */
  completeMixTagline: string;
  /** Complete Mix section body copy. */
  completeMixBody: string;
  /** Complete Mix start button label. */
  completeMixButtonLabel: string;
  /** Zero-question subject tiles show "Coming Soon" instead of a count. */
  showComingSoon?: boolean;
}

interface LevelCount {
  subjectWise: Record<string, Record<string, number>>;
  allSubject: Record<string, number>;
  completeMix: number;
}

// Group array into chunks of size n
function chunkArray<T>(arr: T[], n: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    chunks.push(arr.slice(i, i + n));
  }
  return chunks;
}

export function ChallengeHub({
  config,
  extraContent,
}: {
  config: ChallengeHubConfig;
  /** Escape hatch for mode-specific sections without forking the component. */
  extraContent?: ReactNode;
}): JSX.Element {
  const { mode } = config;
  const router = useRouter();
  const [subjects, setSubjects] = useState<QuizSubject[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Foldable sections state - default expanded
  const [subjectWiseOpen, setSubjectWiseOpen] = useState(true);
  const [allSubjectOpen, setAllSubjectOpen] = useState(true);
  const [completeMixOpen, setCompleteMixOpen] = useState(true);

  // Expanded subject for showing levels
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Question counts
  const [levelCounts, setLevelCounts] = useState<LevelCount>({
    subjectWise: {},
    allSubject: {},
    completeMix: 0,
  });

  useEffect(() => {
    setIsHydrated(true);

    const loadData = async () => {
      try {
        const subjectsData = await getSubjects(false);
        const subjectList = subjectsData.length > 0 ? subjectsData : [];
        setSubjects(subjectList);

        const counts: LevelCount = {
          subjectWise: {},
          allSubject: {},
          completeMix: 0,
        };

        QUIZ_LEVELS.forEach((level) => {
          counts.allSubject[level.toLowerCase()] = 0;
        });

        for (const subject of subjectsData) {
          counts.subjectWise[subject.slug] = {};

          try {
            const questionsResult = await getQuestionsBySubject(subject.slug, {
              status: 'published',
            });
            const questions = questionsResult.data;

            questions.forEach((q) => {
              if (q.level) {
                const level = q.level.toLowerCase();

                if (!counts.subjectWise[subject.slug]) {
                  counts.subjectWise[subject.slug] = {};
                }
                const subjectCounts = counts.subjectWise[subject.slug]!;
                if (!subjectCounts[level]) {
                  subjectCounts[level] = 0;
                }
                subjectCounts[level]++;

                if (counts.allSubject[level] !== undefined) {
                  counts.allSubject[level]++;
                }

                counts.completeMix++;
              }
            });
          } catch (error) {
            console.error(`Failed to load questions for subject: ${subject.slug}`, error);
          }
        }

        setLevelCounts(counts);
      } catch (error) {
        console.error('Failed to load subjects:', error);
      }
    };

    loadData();
  }, []);

  // Group subjects into rows of 4 for desktop
  const subjectRows = useMemo(() => chunkArray(subjects, 4), [subjects]);

  const handleStartSubjectWise = (subject: string, level: QuizLevel) => {
    router.push(
      `/quiz-mcq/play?subject=${subject}&chapter=all&level=${level.toLowerCase()}&mode=${mode}&type=challenge`
    );
  };

  const handleStartAllSubjectLevelWise = (level: QuizLevel) => {
    router.push(
      `/quiz-mcq/play?subject=all&chapter=all&level=${level.toLowerCase()}&mode=${mode}&type=challenge`
    );
  };

  const handleStartCompleteMix = () => {
    router.push(`/quiz-mcq/play?subject=all&chapter=all&level=all&mode=${mode}&type=challenge`);
  };

  const getSubjectWiseCount = (subject: string, level: QuizLevel): number => {
    return levelCounts.subjectWise[subject]?.[level.toLowerCase()] || 0;
  };

  const getAllSubjectCount = (level: QuizLevel): number => {
    return levelCounts.allSubject[level.toLowerCase()] || 0;
  };

  const getTotalQuestionsForSubject = (subject: string): number => {
    const subjectCounts = levelCounts.subjectWise[subject] || {};
    return Object.values(subjectCounts).reduce((sum, count) => sum + count, 0);
  };

  const toggleSubject = (slug: string) => {
    setExpandedSubject(expandedSubject === slug ? null : slug);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/quiz-mcq"
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz
          </Link>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center text-3xl font-bold text-white"
        >
          <span className="mr-2">{config.titleEmoji}</span>
          {config.title}
        </motion.h1>

        <div className="space-y-6">
          {/* Subject Wise Mix */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/95 shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setSubjectWiseOpen(!subjectWiseOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">Subject Wise Mix</span>
                  <span className="text-sm opacity-90">
                    Click a subject to select difficulty level
                  </span>
                </div>
              </div>
              {subjectWiseOpen ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </button>

            {subjectWiseOpen && (
              <div className="p-6">
                {/* Subjects Grid with Full Width Levels */}
                <div className="flex flex-col gap-3">
                  {subjectRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="contents">
                      {/* Subjects Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {row.map((subject) => {
                          const totalQuestions = getTotalQuestionsForSubject(subject.slug);
                          const isExpanded = expandedSubject === subject.slug;

                          return (
                            <button
                              key={subject.slug}
                              onClick={() => toggleSubject(subject.slug)}
                              disabled={totalQuestions === 0}
                              className={`flex flex-col items-center rounded-xl p-4 text-center shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                isExpanded
                                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-2 ring-blue-300'
                                  : 'bg-white border-2 border-gray-100 hover:border-blue-200'
                              }`}
                            >
                              <span className="text-3xl mb-1">{subject.emoji}</span>
                              <span
                                className={`font-semibold text-sm ${isExpanded ? 'text-white' : 'text-gray-800'}`}
                              >
                                {subject.name}
                              </span>
                              <span
                                className={`text-xs mt-1 ${
                                  isExpanded
                                    ? 'text-white/80'
                                    : config.showComingSoon && totalQuestions === 0
                                      ? 'text-orange-500'
                                      : 'text-gray-500'
                                }`}
                              >
                                {config.showComingSoon && totalQuestions === 0
                                  ? 'Coming Soon'
                                  : isHydrated
                                    ? `${totalQuestions} Qs`
                                    : '...'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Full Width Levels - shown if any subject in this row is expanded */}
                      <AnimatePresence>
                        {row.some((s) => s.slug === expandedSubject) && expandedSubject && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                              <p className="text-center text-sm text-gray-600 mb-3">
                                Select difficulty level for{' '}
                                <span className="font-semibold text-blue-600">
                                  {subjects.find((s) => s.slug === expandedSubject)?.name}
                                </span>
                              </p>
                              <div className="grid grid-cols-5 gap-3">
                                {QUIZ_LEVELS.map((level) => {
                                  const count = getSubjectWiseCount(expandedSubject, level);
                                  return (
                                    <button
                                      key={`${expandedSubject}-${level}`}
                                      onClick={() => handleStartSubjectWise(expandedSubject, level)}
                                      disabled={count === 0}
                                      title={`${level}: ${count} questions`}
                                      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                                        count > 0
                                          ? `bg-gradient-to-br ${QUIZ_LEVEL_COLORS[level]}`
                                          : 'bg-gray-300'
                                      }`}
                                    >
                                      <span className="text-2xl mb-1">
                                        {QUIZ_LEVEL_EMOJIS[level]}
                                      </span>
                                      <span className="font-semibold text-sm">{level}</span>
                                      <span className="text-xs mt-1 opacity-90">{count} Qs</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* All Subject Level Wise Mix */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/95 shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setAllSubjectOpen(!allSubjectOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Layers className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">All Subject Level Wise Mix</span>
                  <span className="text-sm opacity-90">
                    Questions from all subjects at selected difficulty
                  </span>
                </div>
              </div>
              {allSubjectOpen ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </button>

            {allSubjectOpen && (
              <div className="p-6">
                <p className="mb-4 text-sm text-gray-600">Select difficulty level:</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {QUIZ_LEVELS.map((level) => {
                    const count = isHydrated ? getAllSubjectCount(level) : 0;
                    return (
                      <button
                        key={`all-subject-${level}`}
                        onClick={() => handleStartAllSubjectLevelWise(level)}
                        disabled={count === 0}
                        className={`flex flex-col items-center rounded-xl bg-gradient-to-br ${QUIZ_LEVEL_COLORS[level]} p-4 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="text-2xl mb-1">{QUIZ_LEVEL_EMOJIS[level]}</span>
                        <span className="font-semibold text-sm">{level}</span>
                        <span className="mt-1 text-xs opacity-90">
                          {isHydrated ? `${count} Qs` : '...'}
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
            className="rounded-2xl bg-white/95 shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setCompleteMixOpen(!completeMixOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Grid3X3 className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">Complete Mix</span>
                  <span className="text-sm opacity-90">{config.completeMixTagline}</span>
                </div>
              </div>
              {completeMixOpen ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </button>

            {completeMixOpen && (
              <div className="p-6 text-center">
                <p className="mb-4 text-gray-600">{config.completeMixBody}</p>
                <div className="mb-6 flex justify-center gap-4 text-sm">
                  <span className="rounded-full bg-purple-100 px-4 py-2 text-purple-700">
                    {isHydrated ? `${levelCounts.completeMix} Total Questions` : 'Loading...'}
                  </span>
                  <span className="rounded-full bg-pink-100 px-4 py-2 text-pink-700">
                    All 5 Levels
                  </span>
                </div>
                <button
                  onClick={handleStartCompleteMix}
                  disabled={!isHydrated || levelCounts.completeMix === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <config.startIcon className="h-5 w-5" />
                  {config.completeMixButtonLabel}
                </button>
              </div>
            )}
          </motion.div>

          {/* Mode-specific extension point — render nothing by default */}
          {extraContent ? <AnimatePresence>{extraContent}</AnimatePresence> : null}
        </div>
      </div>
    </div>
  );
}
