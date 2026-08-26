/**
 * ============================================================================
 * Riddle Session Persistence
 * ============================================================================
 * Phase 0: Auto-save riddle session to localStorage every 10 seconds
 * Provides session recovery and prevents data loss on refresh
 * ============================================================================
 */

import { getItem, setItem, removeItem, STORAGE_KEYS } from './storage';
import type { RiddleSession } from '@/types/riddles';

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
// Session Utilities
// ============================================================================

/**
 * Create a new riddle session
 */
export function createRiddleSession(
  mode: 'timer' | 'practice',
  subjectId: string | 'all',
  subjectName: string,
  difficulty: 'all' | 'easy' | 'medium' | 'hard' | 'expert',
  riddles: RiddleSession['riddles'],
  timeLimit?: number
): RiddleSession {
  const now = new Date().toISOString();

  return {
    id: generateSessionId(),
    mode,
    subjectId,
    subjectName,
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
