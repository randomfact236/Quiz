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
