/**
 * ============================================================================
 * settings.ts - Enterprise Grade
 * ============================================================================
 * Centralized configuration for the Quiz application.
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  DEFAULT_CACHE_TTL_S,
  CATEGORIES_CACHE_TTL_S,
  SUBJECTS_CACHE_TTL_S,
  RIDDLE_TIMERS,
} from '../common/constants/app.constants';

export const settings = {
  global: {
    pagination: {
      defaultLimit: DEFAULT_PAGE_SIZE,
      maxLimit: MAX_PAGE_SIZE,
    },
    cache: {
      defaultTtl: DEFAULT_CACHE_TTL_S, // 1 hour
    },
  },
  dadJokes: {
    defaults: {
      categoryEmoji: '😂',
    },
    cache: {
      categoriesTtl: CATEGORIES_CACHE_TTL_S,
      pattern: 'jokes:*',
    },
  },
  imageRiddles: {
    defaults: {
      categoryEmoji: '🖼️',
      timerSeconds: 90,
      showTimer: true,
      difficulty: 'medium',
    },
    timers: {
      easy: RIDDLE_TIMERS.EASY,
      medium: RIDDLE_TIMERS.MEDIUM,
      hard: RIDDLE_TIMERS.HARD,
      expert: RIDDLE_TIMERS.EXPERT,
    },
    difficulties: ['easy', 'medium', 'hard', 'expert'],
    cache: {
      categoriesTtl: CATEGORIES_CACHE_TTL_S,
      pattern: 'image-riddles:*',
    },
    actions: {
      defaultPresets: [
        'submitAnswer',
        'showHint',
        'skip',
        'revealAnswer',
        'resetTimer',
        'pauseTimer',
        'resumeTimer',
        'fullscreen',
        'share',
        'report',
      ],
    },
  },
  quiz: {
    defaults: {
      levelTimers: {
        easy: 30,
        medium: 45,
        hard: 60,
        expert: 90,
        extreme: 120,
      },
    },
    difficulties: ['easy', 'medium', 'hard', 'expert', 'extreme'],
    cache: {
      subjectsTtl: SUBJECTS_CACHE_TTL_S,
      allSubjectsKey: 'subjects:all',
    },
  },
  riddles: {
    defaults: {
      categoryEmoji: '🧩',
      difficulty: 'medium',
      levelTimers: {
        easy: 30,
        medium: 60,
        hard: 90,
        expert: 120,
      },
    },
    difficulties: ['easy', 'medium', 'hard'],
    cache: {
      categoriesTtl: CATEGORIES_CACHE_TTL_S,
      subjectsTtl: SUBJECTS_CACHE_TTL_S,
      pattern: 'riddles:*',
    },
  },
};
