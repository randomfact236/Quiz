/**
 * ============================================================================
 * Progress Tracking Library
 * ============================================================================
 * Utilities for tracking quiz progress in localStorage
 * ============================================================================
 */

import type { QuizSession, ChapterProgress } from '@/types/quiz-mcq';
import { STORAGE_KEYS, getItem, setItem } from './storage';
import { getRiddleHistory } from './riddle-progress';

/** Generate compound key for chapter progress */
function getChapterKey(subject: string, chapter: string): string {
  return `${subject}:${chapter}`;
}

/** Save quiz result and update progress */
export function saveQuizResult(session: QuizSession): void {
  // Update chapter progress
  const chapterProgress = getItem<Record<string, ChapterProgress>>(
    STORAGE_KEYS.CHAPTER_PROGRESS,
    {}
  );

  const key = getChapterKey(session.subject, session.chapter);
  const existing = chapterProgress[key];

  const newProgress: ChapterProgress = {
    subject: session.subject,
    chapter: session.chapter,
    attempts: (existing?.attempts || 0) + 1,
    bestScore: Math.max(existing?.bestScore || 0, session.score),
    lastScore: session.score,
    averageScore: existing
      ? Math.round(
          (existing.averageScore * existing.attempts + session.score) / (existing.attempts + 1)
        )
      : session.score,
    completed: session.score > 0 || (existing?.completed ?? false),
    lastAttemptAt: new Date().toISOString(),
  };

  chapterProgress[key] = newProgress;
  setItem(STORAGE_KEYS.CHAPTER_PROGRESS, chapterProgress);
}

/** Get chapter progress */
export function getChapterProgress(subject: string, chapter: string): ChapterProgress | null {
  const chapterProgress = getItem<Record<string, ChapterProgress>>(
    STORAGE_KEYS.CHAPTER_PROGRESS,
    {}
  );
  return chapterProgress[getChapterKey(subject, chapter)] || null;
}

/** Get all quiz history */
export function getQuizHistory(): QuizSession[] {
  return getItem<QuizSession[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
}

/** Get total stats across all subjects */
export function getTotalStats(): {
  totalQuizzes: number;
  totalQuestions: number;
  averageScore: number;
  bestStreak: number;
} {
  // Merge quiz + riddle completion history so the Achievements feature sees
  // riddle play too (plan/03-riddle-mcq.md P1 #1).
  const quiz = getQuizHistory();
  const riddle = getRiddleHistory().map((r) => ({
    id: r.id,
    subject: r.subjectId,
    subjectName: r.subjectName,
    chapter: '',
    level: r.level,
    questions: [] as never[],
    answers: {},
    score: r.score,
    maxScore: r.maxScore,
    startedAt: r.startedAt,
    timeTaken: r.timeTaken,
    status: 'completed' as const,
  }));
  const history = [...quiz, ...riddle];

  if (history.length === 0) {
    return {
      totalQuizzes: 0,
      totalQuestions: 0,
      averageScore: 0,
      bestStreak: 0,
    };
  }

  const totalQuizzes = history.length;
  const totalQuestions = history.reduce((sum, s) => sum + s.maxScore, 0);
  const averageScore = Math.round(
    history.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0) / history.length
  );

  // Calculate streak (consecutive days with quizzes)
  const dates = [...new Set(history.map((s) => s.startedAt.split('T')[0]))].sort();
  let currentStreak = 0;
  let maxStreak = 0;

  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prevDate = new Date(dates[i - 1]!);
      const currDate = new Date(dates[i]!);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
  }
  maxStreak = Math.max(maxStreak, currentStreak);

  return {
    totalQuizzes,
    totalQuestions,
    averageScore,
    bestStreak: maxStreak,
  };
}
