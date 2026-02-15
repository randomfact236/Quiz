/**
 * ============================================================================
 * Settings Interface - Enterprise Grade
 * ============================================================================
 * Type definitions for dynamic settings management
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  defaultLimit: number;
  maxLimit: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  defaultTtl: number;
  categoriesTtl?: number;
  pattern?: string;
  subjectsTtl?: number;
  allSubjectsKey?: string;
}

/**
 * Global settings section
 */
export interface GlobalSettings {
  pagination: PaginationConfig;
  cache: CacheConfig;
}

/**
 * Dad jokes default settings
 */
export interface DadJokesDefaults {
  categoryEmoji: string;
}

/**
 * Dad jokes cache settings
 */
export interface DadJokesCache {
  categoriesTtl: number;
  pattern: string;
}

/**
 * Dad jokes settings section
 */
export interface DadJokesSettings {
  defaults: DadJokesDefaults;
  cache: DadJokesCache;
}

/**
 * Image riddles default settings
 */
export interface ImageRiddlesDefaults {
  categoryEmoji: string;
  timerSeconds: number;
  showTimer: boolean;
  difficulty: string;
}

/**
 * Image riddles timer settings
 */
export interface ImageRiddlesTimers {
  easy: number;
  medium: number;
  hard: number;
  expert: number;
}

/**
 * Image riddles cache settings
 */
export interface ImageRiddlesCache {
  categoriesTtl: number;
  pattern: string;
}

/**
 * Image riddles actions settings
 */
export interface ImageRiddlesActions {
  defaultPresets: string[];
}

/**
 * Image riddles settings section
 */
export interface ImageRiddlesSettings {
  defaults: ImageRiddlesDefaults;
  timers: ImageRiddlesTimers;
  difficulties: string[];
  cache: ImageRiddlesCache;
  actions: ImageRiddlesActions;
}

/**
 * Quiz default settings
 */
export interface QuizDefaults {
  // Default values if needed
}

/**
 * Quiz cache settings
 */
export interface QuizCache {
  subjectsTtl: number;
  allSubjectsKey: string;
}

/**
 * Quiz settings section
 */
export interface QuizSettings {
  defaults: QuizDefaults;
  difficulties: string[];
  cache: QuizCache;
}

/**
 * Riddles default settings
 */
export interface RiddlesDefaults {
  categoryEmoji: string;
  difficulty: string;
}

/**
 * Riddles cache settings
 */
export interface RiddlesCache {
  categoriesTtl: number;
  subjectsTtl: number;
  pattern: string;
}

/**
 * Riddles settings section
 */
export interface RiddlesSettings {
  defaults: RiddlesDefaults;
  difficulties: string[];
  cache: RiddlesCache;
}

/**
 * Complete application settings structure
 */
export interface AppSettings {
  global: GlobalSettings;
  dadJokes: DadJokesSettings;
  imageRiddles: ImageRiddlesSettings;
  quiz: QuizSettings;
  riddles: RiddlesSettings;
  [key: string]: unknown;
}

/**
 * Type for settings value (primitive or nested object)
 */
export type SettingsValue = string | number | boolean | object | unknown[] | null;

/**
 * Interface for authenticated user payload from JWT
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Interface for JWT validation result
 */
export interface JwtValidationResult {
  id: string;
  email: string;
  role: string;
}

/**
 * Interface for auth response
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

/**
 * Type for find conditions in TypeORM queries
 */
export type FindConditions<T> = {
  [K in keyof T]?: T[K] | { [operator: string]: T[K] };
};
