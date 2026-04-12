/**
 * ============================================================================
 * LOCAL STORAGE PERSISTENCE LAYER
 * ============================================================================
 * @module lib/storage
 * @description Typed localStorage wrapper for standalone data persistence.
 *              All app data (questions, jokes, riddles, settings) flows through
 *              this module so the website is fully self-contained.
 */

// Storage key prefix to avoid collisions
const PREFIX = 'aiquiz:';

// ─── Storage Keys ────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  AUTH_TOKEN: `${PREFIX}auth-token`,
  REFRESH_TOKEN: `${PREFIX}refresh-token`,
  ADMIN_TOKEN: `${PREFIX}admin-token`,
  ADMIN_REFRESH_TOKEN: `${PREFIX}admin-refresh-token`,
  SETTINGS: `${PREFIX}settings`,
  SUBJECTS: `${PREFIX}subjects`,
  QUESTIONS: `${PREFIX}questions`,
  JOKES: `${PREFIX}jokes`,
  JOKE_CATEGORIES: `${PREFIX}joke-categories`,
  VOTED_JOKES: `${PREFIX}voted-jokes`,
  JOKE_VOTE_COUNTS: `${PREFIX}joke-vote-counts`,
  RIDDLES: `${PREFIX}riddles`,
  IMAGE_RIDDLES: `${PREFIX}image-riddles`,
  IMAGE_RIDDLE_CATEGORIES: `${PREFIX}image-riddle-categories`,
  JOKE_ITEMS: `${PREFIX}joke-items`,
  RIDDLE_ITEMS: `${PREFIX}riddle-items`,
  QUIZ_ITEMS: `${PREFIX}quiz-items`,
  IMAGE_RIDDLE_ITEMS: `${PREFIX}image-riddle-items`,
  // Quiz session and progress
  CURRENT_SESSION: `${PREFIX}current-session`,
  QUIZ_HISTORY: `${PREFIX}quiz-history`,
  QUIZ_RESUME_SESSION: `${PREFIX}quiz-resume-session`,
  CHAPTER_PROGRESS: `${PREFIX}chapter-progress`,
  SUBJECT_PROGRESS: `${PREFIX}subject-progress`,
  ACHIEVEMENTS: `${PREFIX}achievements`,
  CHALLENGE_HIGH_SCORE: `${PREFIX}challenge-high-score`,
  // Riddle session and progress (Phase 0)
  RIDDLE_SESSION: `${PREFIX}riddle-session`,
  RIDDLE_HISTORY: `${PREFIX}riddle-history`,
  RIDDLE_FAVORITES: `${PREFIX}riddle-favorites`,
  RIDDLE_STREAK: `${PREFIX}riddle-streak`,
  RIDDLE_ACHIEVEMENTS: `${PREFIX}riddle-achievements`,
  RIDDLE_SETTINGS: `${PREFIX}riddle-settings`,
} as const;

// ─── Core API ────────────────────────────────────────────────────────────────

/**
 * Get a typed item from localStorage or sessionStorage.
 * Returns `defaultValue` if key doesn't exist or parsing fails.
 * Checks sessionStorage first, then localStorage.
 */
export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    // Check sessionStorage first (for non-persistent login)
    let raw = sessionStorage.getItem(key);
    if (raw === null) {
      // Then check localStorage (for persistent login)
      raw = localStorage.getItem(key);
    }

    if (raw === null) {
      return defaultValue;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      // If parsing fails but we have a raw string, return it as type T
      // This handles legacy tokens that weren't JSON-stringified
      return raw as unknown as T;
    }
  } catch {
    return defaultValue;
  }
}

/**
 * Save a typed item to localStorage or sessionStorage (JSON-serialised).
 */
export function setItem<T>(key: string, value: T, persistent = true): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const serialized = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);
    if (persistent) {
      localStorage.setItem(key, serialized);
    } else {
      sessionStorage.setItem(key, serialized);
    }
  } catch (err) {}
}

/**
 * Remove an item from localStorage and sessionStorage.
 */
export function removeItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

/**
 * Clear quiz-specific data (questions and subjects).
 */
export function clearQuizData(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('aiquiz:subjects');
  localStorage.removeItem('aiquiz:questions');
}

/**
 * Clear all app data (keys starting with PREFIX).
 */
export function clearAll(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

// ─── Debounced Save (for high-frequency state updates) ───────────────────────

const timers = new Map<string, ReturnType<typeof setTimeout>>();

import { STORAGE_DEBOUNCE_MS } from './constants';

/**
 * Save to localStorage with debounce (default 300ms).
 * Useful when saving on every keystroke or rapid state change.
 */
export function setItemDebounced<T>(key: string, value: T, delayMs = STORAGE_DEBOUNCE_MS): void {
  const existing = timers.get(key);
  if (existing) {
    clearTimeout(existing);
  }
  timers.set(
    key,
    setTimeout(() => {
      setItem(key, value);
      timers.delete(key);
    }, delayMs)
  );
}
