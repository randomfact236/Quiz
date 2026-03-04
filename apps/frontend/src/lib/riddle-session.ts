/**
 * ============================================================================
 * Riddle Session Persistence
 * ============================================================================
 * Phase 0: Auto-save riddle session to localStorage every 10 seconds
 * Provides session recovery and prevents data loss on refresh
 * ============================================================================
 */

import { getItem, setItem, removeItem, STORAGE_KEYS } from './storage';
import type { RiddleSession, RiddleHistoryEntry, RiddleResult } from '@/types/riddles';

// Auto-save interval in milliseconds (10 seconds as per Phase 0)
const AUTO_SAVE_INTERVAL_MS = 10000;

// Session expiry time (24 hours - sessions older than this are considered stale)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Session Management
// ============================================================================

/**
 * Save the current riddle session to localStorage
 * Call this whenever state changes or on auto-save interval
 */
export function saveRiddleSession(session: RiddleSession): void {
    const sessionWithTimestamp = {
        ...session,
        lastSavedAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.RIDDLE_SESSION, sessionWithTimestamp);
}

/**
 * Load the saved riddle session from localStorage
 * Returns null if no session exists or session has expired
 */
export function loadRiddleSession(): RiddleSession | null {
    const session = getItem<RiddleSession | null>(STORAGE_KEYS.RIDDLE_SESSION, null);

    if (!session) {
        return null;
    }

    // Check if session has expired
    const lastSaved = new Date(session.lastSavedAt).getTime();
    const now = Date.now();

    if (now - lastSaved > SESSION_EXPIRY_MS) {
        // Session is stale, clear it
        clearRiddleSession();
        return null;
    }

    // Check if session is already completed or abandoned
    if (session.status === 'completed' || session.status === 'abandoned') {
        clearRiddleSession();
        return null;
    }

    return session;
}

/**
 * Clear the saved riddle session from localStorage
 * Call this when session is completed or abandoned
 */
export function clearRiddleSession(): void {
    removeItem(STORAGE_KEYS.RIDDLE_SESSION);
}

/**
 * Get a specific riddle session by ID (useful for results page)
 * Note: Currently we only store the *latest* session in local storage due to space constraints.
 * If there's a need for full history, we may want to persist sessions somewhere else.
 */
export function getRiddleSessionById(id: string): RiddleSession | null {
    const session = getItem<RiddleSession | null>(STORAGE_KEYS.RIDDLE_SESSION, null);
    if (session && session.id === id) {
        return session;
    }
    return null;
}

/**
 * Check if there's an active session that can be resumed
 */
export function hasActiveSession(): boolean {
    const session = loadRiddleSession();
    return session !== null && session.status === 'in-progress';
}

// ============================================================================
// Auto-Save Hook Helper
// ============================================================================

/**
 * Creates an auto-save interval for the riddle session
 * Returns a cleanup function to clear the interval
 * 
 * Usage in React component:
 * ```
 * useEffect(() => {
 *   return createAutoSaveInterval(session, (updatedSession) => {
 *     // Optional: callback when auto-save occurs
 *   });
 * }, [session]);
 * ```
 */
export function createAutoSaveInterval(
    getSession: () => RiddleSession,
    onSave?: (session: RiddleSession) => void,
): () => void {
    const intervalId = setInterval(() => {
        const session = getSession();
        if (session.status === 'in-progress') {
            saveRiddleSession(session);
            onSave?.(session);
        }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(intervalId);
}

// ============================================================================
// History Management
// ============================================================================

const MAX_HISTORY_ENTRIES = 50; // Keep last 50 sessions

/**
 * Add a completed riddle session to history
 */
export function addToRiddleHistory(result: RiddleResult): void {
    const history = getItem<RiddleHistoryEntry[]>(STORAGE_KEYS.RIDDLE_HISTORY, []);

    const entry: RiddleHistoryEntry = {
        sessionId: result.session.id,
        mode: result.session.mode,
        chapterId: result.session.chapterId,
        chapterName: result.session.chapterName,
        difficulty: result.session.difficulty,
        totalRiddles: result.session.riddles.length,
        correctCount: result.correctCount,
        percentage: result.percentage,
        grade: result.grade,
        timeTaken: result.session.timeTaken,
        completedAt: result.session.completedAt || new Date().toISOString(),
    };

    // Add to beginning (most recent first)
    const updatedHistory = [entry, ...history].slice(0, MAX_HISTORY_ENTRIES);
    setItem(STORAGE_KEYS.RIDDLE_HISTORY, updatedHistory);
}

/**
 * Get riddle history
 */
export function getRiddleHistory(): RiddleHistoryEntry[] {
    return getItem<RiddleHistoryEntry[]>(STORAGE_KEYS.RIDDLE_HISTORY, []);
}

export const loadRiddleHistory = getRiddleHistory;

/**
 * Clear riddle history
 */
export function clearRiddleHistory(): void {
    removeItem(STORAGE_KEYS.RIDDLE_HISTORY);
}

// ============================================================================
// Session Utilities
// ============================================================================

/**
 * Create a new riddle session
 */
export function createRiddleSession(
    mode: 'timer' | 'practice',
    chapterId: string | 'all',
    chapterName: string,
    difficulty: 'all' | 'easy' | 'medium' | 'hard' | 'expert',
    riddles: RiddleSession['riddles'],
    timeLimit?: number,
): RiddleSession {
    const now = new Date().toISOString();

    return {
        id: generateSessionId(),
        mode,
        chapterId,
        chapterName,
        difficulty,
        riddles,
        answers: {},
        score: 0,
        startedAt: now,
        lastSavedAt: now,
        timeTaken: 0,
        timeRemaining: timeLimit ?? 0,
        status: 'in-progress',
        hintsUsed: 0,
        skippedRiddles: [],
    };
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
    return `riddle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate session time taken
 */
export function calculateTimeTaken(startTime: number, endTime: number = Date.now()): number {
    return Math.floor((endTime - startTime) / 1000);
}

/**
 * Check if user has progress that would be lost
 * Used for navigation warnings
 */
export function hasUnsavedProgress(session?: RiddleSession | null): boolean {
    if (!session) {
        return hasActiveSession();
    }

    return session.status === 'in-progress' && Object.keys(session.answers).length > 0;
}

// ============================================================================
// Navigation Warning
// ============================================================================

/**
 * Setup beforeunload warning for unsaved progress
 * Call this when a session starts, returns cleanup function
 */
export function setupNavigationWarning(sessionGetter: () => RiddleSession | null): () => void {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
        const session = sessionGetter();
        if (hasUnsavedProgress(session)) {
            e.preventDefault();
            e.returnValue = '';
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
}
