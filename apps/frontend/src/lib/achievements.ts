/**
 * ============================================================================
 * Achievements System
 * ============================================================================
 * Track and award achievements based on quiz performance
 * ============================================================================
 */

import type { Achievement } from '@/types/quiz-mcq';
import { STORAGE_KEYS, getItem, setItem } from './storage';
import { getChallengeStreak } from './challenge-streak';
import { getQuizHistory, getTotalStats } from './progress';
import { getRiddleHistory } from './riddle-progress';
import toast from './toast';

/** Predefined achievements */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first quiz',
    icon: '🎯',
    condition: { type: 'quiz_count', threshold: 1 },
  },
  {
    id: 'quiz-enthusiast',
    name: 'Quiz Enthusiast',
    description: 'Complete 10 quizzes',
    icon: '📚',
    condition: { type: 'quiz_count', threshold: 10 },
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Complete 50 quizzes',
    icon: '🏆',
    condition: { type: 'quiz_count', threshold: 50 },
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: '💯',
    condition: { type: 'perfect_score', threshold: 1 },
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a quiz in under 30 seconds',
    icon: '⚡',
    condition: { type: 'speed_run', threshold: 30 },
  },
  {
    id: 'chapter-champion',
    name: 'Chapter Champion',
    description: 'Complete a chapter with 100% score',
    icon: '👑',
    condition: { type: 'chapter_complete', threshold: 1 },
  },
  {
    id: 'subject-explorer',
    name: 'Subject Explorer',
    description: 'Complete at least one chapter in 5 different subjects',
    icon: '🔍',
    condition: { type: 'subject_explore', threshold: 5 },
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Answer 10 questions correctly in a row in Challenge mode',
    icon: '🔥',
    condition: { type: 'streak', threshold: 10 },
  },
  {
    id: 'persistence',
    name: 'Persistence',
    description: 'Retry a quiz 3 times on the same chapter',
    icon: '🔄',
    condition: { type: 'retry', threshold: 3 },
  },
  {
    id: 'accuracy-expert',
    name: 'Accuracy Expert',
    description: 'Maintain 90%+ accuracy across 10 quizzes',
    icon: '🎓',
    condition: { type: 'accuracy', threshold: 90 },
  },
];

/** Get user's unlocked achievements */
export function getUnlockedAchievements(): Achievement[] {
  const unlocked = getItem<Record<string, Achievement>>(STORAGE_KEYS.ACHIEVEMENTS, {});
  return Object.values(unlocked);
}

/** Check if an achievement is unlocked */
export function isAchievementUnlocked(achievementId: string): boolean {
  const unlocked = getItem<Record<string, Achievement>>(STORAGE_KEYS.ACHIEVEMENTS, {});
  return !!unlocked[achievementId];
}

/** Unlock an achievement */
export function unlockAchievement(achievement: Achievement): boolean {
  if (isAchievementUnlocked(achievement.id)) return false;

  const unlocked = getItem<Record<string, Achievement>>(STORAGE_KEYS.ACHIEVEMENTS, {});
  unlocked[achievement.id] = {
    ...achievement,
    unlockedAt: new Date().toISOString(),
  };
  setItem(STORAGE_KEYS.ACHIEVEMENTS, unlocked);
  return true;
}

/** Check and update achievements - returns newly unlocked achievements */
export function checkAchievements(): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  // Combined view: quiz-mcq sessions + riddle completions (P1 #1). Riddles
  // have no chapter, so chapter-keyed conditions skip entries with a blank
  // chapter to stay chapter-scoped.
  const quizHistory = getQuizHistory();
  const riddleHistory = getRiddleHistory();
  const history = [
    ...quizHistory,
    ...riddleHistory.map((r) => ({
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
    })),
  ];
  const stats = getTotalStats();

  ACHIEVEMENTS.forEach((achievement) => {
    if (isAchievementUnlocked(achievement.id)) return;

    let shouldUnlock = false;

    switch (achievement.condition.type) {
      case 'quiz_count':
        shouldUnlock = history.length >= achievement.condition.threshold;
        break;

      case 'perfect_score': {
        const perfectQuizzes = history.filter((s) => s.score === s.maxScore && s.maxScore > 0);
        shouldUnlock = perfectQuizzes.length >= achievement.condition.threshold;
        break;
      }

      case 'speed_run': {
        const fastQuizzes = history.filter(
          (s) => s.timeTaken <= achievement.condition.threshold && s.maxScore > 0
        );
        shouldUnlock = fastQuizzes.length > 0;
        break;
      }

      case 'chapter_complete': {
        // Distinct chapters with a perfect session (plan/02-mcq-quiz.md P2
        // audit): previously counted perfect quizzes, which duplicated the
        // perfect_score condition instead of measuring chapters. Riddles
        // (blank chapter) are excluded from this chapter-scoped condition.
        const perfectChapters = new Set(
          history
            .filter((s) => s.chapter && s.score === s.maxScore && s.maxScore > 0)
            .map((s) => `${s.subject}:${s.chapter}`)
        );
        shouldUnlock = perfectChapters.size >= achievement.condition.threshold;
        break;
      }

      case 'subject_explore': {
        // Semantics (clarified per plan/02-mcq-quiz.md P2 audit): any session
        // with a positive score counts as having "explored" that subject —
        // chapter completion is not required (the description matches this).
        const subjectsWithCompletion = new Set(
          history.filter((s) => s.score > 0).map((s) => s.subject)
        );
        shouldUnlock = subjectsWithCompletion.size >= achievement.condition.threshold;
        break;
      }

      case 'accuracy':
        shouldUnlock =
          stats.averageScore >= achievement.condition.threshold && history.length >= 10;
        break;

      case 'streak':
        // Challenge-mode tracker (plan/02-mcq-quiz.md P1 #2): consecutive
        // correct answers recorded by lib/challenge-streak.ts.
        shouldUnlock = getChallengeStreak().best >= achievement.condition.threshold;
        break;

      case 'retry': {
        // Check for chapters with 3+ attempts (riddles have no chapter -> skip)
        const chapterAttempts = new Map<string, number>();
        history.forEach((s) => {
          if (!s.chapter) return;
          const key = `${s.subject}:${s.chapter}`;
          chapterAttempts.set(key, (chapterAttempts.get(key) || 0) + 1);
        });
        shouldUnlock = Array.from(chapterAttempts.values()).some(
          (count) => count >= achievement.condition.threshold
        );
        break;
      }
    }

    if (shouldUnlock) {
      unlockAchievement(achievement);
      newlyUnlocked.push(achievement);
    }
  });

  return newlyUnlocked;
}

/** Get achievement progress (0-100) */
export function getAchievementProgress(achievement: Achievement): number {
  const history = getQuizHistory();
  const stats = getTotalStats();

  switch (achievement.condition.type) {
    case 'quiz_count':
      return Math.min(100, (history.length / achievement.condition.threshold) * 100);

    case 'perfect_score': {
      const perfectQuizzes = history.filter((s) => s.score === s.maxScore && s.maxScore > 0);
      return Math.min(100, (perfectQuizzes.length / achievement.condition.threshold) * 100);
    }

    case 'accuracy':
      if (history.length < 10) return Math.min(100, (history.length / 10) * 50);
      return Math.min(100, (stats.averageScore / achievement.condition.threshold) * 100);

    case 'subject_explore': {
      const subjectsWithCompletion = new Set(
        history.filter((s) => s.score > 0).map((s) => s.subject)
      );
      return Math.min(100, (subjectsWithCompletion.size / achievement.condition.threshold) * 100);
    }

    default:
      return isAchievementUnlocked(achievement.id) ? 100 : 0;
  }
}

export interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  progress: number;
  unlockedAt?: string | undefined;
}

/** Get all achievements with unlock status */
export function getAllAchievementsWithStatus(): AchievementWithStatus[] {
  const unlocked = getItem<Record<string, Achievement>>(STORAGE_KEYS.ACHIEVEMENTS, {});

  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    unlocked: !!unlocked[achievement.id],
    progress: getAchievementProgress(achievement),
    unlockedAt: unlocked[achievement.id]?.unlockedAt,
  }));
}

/** Get total achievements count */
export function getAchievementStats(): {
  total: number;
  unlocked: number;
  percentage: number;
} {
  const unlocked = getItem<Record<string, Achievement>>(STORAGE_KEYS.ACHIEVEMENTS, {});
  const total = ACHIEVEMENTS.length;
  const unlockedCount = Object.keys(unlocked).length;

  return {
    total,
    unlocked: unlockedCount,
    percentage: Math.round((unlockedCount / total) * 100),
  };
}

/** Toast notifications for newly unlocked achievements (P1 wiring, see TODO.md) */
export function toastAchievementUnlocks(newlyUnlocked: Achievement[]): void {
  newlyUnlocked.forEach((achievement) => {
    toast.success(`🏆 Achievement unlocked: ${achievement.name}`);
  });
}
