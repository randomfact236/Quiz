/**
 * ============================================================================
 * Quiz MCQ Scoring — single source of truth
 * ============================================================================
 * Shared by the play engine (useQuizMcq), the results page, and QuestionReview.
 *
 * Rules:
 *  - MCQ levels: user answer is a letter (A/B/C/D) compared to correctLetter.
 *  - extreme (open-ended): normalized text comparison against correctAnswer
 *    (case, whitespace, quotes, trailing punctuation, leading articles).
 * ============================================================================
 */

import type { Question, QuizResult, QuizSession } from '@/types/quiz-mcq';

/**
 * Normalize a free-text (extreme) answer for comparison: lowercase, collapse
 * whitespace, strip surrounding quotes and trailing punctuation, and drop a
 * leading article so "The Sun", "the sun." and "sun" all grade as equal.
 */
export function normalizeExtremeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/["“”'']/g, '')
    .replace(/[.!?]+\s*$/, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(the|a|an)\s+/i, '')
    .trim();
}

/** Whether a single user answer is correct for the given question. */
export function isAnswerCorrect(question: Question, userAnswer: string | undefined): boolean {
  if (!userAnswer) return false;

  const isOpenEnded = question.level === 'extreme';
  if (isOpenEnded) {
    return (
      normalizeExtremeAnswer(userAnswer) === normalizeExtremeAnswer(question.correctAnswer || '')
    );
  }

  return question.correctLetter != null && userAnswer === question.correctLetter;
}

/** Total score across a set of answered questions. */
export function calculateScore(questions: Question[], answers: Record<string, string>): number {
  let score = 0;
  questions.forEach((q) => {
    if (isAnswerCorrect(q, answers[q.id])) {
      score++;
    }
  });
  return score;
}

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'expert', 'extreme'] as const;

type DifficultyBucket = { correct: number; total: number };

/** Calculate grade from percentage */
export function calculateGrade(percentage: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentage >= 97) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Calculate full result details from a session.
 * Recomputes score with the shared scorer so displayed stats always match
 * play-time scoring. Unknown difficulty levels never crash: they count toward
 * correct/incorrect totals and the percentage but are not shown in the grid.
 */
export function calculateResult(session: QuizSession): QuizResult {
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const byDifficulty: Record<(typeof DIFFICULTY_LEVELS)[number], DifficultyBucket> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
    expert: { correct: 0, total: 0 },
    extreme: { correct: 0, total: 0 },
  };

  session.questions.forEach((q) => {
    const given = session.answers[q.id];
    // Distinct "unanswered" state (plan/02-mcq-quiz.md P1 #3): a missing or
    // empty answer is neither correct nor incorrect.
    if (given === undefined || given === null || given.trim() === '') {
      unansweredCount++;
      const bucket = (DIFFICULTY_LEVELS as readonly string[]).includes(q.level)
        ? byDifficulty[q.level as (typeof DIFFICULTY_LEVELS)[number]]
        : null;
      if (bucket) bucket.total++;
      return;
    }

    const isCorrect = isAnswerCorrect(q, given);

    if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    if ((DIFFICULTY_LEVELS as readonly string[]).includes(q.level)) {
      const bucket = byDifficulty[q.level as (typeof DIFFICULTY_LEVELS)[number]];
      bucket.total++;
      if (isCorrect) {
        bucket.correct++;
      }
    }
  });

  // Recompute with the shared scorer; fall back to the persisted score when
  // the session has no questions to re-evaluate.
  const recomputedScore =
    session.questions.length > 0
      ? calculateScore(session.questions, session.answers)
      : session.score;

  const percentage = session.maxScore > 0 ? (recomputedScore / session.maxScore) * 100 : 0;

  return {
    session,
    correctCount,
    incorrectCount,
    unansweredCount,
    percentage,
    grade: calculateGrade(percentage),
    byDifficulty,
  };
}
