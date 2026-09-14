/**
 * ============================================================================
 * SETTINGS TYPES - Type definitions for system settings
 * ============================================================================
 * @module types/settings.types
 * @description Type definitions for system settings management. The composed
 * sub-structure types (timers/cache/defaults per module) are internal to
 * `SystemSettings`; only the root shapes are exported.
 */

interface QuizLevelTimers {
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

interface QuizDefaults {
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

interface PaginationSettings {
  /** Default number of items per page */
  defaultLimit: number;
  /** Maximum allowed items per page */
  maxLimit: number;
}

interface CacheSettings {
  /** Default time-to-live in seconds */
  defaultTtl: number;
}

interface GlobalSettings {
  /** Pagination configuration */
  pagination: PaginationSettings;
  /** Cache configuration */
  cache: CacheSettings;
}

interface DadJokesCache {
  /** Categories cache TTL in seconds */
  categoriesTtl: number;
  /** Cache key pattern */
  pattern: string;
}

interface DadJokesDefaults {
  /** Default emoji for categories */
  categoryEmoji: string;
}

interface DadJokesSettings {
  /** Default values */
  defaults: DadJokesDefaults;
  /** Cache configuration */
  cache: DadJokesCache;
}

interface ImageRiddleTimers {
  /** Timer for easy riddles in seconds */
  easy: number;
  /** Timer for medium riddles in seconds */
  medium: number;
  /** Timer for hard riddles in seconds */
  hard: number;
  /** Timer for expert riddles in seconds */
  expert: number;
}

interface ImageRiddlesCache {
  /** Categories cache TTL in seconds */
  categoriesTtl: number;
  /** Cache key pattern */
  pattern: string;
}

interface ImageRiddlesDefaults {
  /** Default emoji for categories */
  categoryEmoji: string;
  /** Default timer duration in seconds */
  timerSeconds: number;
  /** Whether to show the timer */
  showTimer: boolean;
}

interface ImageRiddlesSettings {
  /** Default values */
  defaults: ImageRiddlesDefaults;
  /** Timer configuration per difficulty */
  timers: ImageRiddleTimers;
  /** Cache configuration */
  cache: ImageRiddlesCache;
}

interface QuizCache {
  /** Subjects cache TTL in seconds */
  subjectsTtl: number;
  /** Cache key for all subjects */
  allSubjectsKey: string;
}

interface QuizSettings {
  /** Default quiz configuration values */
  defaults: QuizDefaults;
  /** Available difficulty levels */
  difficulties: string[];
  /** Cache configuration */
  cache: QuizCache;
}

interface RiddleLevelTimers {
  /** Timer for easy riddles */
  easy: number;
  /** Timer for medium riddles */
  medium: number;
  /** Timer for hard riddles */
  hard: number;
  /** Timer for expert riddles */
  expert: number;
}

interface RiddlesDefaults {
  /** Default emoji for categories */
  categoryEmoji: string;
  /** Default difficulty level */
  difficulty: string;
  /** Per-level timer settings */
  levelTimers?: RiddleLevelTimers;
}

interface RiddlesCache {
  /** Categories cache TTL in seconds */
  categoriesTtl: number;
  /** Subjects cache TTL in seconds */
  subjectsTtl: number;
  /** Cache key pattern */
  pattern: string;
}

interface RiddlesSettings {
  /** Default values */
  defaults: RiddlesDefaults;
  /** Available difficulty levels */
  difficulties: string[];
  /** Cache configuration */
  cache: RiddlesCache;
}

/**
 * Per-platform social-card override (empty strings = use the global fallback)
 */
export interface SeoSocialOverride {
  /** Absolute or /uploads/... image URL */
  image: string;
  title: string;
  description: string;
}

interface SeoGoogleOverride {
  description: string;
}

/**
 * Site-wide SEO metadata (consumed by the root layout's generateMetadata)
 */
export interface SeoSettings {
  /** Brand name used in OG siteName and fallbacks */
  siteName: string;
  /** Homepage <title> */
  titleDefault: string;
  /** Next.js title template, `%s` is the page title */
  titleTemplate: string;
  /** Default meta description */
  description: string;
  /** Meta keywords */
  keywords: string[];
  /** Absolute URL to the social-share image; empty = none */
  ogImageUrl: string;
  /** Twitter @handle without the @; empty = none */
  twitterHandle: string;
  /** Google Search Console verification token; empty = none */
  googleSiteVerification: string;
  /** Per-platform overrides (fallback chain: page → override → global → auto image) */
  facebook: SeoSocialOverride;
  twitter: SeoSocialOverride;
  google: SeoGoogleOverride;
}

/**
 * Social media profile links (full URLs; empty = footer icon hidden)
 */
export interface SiteSocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  twitter: string;
}

/**
 * Site Information branding (logo, favicon, names, banner, socials)
 */
export interface SiteSettings {
  /** Brand name; empty = fall back to seo.siteName */
  siteName: string;
  /** Brand description; empty = fall back to seo.description */
  siteDescription: string;
  /** /uploads/... path or absolute URL; empty = text-only brand */
  logo: string;
  /** /uploads/... path or absolute URL; empty = file-convention icon */
  favicon: string;
  /** Browser tab shows "Page | Tagline"; empty = the site name */
  tabTagline: string;
  socialLinks: SiteSocialLinks;
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
  /** Site Information branding */
  site: SiteSettings;
  /** Site-wide SEO metadata */
  seo: SeoSettings;
}

/**
 * Settings tab identifiers for admin panel
 */
export type SettingsTab = 'site' | 'general' | 'quiz-mcq' | 'jokes' | 'riddles' | 'imageRiddles';

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
