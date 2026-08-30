/**
 * ============================================================================
 * Quiz MCQ engine utilities — pure helpers extracted from useQuizMcq
 * ============================================================================
 */

import type { QuizQuestion } from '@/lib/quiz-mcq-api';
import type { Question } from '@/types/quiz-mcq';

/** Capacity-plan A2: fixed session size fetched via capped server-side random endpoint */
export const QUIZ_SESSION_SIZE = 20;

/** Generate UUID for session */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Convert QuizQuestion from API to Question type */
export function convertQuizQuestion(q: QuizQuestion): Question {
  const options = q.options || [];
  return {
    id: q.id,
    question: q.question,
    optionA: options[0] || '',
    optionB: options[1] || '',
    optionC: options[2] || '',
    optionD: options[3] || '',
    correctAnswer: q.correctAnswer,
    correctLetter: q.correctLetter || null,
    explanation: q.explanation || null,
    level: q.level,
    chapter: q.chapterId,
    status: q.status || 'published',
  };
}

/** Per-question timers reset when moving forward, not backward. */
export function navigateTimeRemaining(
  direction: 'forward' | 'neutral',
  timerMode: 'total' | 'per-question' | undefined,
  timeLimit: number | undefined,
  current: number
): number {
  if (direction === 'forward' && timerMode === 'per-question' && timeLimit) {
    return timeLimit;
  }
  return current;
}
