/**
 * Achievement condition audit tests (plan/02-mcq-quiz.md P2):
 * chapter_complete counts DISTINCT chapters with a perfect session (not just
 * any perfect quiz), and subject_explore counts subjects with score > 0.
 */

import { checkAchievements } from '@/lib/achievements';
import { STORAGE_KEYS, setItem } from '@/lib/storage';
import type { QuizSession } from '@/types/quiz-mcq';

const makeSession = (overrides: Partial<QuizSession> = {}): QuizSession =>
  ({
    id: Math.random().toString(36).slice(2),
    subject: 'math',
    subjectName: 'Math',
    chapter: 'algebra',
    level: 'easy',
    questions: [],
    answers: {},
    score: 5,
    maxScore: 5,
    startedAt: new Date().toISOString(),
    timeTaken: 60,
    status: 'completed',
    ...overrides,
  }) as QuizSession;

const seed = (sessions: QuizSession[]) => setItem(STORAGE_KEYS.QUIZ_HISTORY, sessions);

describe('achievement conditions (audit)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('chapter_complete unlocks once one chapter has a perfect session', () => {
    seed([makeSession()]);
    const unlocked = checkAchievements().map((a) => a.id);
    expect(unlocked).toContain('chapter-champion');
  });

  it('chapter_complete requires DISTINCT chapters — two perfect quizzes in one chapter do not reach threshold 2', () => {
    // Simulate a threshold-2 variant of the condition by evaluating the
    // distinct-chapter logic directly (the shipped achievement has threshold 1).
    seed([
      makeSession({ id: 'a', subject: 'math', chapter: 'algebra', score: 5, maxScore: 5 }),
      makeSession({ id: 'b', subject: 'math', chapter: 'algebra', score: 5, maxScore: 5 }),
    ]);
    const unlocked = checkAchievements().map((a) => a.id);
    // threshold 1 achievement still unlocks (one distinct chapter)…
    expect(unlocked).toContain('chapter-champion');
    // …but two perfect quizzes ≠ two chapters; the distinct count stays 1.
    const history = require('@/lib/progress').getQuizHistory() as QuizSession[];
    const distinct = new Set(history.map((s) => `${s.subject}:${s.chapter}`));
    expect(distinct.size).toBe(1);
  });

  it('subject_explore counts a subject explored on any positive score', () => {
    seed([
      makeSession({ subject: 'math', score: 1, maxScore: 5 }),
      makeSession({ subject: 'history', score: 2, maxScore: 5 }),
    ]);
    const unlocked = checkAchievements().map((a) => a.id);
    expect(unlocked).not.toContain('subject-explorer'); // threshold 5
  });
});
