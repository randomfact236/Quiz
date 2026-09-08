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
// UI TIMING
// =============================================================================

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

/**
 * One day in seconds
 * @default 86400
 */
export const SECONDS_PER_DAY = 86400;

/**
 * One week in seconds
 * @default 604800
 */
export const SECONDS_PER_WEEK = 604800;

// =============================================================================
// TIME VALUES (Milliseconds)
// =============================================================================

/**
 * One second in milliseconds
 * @default 1000
 */
export const ONE_SECOND_MS = 1000;

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
// STORAGE
// =============================================================================

/**
 * Debounce delay for storage writes in milliseconds
 * @default 300
 */
export const STORAGE_DEBOUNCE_MS = 300;

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

/**
 * Random ID suffix length
 * @default 9
 */
export const RANDOM_ID_SUFFIX_LENGTH = 9;
