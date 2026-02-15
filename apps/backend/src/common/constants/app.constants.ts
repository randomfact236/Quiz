/**
 * ============================================================================
 * APPLICATION CONSTANTS - Enterprise Grade
 * ============================================================================
 * @module common/constants/app.constants
 * @description Centralized constants for the backend application.
 * All magic numbers should be defined here and imported where needed.
 * ============================================================================
 */

// =============================================================================
// PORT NUMBERS
// =============================================================================

/**
 * Default PostgreSQL database port
 * @default 5432
 */
export const DB_PORT = 5432;

/**
 * Default Redis server port
 * @default 6379
 */
export const REDIS_PORT = 6379;

/**
 * Default backend server port
 * @default 4000
 */
export const SERVER_PORT = 4000;

/**
 * Default frontend application port
 * @default 3010
 */
export const FRONTEND_PORT = 3010;

// =============================================================================
// PAGINATION
// =============================================================================

/**
 * Default number of items per page
 * @default 20
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum allowed items per page
 * @default 100
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Minimum page number
 * @default 1
 */
export const MIN_PAGE_NUMBER = 1;

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Rate limit time-to-live in milliseconds (1 minute)
 * @default 60000
 */
export const RATE_LIMIT_TTL_MS = 60000;

/**
 * Maximum number of requests allowed per rate limit window
 * @default 100
 */
export const RATE_LIMIT_MAX_REQUESTS = 100;

// =============================================================================
// TIME VALUES (Milliseconds)
// =============================================================================

/**
 * One second in milliseconds
 * @default 1000
 */
export const ONE_SECOND_MS = 1000;

/**
 * One minute in milliseconds
 * @default 60000
 */
export const ONE_MINUTE_MS = 60000;

/**
 * One hour in milliseconds
 * @default 3600000
 */
export const ONE_HOUR_MS = 3600000;

/**
 * One day in milliseconds
 * @default 86400000
 */
export const ONE_DAY_MS = 86400000;

/**
 * One week in milliseconds
 * @default 604800000
 */
export const ONE_WEEK_MS = 604800000;

// =============================================================================
// TIME VALUES (Seconds)
// =============================================================================

/**
 * One hour in seconds
 * @default 3600
 */
export const ONE_HOUR_S = 3600;

/**
 * One day in seconds
 * @default 86400
 */
export const ONE_DAY_S = 86400;

/**
 * One week in seconds
 * @default 604800
 */
export const ONE_WEEK_S = 604800;

// =============================================================================
// CACHE TTL (Seconds)
// =============================================================================

/**
 * Default cache time-to-live in seconds (1 hour)
 * @default 3600
 */
export const DEFAULT_CACHE_TTL_S = 3600;

/**
 * Default Redis cache TTL in seconds
 * @default 3600
 */
export const REDIS_CACHE_TTL_S = 3600;

/**
 * Categories cache TTL in seconds (24 hours)
 * @default 86400
 */
export const CATEGORIES_CACHE_TTL_S = 86400;

/**
 * Subjects cache TTL in seconds (24 hours)
 * @default 86400
 */
export const SUBJECTS_CACHE_TTL_S = 86400;

// =============================================================================
// LIMITS
// =============================================================================

/**
 * Maximum number of items that can be processed in a bulk operation
 * @default 1000
 */
export const MAX_BULK_ITEMS = 1000;

/**
 * Maximum order value for sorting
 * @default 1000
 */
export const MAX_ORDER_VALUE = 1000;

/**
 * Minimum order value for sorting
 * @default 0
 */
export const MIN_ORDER_VALUE = 0;

/**
 * Maximum number of function lines allowed (code quality)
 * @default 50
 */
export const MAX_FUNCTION_LINES = 50;

/**
 * Maximum number of file lines allowed (code quality)
 * @default 500
 */
export const MAX_FILE_LINES = 500;

/**
 * Maximum cyclomatic complexity allowed (code quality)
 * @default 15
 */
export const MAX_COMPLEXITY = 15;

// =============================================================================
// JWT
// =============================================================================

/**
 * JWT token expiration time in days
 * @default 7
 */
export const JWT_EXPIRES_IN_DAYS = 7;

/**
 * JWT token expiration time in seconds (7 days)
 * @default 604800
 */
export const JWT_EXPIRES_IN_SECONDS = 604800;

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  /** OK - Request succeeded */
  OK: 200,
  /** Created - Resource created successfully */
  CREATED: 201,
  /** Accepted - Request accepted for processing */
  ACCEPTED: 202,
  /** No Content - Request succeeded, no content to return */
  NO_CONTENT: 204,
  /** Bad Request - Invalid request syntax or parameters */
  BAD_REQUEST: 400,
  /** Unauthorized - Authentication required */
  UNAUTHORIZED: 401,
  /** Forbidden - Access denied */
  FORBIDDEN: 403,
  /** Not Found - Resource not found */
  NOT_FOUND: 404,
  /** Conflict - Resource conflict */
  CONFLICT: 409,
  /** Unprocessable Entity - Validation error */
  UNPROCESSABLE_ENTITY: 422,
  /** Too Many Requests - Rate limit exceeded */
  TOO_MANY_REQUESTS: 429,
  /** Internal Server Error - Server error */
  INTERNAL_ERROR: 500,
  /** Service Unavailable - Service temporarily unavailable */
  SERVICE_UNAVAILABLE: 503,
} as const;

// =============================================================================
// MEMORY & PERFORMANCE
// =============================================================================

/**
 * Memory heap limit in bytes (150 MB)
 * @default 157286400
 */
export const MEMORY_HEAP_LIMIT_BYTES = 150 * 1024 * 1024;

/**
 * Memory RSS limit in bytes (150 MB)
 * @default 157286400
 */
export const MEMORY_RSS_LIMIT_BYTES = 150 * 1024 * 1024;

/**
 * Database connection pool size
 * @default 10
 */
export const DB_POOL_SIZE = 10;

/**
 * Disk storage threshold percentage for health checks
 * @default 0.9 (90%)
 */
export const DISK_THRESHOLD_PERCENT = 0.9;

// =============================================================================
// CORS
// =============================================================================

/**
 * CORS max age in seconds (1 hour)
 * @default 3600
 */
export const CORS_MAX_AGE = 3600;

// =============================================================================
// ANIMATION
// =============================================================================

/**
 * Default animation duration in milliseconds
 * @default 200
 */
export const DEFAULT_ANIMATION_DURATION_MS = 200;

/**
 * Default submit animation duration in milliseconds (faster for better UX)
 * @default 150
 */
export const DEFAULT_SUBMIT_ANIMATION_DURATION_MS = 150;

/**
 * Maximum animation duration in milliseconds
 * @default 5000
 */
export const MAX_ANIMATION_DURATION_MS = 5000;

/**
 * Default animation delay in milliseconds
 * @default 0
 */
export const DEFAULT_ANIMATION_DELAY_MS = 0;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default count for random quiz jokes
 * @default 10
 */
export const DEFAULT_RANDOM_JOKES_COUNT = 10;

/**
 * Default count for mixed quiz jokes
 * @default 20
 */
export const DEFAULT_MIXED_JOKES_COUNT = 20;

/**
 * Minimum timer duration in seconds for image riddles
 * @default 5
 */
export const MIN_TIMER_SECONDS = 5;

/**
 * Maximum timer duration in seconds for image riddles
 * @default 3600
 */
export const MAX_TIMER_SECONDS = 3600;

// =============================================================================
// RIDDLE TIMERS BY DIFFICULTY (Seconds)
// =============================================================================

/**
 * Riddle timer durations by difficulty level
 */
export const RIDDLE_TIMERS = {
  EASY: 60,
  MEDIUM: 90,
  HARD: 120,
  EXPERT: 180,
} as const;

// =============================================================================
// ORDER VALUES
// =============================================================================

/**
 * Default action display order
 * @default 100
 */
export const DEFAULT_ACTION_ORDER = 100;

/**
 * Maximum action display order (for report/issue actions)
 * @default 999
 */
export const MAX_ACTION_ORDER = 999;

/**
 * High priority action order (for fullscreen)
 * @default 100
 */
export const HIGH_PRIORITY_ORDER = 100;

/**
 * Submit answer action order (highest priority)
 * @default 5
 */
export const SUBMIT_ACTION_ORDER = 5;

/**
 * Show hint action order
 * @default 10
 */
export const SHOW_HINT_ORDER = 10;

/**
 * Skip action order
 * @default 20
 */
export const SKIP_ACTION_ORDER = 20;

/**
 * Reveal answer action order
 * @default 30
 */
export const REVEAL_ANSWER_ORDER = 30;

/**
 * Reset timer action order
 * @default 40
 */
export const RESET_TIMER_ORDER = 40;

/**
 * Pause timer action order
 * @default 45
 */
export const PAUSE_TIMER_ORDER = 45;

/**
 * Resume timer action order
 * @default 46
 */
export const RESUME_TIMER_ORDER = 46;

/**
 * Share action order
 * @default 50
 */
export const SHARE_ACTION_ORDER = 50;
