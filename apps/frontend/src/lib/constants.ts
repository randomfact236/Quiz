/**
 * ============================================================================
 * FRONTEND CONSTANTS - Enterprise Grade
 * ============================================================================
 * @module lib/constants
 * @description Centralized constants for the frontend application.
 * All magic numbers should be defined here and imported where needed.
 * ============================================================================
 */

// =============================================================================
// API CONFIGURATION
// =============================================================================

/**
 * API request timeout in milliseconds (30 seconds)
 * @default 30000
 */
export const API_TIMEOUT = 30000;

/**
 * Default pagination limit for API requests
 * @default 20
 */
export const DEFAULT_LIMIT = 20;

/**
 * Default page size for pagination
 * @default 10
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Maximum page size allowed
 * @default 50
 */
export const MAX_PAGE_SIZE = 50;

// =============================================================================
// UI TIMING
// =============================================================================

/**
 * Default debounce delay in milliseconds
 * @default 300
 */
export const DEBOUNCE_DELAY = 300;

/**
 * Default toast notification duration in milliseconds (5 seconds)
 * @default 5000
 */
export const TOAST_DURATION = 5000;

/**
 * Error toast notification duration in milliseconds (8 seconds)
 * @default 8000
 */
export const ERROR_TOAST_DURATION = 8000;

/**
 * Success toast notification duration in milliseconds (5 seconds)
 * @default 5000
 */
export const SUCCESS_TOAST_DURATION = 5000;

/**
 * Warning toast notification duration in milliseconds (5 seconds)
 * @default 5000
 */
export const WARNING_TOAST_DURATION = 5000;

/**
 * Info toast notification duration in milliseconds (5 seconds)
 * @default 5000
 */
export const INFO_TOAST_DURATION = 5000;

// =============================================================================
// CACHE TTL (Milliseconds)
// =============================================================================

/**
 * Default cache time-to-live in milliseconds (5 minutes)
 * @default 300000
 */
export const CACHE_TTL = 5 * 60 * 1000;

/**
 * Short cache TTL in milliseconds (1 minute)
 * @default 60000
 */
export const SHORT_CACHE_TTL = 60000;

/**
 * Medium cache TTL in milliseconds (1 hour)
 * @default 3600000
 */
export const MEDIUM_CACHE_TTL = 60 * 60 * 1000;

/**
 * Long cache TTL in milliseconds (24 hours)
 * @default 86400000
 */
export const LONG_CACHE_TTL = 24 * 60 * 60 * 1000;

// =============================================================================
// TIME VALUES (Seconds)
// =============================================================================

/**
 * One minute in seconds
 * @default 60
 */
export const SECONDS_PER_MINUTE = 60;

/**
 * One hour in seconds
 * @default 3600
 */
export const SECONDS_PER_HOUR = 3600;
export const ONE_HOUR_S = 3600;

/**
 * One day in seconds
 * @default 86400
 */
export const SECONDS_PER_DAY = 86400;
export const ONE_DAY_S = 86400;

/**
 * One week in seconds
 * @default 604800
 */
export const SECONDS_PER_WEEK = 604800;
export const ONE_WEEK_S = 604800;

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
// QUIZ DEFAULTS
// =============================================================================

/**
 * Default quiz time limit in seconds
 * @default 30
 */
export const DEFAULT_QUIZ_TIME_LIMIT = 30;

/**
 * Default passing score percentage
 * @default 70
 */
export const DEFAULT_PASSING_SCORE = 70;

/**
 * Default number of questions per quiz
 * @default 10
 */
export const DEFAULT_QUESTIONS_PER_QUIZ = 10;

// =============================================================================
// RIDDLE TIMERS BY DIFFICULTY (Seconds)
// =============================================================================

/**
 * Riddle timer durations by difficulty level
 */
export const RIDDLE_TIMERS = {
  EASY: 30,
  MEDIUM: 60,
  HARD: 90,
  EXPERT: 120,
} as const;

// =============================================================================
// MOCK API DELAYS
// =============================================================================

/**
 * Simulated API delay for mock responses in milliseconds
 * @default 50
 */
export const MOCK_API_DELAY_MS = 50;

// =============================================================================
// STATUS REFRESH INTERVALS
// =============================================================================

/**
 * Default status counts refresh interval in milliseconds (30 seconds)
 * @default 30000
 */
export const STATUS_REFRESH_INTERVAL = 30000;

// =============================================================================
// STORAGE
// =============================================================================

/**
 * Storage key prefix for localStorage
 * @default 'aiquiz:'
 */
export const STORAGE_PREFIX = 'aiquiz:';

/**
 * Debounce delay for storage writes in milliseconds
 * @default 300
 */
export const STORAGE_DEBOUNCE_MS = 300;

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
// PERCENTAGE CALCULATIONS
// =============================================================================

/**
 * Minimum percentage value
 * @default 0
 */
export const MIN_PERCENTAGE = 0;

/**
 * Maximum percentage value
 * @default 100
 */
export const MAX_PERCENTAGE = 100;

// =============================================================================
// STRING LENGTHS
// =============================================================================

/**
 * Default truncation length for text
 * @default 3
 */
export const TRUNCATION_ELLIPSIS_LENGTH = 3;

/**
 * Random ID suffix length
 * @default 9
 */
export const RANDOM_ID_SUFFIX_LENGTH = 9;
