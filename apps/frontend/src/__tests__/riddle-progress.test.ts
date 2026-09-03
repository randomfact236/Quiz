/**
 * Riddle progress + achievements integration tests (plan/03-riddle-mcq.md P1 #1):
 * riddle completions previously fed nothing; now they feed the generic
 * achievement conditions (quiz_count, perfect_score, subject_explore, accuracy)
 * while chapter-scoped conditions stay quiz-only.
 */

import { checkAchievements } from '@/lib/achievements';
import { saveRiddleResult, getRiddleHistory, getRiddleStats } from '@/lib/riddle-progress';
import type { RiddleSession } from '@/types/riddles';

const makeRiddleSession = (overrides: Partial<RiddleSession> = {}): RiddleSession =>
  ({
    id: Math.random().toString(36).slice(2),
    mode: 'practice',
    subjectId: 'logic',
    subjectName: 'Logic',
    difficulty: 'easy',
    riddles: [{}, {}, {}, {}] as RiddleSession['riddles'],
    answers: {},
    score: 4,
    startedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    timeTaken: 45,
    status: 'completed',
    hintsUsed: 0,
    skippedRiddles: [],
    ...overrides,
  }) as RiddleSession;

describe('riddle-progress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records completions into the capped history', () => {
    saveRiddleResult(makeRiddleSession());
    const history = getRiddleHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      subjectId: 'logic',
      score: 4,
      maxScore: 4,
      status: 'completed',
    });
  });

  it('derives aggregate stats', () => {
    saveRiddleResult(makeRiddleSession({ score: 4 }));
    saveRiddleResult(makeRiddleSession({ score: 2 }));
    const stats = getRiddleStats();
    expect(stats.totalQuizzes).toBe(2);
    expect(stats.totalQuestions).toBe(8);
    expect(stats.averageScore).toBe(75);
  });
});

describe('achievements see riddle play', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('a perfect riddle session unlocks perfect_score', () => {
    saveRiddleResult(makeRiddleSession({ score: 4 }));
    const unlocked = checkAchievements().map((a) => a.id);
    expect(unlocked).toContain('perfect-score');
  });

  it('riddle sessions count toward quiz_count', () => {
    // 'first-steps' unlocks at 1 completed quiz
    saveRiddleResult(makeRiddleSession());
    const unlocked = checkAchievements().map((a) => a.id);
    expect(unlocked).toContain('first-steps');
  });

  it('perfect riddles do NOT satisfy the chapter-scoped chapter_complete', () => {
    // chapter-champion is about QUIZ chapters; riddles have no chapter.
    saveRiddleResult(makeRiddleSession({ score: 4 }));
    // Seed one quiz-chapter history key so we can assert riddles alone add nothing
    const unlocked = checkAchievements()
      .map((a) => a.id)
      .filter((id) => id === 'chapter-champion');
    // The only history is riddles (blank chapter) — chapter-champion must not unlock
    // purely from riddle play.
    expect(unlocked).toHaveLength(0);
  });
});
