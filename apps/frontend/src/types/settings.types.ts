/**
 * ============================================================================
 * SETTINGS TYPES - Type definitions for system settings
 * ============================================================================
 * @module types/settings.types
 * @description Enterprise-grade type definitions for system settings management
 */

/**
 * Quiz timer settings per difficulty level (in seconds)
 */
export interface QuizLevelTimers {
  /** Timer for easy level */
  easy: number;
  /** Timer for medium level */
  medium: number;
  /** Timer for hard level */
  hard: number;
  /** Timer for expert level */
  expert: number;
  /** Timer for extreme level */
  extreme: number;
}

/**
 * Quiz default configuration properties
 */
export interface QuizDefaults {
  /** Default time limit for quizzes in seconds (fallback if level-specific not set) */
  timeLimit?: number;
  /** Per-level timer settings */
  levelTimers?: QuizLevelTimers;
  /** Default passing score percentage */
  passingScore?: number;
  /** Whether to show results immediately */
  showResults?: boolean;
  /** Whether to allow retries */
  allowRetries?: boolean;
  /** Default number of questions per quiz */
  questionsPerQuiz?: number;
  /** Whether to shuffle questions */
  shuffleQuestions?: boolean;
  /** Whether to show explanations */
  showExplanations?: boolean;
}

/**
 * Global pagination settings
 */
export interface PaginationSettings {
  /** Default number of items per page */
  defaultLimit: number;
  /** Maximum allowed items per page */
  maxLimit: number;
}

/**
 * Global cache settings
 */
export interface CacheSettings {
  /** Default time-to-live in seconds */
  defaultTtl: number;
}

/**
 * Global settings section
 */
export interface GlobalSettings {
  /** Pagination configuration */
  pagination: PaginationSettings;
  /** Cache configuration */
  cache: CacheSettings;
}

/**
 * Dad jokes cache settings
 */
export interface DadJokesCache {
  /** Categories cache TTL in seconds */
  categoriesTtl: number;
  /** Cache key pattern */
  pattern: string;
}

/**
 * Dad jokes default settings
 */
export interface DadJokesDefaults {
  /** Default emoji for categories */
  categoryEmoji: string;
}

/**
 * Dad jokes settings section
 */
export interface DadJokesSettings {
  /** Default values */
  defaults: DadJokesDefaults;
  /** Cache configuration */
  cache: DadJokesCache;
}

/**
 * Image riddle timer settings per difficulty
 */
export interface ImageRiddleTimers {
  /** Timer for easy riddles in seconds */
  easy: number;
  /** Timer for medium riddles in seconds */
  medium: number;
  /** Timer for hard riddles in seconds */
  hard: number;
  /** Timer for expert riddles in seconds */
  expert: number;
}

/**
 * Image riddles cache settings
 */
export interface ImageRiddlesCache {
  /** Categories cache TTL in seconds */
  categoriesTtl: number;
  /** Cache key pattern */
  pattern: string;
}

/**
 * Image riddles default settings
 */
export interface ImageRiddlesDefaults {
  /** Default emoji for categories */
  categoryEmoji: string;
  /** Default timer duration in seconds */
  timerSeconds: number;
  /** Whether to show the timer */
  showTimer: boolean;
}

/**
 * Image riddles settings section
 */
export interface ImageRiddlesSettings {
  /** Default values */
  defaults: ImageRiddlesDefaults;
  /** Timer configuration per difficulty */
  timers: ImageRiddleTimers;
  /** Cache configuration */
  cache: ImageRiddlesCache;
}

/**
 * Quiz cache settings
 */
export interface QuizCache {
  /** Subjects cache TTL in seconds */
  subjectsTtl: number;
  /** Cache key for all subjects */
  allSubjectsKey: string;
}

/**
 * Quiz settings section
 */
export interface QuizSettings {
  /** Default quiz configuration values */
  defaults: QuizDefaults;
  /** Available difficulty levels */
  difficulties: string[];
  /** Cache configuration */
  cache: QuizCache;
}

/**
 * Riddles default settings
 */
export interface RiddlesDefaults {
  /** Default emoji for categories */
  categoryEmoji: string;
  /** Default difficulty level */
  difficulty: string;
}

/**
 * Riddles cache settings
 */
export interface RiddlesCache {
  /** Categories cache TTL in seconds */
  categoriesTtl: number;
  /** Subjects cache TTL in seconds */
  subjectsTtl: number;
  /** Cache key pattern */
  pattern: string;
}

/**
 * Riddles settings section
 */
export interface RiddlesSettings {
  /** Default values */
  defaults: RiddlesDefaults;
  /** Available difficulty levels */
  difficulties: string[];
  /** Cache configuration */
  cache: RiddlesCache;
}

/**
 * Complete system settings structure
 */
export interface SystemSettings {
  /** Global application settings */
  global: GlobalSettings;
  /** Dad jokes module settings */
  dadJokes: DadJokesSettings;
  /** Image riddles module settings */
  imageRiddles: ImageRiddlesSettings;
  /** Quiz module settings */
  quiz: QuizSettings;
  /** Riddles module settings */
  riddles: RiddlesSettings;
}

/**
 * Settings API response structure
 */
export interface SettingsResponse {
  /** Whether the request was successful */
  success: boolean;
  /** The settings data */
  data: SystemSettings;
  /** Response message */
  message?: string;
  /** Timestamp of the response */
  timestamp: string;
}

/**
 * Settings update request payload
 */
export type SettingsUpdatePayload = Partial<SystemSettings>;

/**
 * Settings update response structure
 */
export interface SettingsUpdateResponse {
  /** Whether the update was successful */
  success: boolean;
  /** The updated settings data */
  data: SystemSettings;
  /** Response message */
  message?: string;
  /** Timestamp of the response */
  timestamp: string;
}

/**
 * Settings tab identifiers for admin panel
 */
export type SettingsTab = 'general' | 'quiz' | 'jokes' | 'riddles' | 'imageRiddles';

/**
 * Settings form data type (partial system settings for form handling)
 */
export type SettingsFormData = Partial<SystemSettings>;

/**
 * Nested settings value type for generic operations
 */
export type SettingsValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SettingsValue[]
  | { [key: string]: SettingsValue };

/**
 * Type guard for SettingsTab
 */
export function isSettingsTab(value: unknown): value is SettingsTab {
  return (
    typeof value === 'string' &&
    ['general', 'quiz', 'jokes', 'riddles', 'imageRiddles'].includes(value)
  );
}

/**
 * Type guard for SystemSettings
 */
export function isSystemSettings(value: unknown): value is SystemSettings {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const settings = value as Record<string, unknown>;
  return (
    typeof settings['global'] === 'object' &&
    typeof settings['quiz'] === 'object' &&
    typeof settings['dadJokes'] === 'object' &&
    typeof settings['riddles'] === 'object' &&
    typeof settings['imageRiddles'] === 'object'
  );
}
