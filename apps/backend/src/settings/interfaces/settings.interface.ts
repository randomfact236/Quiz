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
 * Quiz per-level timer settings (seconds)
 */
export interface QuizLevelTimers {
  easy: number;
  medium: number;
  hard: number;
  expert: number;
  extreme: number;
}

/**
 * Quiz default settings
 */
export interface QuizDefaults {
  levelTimers: QuizLevelTimers;
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
export interface RiddlesLevelTimers {
  easy: number;
  medium: number;
  hard: number;
  expert: number;
}

export interface RiddlesDefaults {
  categoryEmoji: string;
  difficulty: string;
  levelTimers: RiddlesLevelTimers;
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
 * Per-platform social-card override; empty strings mean "use the global fallback"
 */
export interface SeoPlatformOverride {
  image: string;
  title: string;
  description: string;
}

/**
 * Google shows only a description (title comes from the page's <title>)
 */
export interface SeoGoogleOverride {
  description: string;
}

/**
 * Site-wide SEO metadata (rendered into the root layout's meta tags)
 */
export interface SeoSettings {
  siteName: string;
  titleDefault: string;
  /** Next.js title template, `%s` is the page title */
  titleTemplate: string;
  description: string;
  keywords: string[];
  /** Absolute URL to the social-share image; empty = none */
  ogImageUrl: string;
  /** @handle without the @; empty = none */
  twitterHandle: string;
  /** Google Search Console verification token; empty = none */
  googleSiteVerification: string;
  facebook: SeoPlatformOverride;
  twitter: SeoPlatformOverride;
  google: SeoGoogleOverride;
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
  seo: SeoSettings;
  [key: string]: unknown;
}

/**
 * Type for settings value (primitive or nested object)
 */
export type SettingsValue = string | number | boolean | object | unknown[] | null;
