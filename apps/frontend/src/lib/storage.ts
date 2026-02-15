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
    SETTINGS: `${PREFIX}settings`,
    SUBJECTS: `${PREFIX}subjects`,
    QUESTIONS: `${PREFIX}questions`,
    JOKES: `${PREFIX}jokes`,
    RIDDLES: `${PREFIX}riddles`,
    IMAGE_RIDDLES: `${PREFIX}image-riddles`,
    IMAGE_RIDDLE_CATEGORIES: `${PREFIX}image-riddle-categories`,
    JOKE_ITEMS: `${PREFIX}joke-items`,
    RIDDLE_ITEMS: `${PREFIX}riddle-items`,
    QUIZ_ITEMS: `${PREFIX}quiz-items`,
    IMAGE_RIDDLE_ITEMS: `${PREFIX}image-riddle-items`,
} as const;

// ─── Core API ────────────────────────────────────────────────────────────────

/**
 * Get a typed item from localStorage.
 * Returns `defaultValue` if key doesn't exist or parsing fails.
 */
export function getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {return defaultValue;}
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) {return defaultValue;}
        return JSON.parse(raw) as T;
    } catch {
        return defaultValue;
    }
}

/**
 * Save a typed item to localStorage (JSON-serialised).
 */
export function setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') {return;}
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.warn(`[storage] Failed to save key "${key}":`, err);
    }
}

/**
 * Remove an item from localStorage.
 */
export function removeItem(key: string): void {
    if (typeof window === 'undefined') {return;}
    localStorage.removeItem(key);
}

/**
 * Clear all app data (keys starting with PREFIX).
 */
export function clearAll(): void {
    if (typeof window === 'undefined') {return;}
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) {keysToRemove.push(k);}
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
export function setItemDebounced<T>(
    key: string,
    value: T,
    delayMs = STORAGE_DEBOUNCE_MS,
): void {
    const existing = timers.get(key);
    if (existing) {clearTimeout(existing);}
    timers.set(
        key,
        setTimeout(() => {
            setItem(key, value);
            timers.delete(key);
        }, delayMs),
    );
}
