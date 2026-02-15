import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import {
  ONE_HOUR_S,
  ONE_DAY_S,
  RIDDLE_TIMERS,
  DEFAULT_QUIZ_TIME_LIMIT,
  DEFAULT_PASSING_SCORE,
  DEFAULT_QUESTIONS_PER_QUIZ,
  MOCK_API_DELAY_MS,
} from '@/lib/constants';
import type {
    SystemSettings,
    QuizDefaults,
} from '@/types/settings.types';

// API_URL removed - using localStorage
// const API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';

// Re-export SystemSettings for backward compatibility
export type { SystemSettings };

/**
 * Default quiz configuration values
 */
const DEFAULT_QUIZ_DEFAULTS: QuizDefaults = {
    timeLimit: DEFAULT_QUIZ_TIME_LIMIT,
    passingScore: DEFAULT_PASSING_SCORE,
    showResults: true,
    allowRetries: true,
    questionsPerQuiz: DEFAULT_QUESTIONS_PER_QUIZ,
    shuffleQuestions: true,
    showExplanations: true,
};

const DEFAULT_MOCK_SETTINGS: SystemSettings = {
    global: {
        pagination: { defaultLimit: 10, maxLimit: 50 },
        cache: { defaultTtl: ONE_HOUR_S }
    },
    dadJokes: {
        defaults: { categoryEmoji: '😂' },
        cache: { categoriesTtl: ONE_DAY_S, pattern: 'jokes:*' }
    },
    imageRiddles: {
        defaults: { categoryEmoji: '🖼️', timerSeconds: 30, showTimer: true },
        timers: { easy: RIDDLE_TIMERS.EASY, medium: RIDDLE_TIMERS.MEDIUM, hard: RIDDLE_TIMERS.HARD, expert: RIDDLE_TIMERS.EXPERT },
        cache: { categoriesTtl: ONE_DAY_S, pattern: 'image-riddles:*' }
    },
    quiz: {
        defaults: DEFAULT_QUIZ_DEFAULTS,
        difficulties: ['easy', 'medium', 'hard'],
        cache: { subjectsTtl: ONE_DAY_S, allSubjectsKey: 'quiz:subjects' }
    },
    riddles: {
        defaults: { categoryEmoji: '🧩', difficulty: 'medium' },
        difficulties: ['easy', 'medium', 'hard'],
        cache: { categoriesTtl: ONE_DAY_S, subjectsTtl: ONE_DAY_S, pattern: 'riddles:*' }
    }
};

export const SettingsService = {
    async getSettings(): Promise<SystemSettings> {
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_MS));
        return getItem(STORAGE_KEYS.SETTINGS, DEFAULT_MOCK_SETTINGS);
    },

    async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
        await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_MS));
        const current = getItem(STORAGE_KEYS.SETTINGS, DEFAULT_MOCK_SETTINGS);

        // Shallow merge is sufficient as the settings UI typically sends full sections
        // or we can rely on the fact that we're replacing sections.
        const updated = { ...current, ...updates };

        setItem(STORAGE_KEYS.SETTINGS, updated);
        return updated;
    },
};
