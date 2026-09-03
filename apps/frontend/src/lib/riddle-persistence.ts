/**
 * ============================================================================
 * Riddle Persistence (consolidated module — plan/03-riddle-mcq.md P2)
 * ============================================================================
 * One module, two concerns, three storage keys:
 *
 * 1. In-flight session (single key, 10s autosave): `saveRiddleSession` /
 *    `loadRiddleSession` / `clearRiddleSession` / `createRiddleSession` /
 *    `hasActiveSession` / `hasUnsavedProgress` / `setupNavigationWarning`.
 *    Also hands the *completed* session to the results page via
 *    `getRiddleSessionById` (raw single read — completed sessions are skipped
 *    by the recovery path but still readable once for results).
 *
 * 2. Two-key resume (mirrors lib/quiz-mcq-resume.ts): `saveRiddleResumeQuestions`
 *    (immutable snapshot, written once per start/extend) + `saveRiddleResume`
 *    (lightweight progress, every tick). `loadRiddleResume` merges only when
 *    both keys exist and their identity matches.
 *
 * Both sub-stores share the 24h expiry constant defined here.
 * ============================================================================
 */

import { getItem, setItem, removeItem, STORAGE_KEYS } from './storage';
import type { RiddleSession } from '@/types/riddles';

// Session/resume expiry (24 hours — older records are considered stale).
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// ==========================================================================
// In-flight session store (single key, autosave payload)
// ==========================================================================

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

// ==========================================================================
// Two-key resume store (snapshot once + lightweight progress)
// ==========================================================================
const PROGRESS_KEY = STORAGE_KEYS.RIDDLE_RESUME_PROGRESS;
const QUESTIONS_KEY = STORAGE_KEYS.RIDDLE_RESUME_QUESTIONS;

/** Identity fields shared by both keys — used to bind snapshot ↔ progress. */
export interface RiddleResumeIdentity {
  mode: 'timer' | 'practice';
  subjectId: string;
  level: string;
}

/** Lightweight per-change progress payload (no riddles). */
export interface RiddleResumeProgress {
  answers: Record<string, string>;
  timeRemaining: number;
  startedAt: string;
}

interface StoredResumeProgress extends RiddleResumeIdentity, RiddleResumeProgress {
  savedAt: number;
}

interface StoredResumeQuestions extends RiddleResumeIdentity {
  // Stored untyped on purpose: the snapshot is the adapted frontend Riddle[]
  // written once by the play page; consumers cast back via adaptRiddleMcq's
  // output type.
  availableRiddles: unknown[];
}

/** Merged state handed to consumers. */
export interface RiddleResumeState extends RiddleResumeIdentity, RiddleResumeProgress {
  availableRiddles: unknown[];
  savedAt: number;
}

/** Write the immutable riddle snapshot — call once per session start/extend. */
export function saveRiddleResumeQuestions(
  identity: RiddleResumeIdentity,
  availableRiddles: unknown[]
): void {
  const payload: StoredResumeQuestions = { ...identity, availableRiddles };
  setItem(QUESTIONS_KEY, payload);
}

/** Write lightweight progress — safe to call on every autosave tick. */
export function saveRiddleResume(
  identity: RiddleResumeIdentity,
  progress: Omit<RiddleResumeProgress, 'startedAt'> & { startedAt?: string }
): void {
  const stored: StoredResumeProgress = {
    ...identity,
    answers: progress.answers,
    timeRemaining: progress.timeRemaining,
    startedAt: progress.startedAt ?? '',
    savedAt: Date.now(),
  };
  setItem(PROGRESS_KEY, stored);
}

export function loadRiddleResume(): RiddleResumeState | null {
  const progress = getItem<StoredResumeProgress | null>(PROGRESS_KEY, null);
  if (!progress || !progress.startedAt) return null;
  if (isExpired(progress.savedAt)) {
    clearRiddleResume();
    return null;
  }

  const snapshot = getItem<StoredResumeQuestions | null>(QUESTIONS_KEY, null);
  if (
    !snapshot ||
    snapshot.subjectId !== progress.subjectId ||
    snapshot.level !== progress.level ||
    snapshot.mode !== progress.mode
  ) {
    // Snapshot missing or belongs to another session — cannot resume safely.
    return null;
  }

  return {
    ...progress,
    availableRiddles: snapshot.availableRiddles,
  };
}

export function clearRiddleResume(): void {
  removeItem(PROGRESS_KEY);
  removeItem(QUESTIONS_KEY);
}

function isExpired(savedAt: number): boolean {
  return Date.now() - savedAt > SESSION_EXPIRY_MS;
}
