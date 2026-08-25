/**
 * ============================================================================
 * Quiz Resume Persistence (two-key design)
 * ============================================================================
 * - `aiquiz:quiz-resume-questions`: the question snapshot, written ONCE per
 *   session start. Random pools are non-deterministic, so resume needs the
 *   exact question set the answers map keys into — but it never changes
 *   mid-session, so it must not be re-serialized on every answer.
 * - `aiquiz:quiz-resume-session`: lightweight progress (answers/index/score/
 *   skipped/size), updated on every change.
 *
 * loadQuizResume() returns a merged state only when BOTH keys exist and the
 * snapshot matches the session's subject/chapter/level/mode.
 * ============================================================================
 */

import { STORAGE_KEYS, getItem, setItem, removeItem } from './storage';
import type { Question } from '@/types/quiz-mcq';

const RESUME_KEY = STORAGE_KEYS.QUIZ_RESUME_SESSION;
const RESUME_QUESTIONS_KEY = STORAGE_KEYS.QUIZ_RESUME_QUESTIONS;
const RESUME_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Identity fields shared by both keys — used to bind snapshot ↔ progress. */
export interface QuizResumeIdentity {
  subject: string;
  chapter: string;
  level: string;
  mode: 'normal' | 'timer_challenge' | 'practice_challenge';
}

/** Lightweight per-change progress payload (no questions). */
export interface QuizResumeProgress {
  currentQuestionIndex: number;
  sessionSize: number;
  answers: Record<string, string>;
  score: number;
  manuallySkipped: string[];
  startedAt: string;
}

interface StoredResumeProgress extends QuizResumeIdentity, QuizResumeProgress {
  savedAt: number;
}

interface StoredResumeQuestions extends QuizResumeIdentity {
  availableQuestions: Question[];
}

/** Merged state handed to consumers (shape-compatible with pre-split code). */
export interface QuizResumeState extends QuizResumeIdentity, QuizResumeProgress {
  availableQuestions: Question[];
  savedAt: number;
}

/** Write the immutable question snapshot — call once when a session starts. */
export function saveQuizResumeQuestions(
  identity: QuizResumeIdentity,
  availableQuestions: Question[]
): void {
  const payload: StoredResumeQuestions = { ...identity, availableQuestions };
  setItem(RESUME_QUESTIONS_KEY, payload);
}

/** Write lightweight progress — safe to call on every change. */
export function saveQuizResume(state: QuizResumeIdentity & QuizResumeProgress): void {
  const progress: StoredResumeProgress = {
    subject: state.subject,
    chapter: state.chapter,
    level: state.level,
    mode: state.mode,
    currentQuestionIndex: state.currentQuestionIndex,
    sessionSize: state.sessionSize,
    answers: state.answers,
    score: state.score,
    manuallySkipped: state.manuallySkipped,
    startedAt: state.startedAt,
    savedAt: Date.now(),
  };
  setItem(RESUME_KEY, progress);
}

export function loadQuizResume(): QuizResumeState | null {
  const progress = getItem<StoredResumeProgress | null>(RESUME_KEY, null);
  if (!progress) return null;
  if (isExpired(progress.savedAt)) {
    clearQuizResume();
    return null;
  }

  const snapshot = getItem<StoredResumeQuestions | null>(RESUME_QUESTIONS_KEY, null);
  if (
    !snapshot ||
    snapshot.subject !== progress.subject ||
    snapshot.chapter !== progress.chapter ||
    snapshot.level !== progress.level ||
    snapshot.mode !== progress.mode
  ) {
    // Snapshot missing or belongs to another session — cannot resume safely.
    return null;
  }

  return {
    ...progress,
    availableQuestions: snapshot.availableQuestions,
  };
}

export function clearQuizResume(): void {
  removeItem(RESUME_KEY);
  removeItem(RESUME_QUESTIONS_KEY);
}

function isExpired(savedAt: number): boolean {
  return Date.now() - savedAt > RESUME_EXPIRY_MS;
}

export function isQuizResumeExpired(state: QuizResumeState): boolean {
  return isExpired(state.savedAt);
}

export function isQuizResumeMatch(
  state: QuizResumeState,
  subject: string,
  chapter: string,
  level: string,
  mode: string
): boolean {
  return (
    state.subject === subject &&
    state.chapter === chapter &&
    state.level === level &&
    state.mode === mode
  );
}
