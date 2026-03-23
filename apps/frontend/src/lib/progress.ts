/**
 * ============================================================================
 * Progress Tracking Library
 * ============================================================================
 * Utilities for tracking quiz progress in localStorage
 * ============================================================================
 */

import type { QuizSession, ChapterProgress, SubjectProgress } from '@/types/quiz';
import { STORAGE_KEYS, getItem, setItem } from './storage';

/** Generate primary ID-based key for chapter progress */
function getChapterKey(subjectId: string, chapterId: string): string {
  return `id:${subjectId}:${chapterId}`;
}

/** Helper to find progress using ID-based keys */
function findChapterProgress(
  chapterProgress: Record<string, ChapterProgress>,
  subjectId: string,
  chapterId: string
): ChapterProgress | null {
  const key = getChapterKey(subjectId, chapterId);
  return chapterProgress[key] || null;
}

/** Save quiz result and update progress */
export function saveQuizResult(session: QuizSession): void {
  // Update chapter progress
  const chapterProgress = getItem<Record<string, ChapterProgress>>(
    STORAGE_KEYS.CHAPTER_PROGRESS,
    {}
  );

  const key = getChapterKey(session.subjectId, session.chapterId);
  
  // Try to find existing progress using the helper
  const existing = findChapterProgress(
    chapterProgress,
    session.subjectId,
    session.chapterId
  );

  const newProgress: ChapterProgress = {
    subject: session.subject,
    subjectId: session.subjectId,
    chapter: session.chapter,
    chapterId: session.chapterId,
    attempts: (existing?.attempts || 0) + 1,
    bestScore: Math.max(existing?.bestScore || 0, session.score),
    lastScore: session.score,
    averageScore: existing
      ? Math.round(
          (existing.averageScore * existing.attempts + session.score) /
            (existing.attempts + 1)
        )
      : session.score,
    completed: session.score > 0 || (existing?.completed ?? false),
    lastAttemptAt: new Date().toISOString(),
  };

  // Always save with the new ID-based key
  chapterProgress[key] = newProgress;

  setItem(STORAGE_KEYS.CHAPTER_PROGRESS, chapterProgress);

  // Update subject progress
  updateSubjectProgress(session.subject, session.subjectId);
}

/** Update subject progress based on chapter progress */
function updateSubjectProgress(subjectSlug: string, subjectId: string): void {
  const chapterProgress = getItem<Record<string, ChapterProgress>>(
    STORAGE_KEYS.CHAPTER_PROGRESS,
    {}
  );

  // Get all chapters for this subject
  const subjectChapters = Object.values(chapterProgress).filter(
    (p) => p.subjectId === subjectId || p.subject === subjectSlug
  );

  if (subjectChapters.length === 0) {
    // If no chapters found, ensure subject progress is also cleared or not created
    const subjectProgress = getItem<Record<string, SubjectProgress>>(
      STORAGE_KEYS.SUBJECT_PROGRESS,
      {}
    );
    if (subjectProgress[subjectId]) {
      delete subjectProgress[subjectId];
      setItem(STORAGE_KEYS.SUBJECT_PROGRESS, subjectProgress);
    }
    return;
  }

  const totalChapters = subjectChapters.length;
  const completedChapters = subjectChapters.filter((p) => p.completed).length;
  const totalAttempts = subjectChapters.reduce((sum, p) => sum + p.attempts, 0);
  const bestScore = Math.max(...subjectChapters.map((p) => p.bestScore), 0);

  // Calculate overall accuracy
  const totalQuestionsAnswered = subjectChapters.reduce(
    (sum, p) => sum + p.attempts,
    0
  );
  const totalCorrect = subjectChapters.reduce(
    (sum, p) => sum + p.averageScore * p.attempts,
    0
  );
  const overallAccuracy =
    totalQuestionsAnswered > 0
      ? Math.round(totalCorrect / totalQuestionsAnswered)
      : 0;

  const subjectProgress = getItem<Record<string, SubjectProgress>>(
    STORAGE_KEYS.SUBJECT_PROGRESS,
    {}
  );

  subjectProgress[subjectId] = {
    subject: subjectSlug,
    subjectId: subjectId,
    totalChapters,
    completedChapters,
    totalAttempts,
    bestScore,
    overallAccuracy,
  };

  setItem(STORAGE_KEYS.SUBJECT_PROGRESS, subjectProgress);
}

/** Get chapter progress */
export function getChapterProgress(
  subjectId: string,
  chapterId: string
): ChapterProgress | null {
  const chapterProgress = getItem<Record<string, ChapterProgress>>(
    STORAGE_KEYS.CHAPTER_PROGRESS,
    {}
  );
  
  return findChapterProgress(chapterProgress, subjectId, chapterId);
}

/** Get subject progress */
export function getSubjectProgress(subject: string, subjectId?: string): SubjectProgress | null {
  const subjectProgress = getItem<Record<string, SubjectProgress>>(
    STORAGE_KEYS.SUBJECT_PROGRESS,
    {}
  );
  
  if (subjectId && subjectProgress[subjectId]) {
    return subjectProgress[subjectId];
  }
  
  // Fallback to slug if ID not found or not provided
  // This assumes subjectProgress might still contain slug-based keys from older versions
  return Object.values(subjectProgress).find(p => p.subject === subject) || null;
}

/** Get all quiz history */
export function getQuizHistory(): QuizSession[] {
  return getItem<QuizSession[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
}

/** Get recent quiz sessions */
export function getRecentSessions(count: number = 10): QuizSession[] {
  const history = getQuizHistory();
  return history.slice(-count).reverse();
}

/** Get total stats across all subjects */
export function getTotalStats(): {
  totalQuizzes: number;
  totalQuestions: number;
  averageScore: number;
  bestStreak: number;
} {
  const history = getQuizHistory();

  if (history.length === 0) {
    return {
      totalQuizzes: 0,
      totalQuestions: 0,
      averageScore: 0,
      bestStreak: 0,
    };
  }

  const totalQuizzes = history.length;
  const totalQuestions = history.reduce(
    (sum, s) => sum + s.maxScore,
    0
  );
  const averageScore = Math.round(
    history.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0) /
      history.length
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
      const diffDays =
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

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

/** Check if chapter is completed */
export function isChapterCompleted(subjectId: string, chapterId: string): boolean {
  const progress = getChapterProgress(subjectId, chapterId);
  return progress?.completed ?? false;
}

/** Get recommended chapters (chapters with low scores) */
export function getRecommendedChapters(subject: string): string[] {
  const chapterProgress = getItem<Record<string, ChapterProgress>>(
    STORAGE_KEYS.CHAPTER_PROGRESS,
    {}
  );

  return Object.values(chapterProgress)
    .filter((p) => p.subject === subject && p.averageScore < 70)
    .sort((a, b) => a.averageScore - b.averageScore)
    .map((p) => p.chapter);
}

/** Clear all progress (for debugging/reset) */
export function clearAllProgress(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.CHAPTER_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.SUBJECT_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.QUIZ_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
}

/** Export progress data (for backup) */
export function exportProgress(): string {
  const data = {
    chapterProgress: getItem(STORAGE_KEYS.CHAPTER_PROGRESS, {}),
    subjectProgress: getItem(STORAGE_KEYS.SUBJECT_PROGRESS, {}),
    quizHistory: getItem(STORAGE_KEYS.QUIZ_HISTORY, []),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

/** Import progress data (from backup) */
export function importProgress(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.chapterProgress) {
      setItem(STORAGE_KEYS.CHAPTER_PROGRESS, data.chapterProgress);
    }
    if (data.subjectProgress) {
      setItem(STORAGE_KEYS.SUBJECT_PROGRESS, data.subjectProgress);
    }
    if (data.quizHistory) {
      setItem(STORAGE_KEYS.QUIZ_HISTORY, data.quizHistory);
    }
    return true;
  } catch {
    return false;
  }
}
