/**
 * ============================================================================
 * Riddle Progress Library
 * ============================================================================
 * Persists completed riddle sessions and derives aggregate stats so the
 * Achievements feature sees riddle play (plan/03-riddle-mcq.md P1 #1).
 * The two-key resume store and the 10s autosave store remain responsible for
 * in-flight sessions; this module is the completion-side record only.
 * ============================================================================
 */

import type { RiddleSession } from '@/types/riddles';
import { STORAGE_KEYS, getItem, setItem } from './storage';

const RIDDLE_HISTORY_MAX = 100;

export interface RiddleHistoryEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  level: string;
  score: number;
  maxScore: number;
  timeTaken: number;
  startedAt: string;
  status: 'completed';
}

/** Append a completed riddle session (capped — oldest pruned). */
export function saveRiddleResult(session: RiddleSession): RiddleHistoryEntry {
  const entry: RiddleHistoryEntry = {
    id: session.id,
    subjectId: session.subjectId,
    subjectName: session.subjectName,
    level: session.difficulty,
    score: session.score,
    maxScore: session.riddles.length,
    timeTaken: session.timeTaken,
    startedAt: session.startedAt,
    status: 'completed',
  };

  const history = getRiddleHistory();
  history.push(entry);
  if (history.length > RIDDLE_HISTORY_MAX) {
    history.splice(0, history.length - RIDDLE_HISTORY_MAX);
  }
  setItem(STORAGE_KEYS.RIDDLE_HISTORY, history);
  return entry;
}

export function getRiddleHistory(): RiddleHistoryEntry[] {
  return getItem<RiddleHistoryEntry[]>(STORAGE_KEYS.RIDDLE_HISTORY, []);
}

/** Aggregate stats for the achievements 'accuracy' condition and dashboards. */
export function getRiddleStats(): {
  totalQuizzes: number;
  totalQuestions: number;
  averageScore: number;
} {
  const history = getRiddleHistory();
  if (history.length === 0) {
    return { totalQuizzes: 0, totalQuestions: 0, averageScore: 0 };
  }

  const totalQuizzes = history.length;
  const totalQuestions = history.reduce((sum, s) => sum + s.maxScore, 0);
  const averageScore = Math.round(
    history.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0) / history.length
  );
  return { totalQuizzes, totalQuestions, averageScore };
}
