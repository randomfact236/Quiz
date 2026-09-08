/**
 * ============================================================================
 * APPLICATION CONSTANTS - Enterprise Grade
 * ============================================================================
 * @module common/constants/app.constants
 * @description Centralized constants for the backend application.
 *
 * NOTE: Port configuration has been moved to './ports.ts'
 * To change ports, edit ports.ts or use environment variables.
 * ============================================================================
 */

// Import from centralized ports configuration
import { BACKEND_PORT, FRONTEND_PORT, REDIS_PORT, DATABASE_PORT } from './ports';

// Re-export for backwards compatibility
export { BACKEND_PORT as SERVER_PORT, FRONTEND_PORT, REDIS_PORT, DATABASE_PORT as DB_PORT };

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
