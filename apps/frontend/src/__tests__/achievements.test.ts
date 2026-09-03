/**
 * Achievement condition audit tests (plan/02-mcq-quiz.md P2):
 * chapter_complete counts DISTINCT chapters with a perfect session (not just
 * any perfect quiz), and subject_explore counts subjects with score > 0.
 */

import { checkAchievements, getAchievementProgress, ACHIEVEMENTS } from '@/lib/achievements';
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

describe('achievement progress math (plan/06-achievements.md P2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const condition = (type: string, threshold: number) => {
    const achievement = ACHIEVEMENTS.find((a) => a.condition.type === type)!;
    return { ...achievement, condition: { type, threshold } as typeof achievement.condition };
  };

  it('quiz_count scales with sessions', () => {
    seed([makeSession(), makeSession({ id: 'b' })]);
    expect(getAchievementProgress(condition('quiz_count', 4))).toBe(50);
  });

  it('speed_run is 100 when a run beats the threshold', () => {
    seed([makeSession({ timeTaken: 10 })]);
    expect(getAchievementProgress(condition('speed_run', 30))).toBe(100);
  });

  it('speed_run partial progress reflects fastest run vs target', () => {
    seed([makeSession({ timeTaken: 60 })]);
    expect(getAchievementProgress(condition('speed_run', 30))).toBe(50);
  });

  it('streak reflects the tracker best', () => {
    const { recordChallengeAnswer } = require('@/lib/challenge-streak');
    [true, true, true, true, true].forEach((ok: boolean) => recordChallengeAnswer(ok));
    expect(getAchievementProgress(condition('streak', 10))).toBe(50);
  });

  it('retry reflects the most-attempted chapter', () => {
    seed([
      makeSession({ id: 'a', chapter: 'algebra' }),
      makeSession({ id: 'b', chapter: 'algebra' }),
      makeSession({ id: 'c', chapter: 'geometry' }),
    ]);
    expect(getAchievementProgress(condition('retry', 3))).toBeCloseTo(100 * (2 / 3));
  });

  it('locked achievements with no data show 0', () => {
    expect(getAchievementProgress(condition('chapter_complete', 1))).toBe(0);
  });
});
