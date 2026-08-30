/**
 * ============================================================================
 * Quiz MCQ shared level constants
 * ============================================================================
 * Single source for difficulty-level metadata (was declared 4x across the
 * wizard page and both challenge hubs).
 * ============================================================================
 */

export const QUIZ_LEVELS = ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'] as const;

export type QuizLevel = (typeof QUIZ_LEVELS)[number];

export const QUIZ_LEVEL_EMOJIS: Record<QuizLevel, string> = {
  Easy: '🌱',
  Medium: '🌿',
  Hard: '🌲',
  Expert: '🔥',
  Extreme: '💀',
};

export const QUIZ_LEVEL_COLORS: Record<QuizLevel, string> = {
  Easy: 'from-green-400 to-green-600',
  Medium: 'from-blue-400 to-blue-600',
  Hard: 'from-orange-400 to-orange-600',
  Expert: 'from-red-400 to-red-600',
  Extreme: 'from-purple-500 to-pink-600',
};

/**
 * React Query key prefix shared by the public quiz-mcq wizard queries
 * (subjects, question-counts, subject detail, chapter questions). Admin
 * mutations invalidate this prefix so public pages reflect edits immediately.
 */
export const QUIZ_MCQ_PUBLIC_QUERY_PREFIX = 'quiz-mcq';

/**
 * Cap on stored quiz sessions (QUIZ_HISTORY). Sessions are localStorage-only;
 * without a cap the array grows unbounded and every write re-serializes the
 * whole history with full question payloads. Oldest entries are pruned.
 */
export const QUIZ_HISTORY_MAX = 50;
