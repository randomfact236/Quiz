/**
 * ============================================================================
 * Riddle Resume Persistence (two-key design)
 * ============================================================================
 * Mirrors lib/quiz-mcq-resume.ts:
 * - `<prefix>riddle-resume-questions`: the riddle snapshot, written ONCE per
 *   session start (and re-written only when the pool grows via extend).
 *   Random pools are non-deterministic, so resume needs the exact riddle set
 *   the answers map keys into — but it never changes mid-session, so it must
 *   not be re-serialized on every autosave tick.
 * - `<prefix>riddle-resume-progress`: lightweight progress (answers/time),
 *   safe to write on every change.
 *
 * loadRiddleResume() returns a merged state only when BOTH keys exist and
 * their identity (mode/subject/level) matches.
 * ============================================================================
 */

import { STORAGE_KEYS, getItem, setItem, removeItem } from './storage';

const PROGRESS_KEY = STORAGE_KEYS.RIDDLE_RESUME_PROGRESS;
const QUESTIONS_KEY = STORAGE_KEYS.RIDDLE_RESUME_QUESTIONS;
const RESUME_EXPIRY_MS = 24 * 60 * 60 * 1000;

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
  return Date.now() - savedAt > RESUME_EXPIRY_MS;
}
