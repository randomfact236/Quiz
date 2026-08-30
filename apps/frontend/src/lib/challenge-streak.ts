/**
 * ============================================================================
 * Challenge Streak Tracker
 * ============================================================================
 * Feeds the 'streak' achievement condition (Streak Master: 10 correct answers
 * in a row in Challenge mode) — plan/02-mcq-quiz.md P1 #2. Previously the
 * evaluator was a dead `case`; nothing tracked consecutive correct answers.
 *
 * Storage shape: { current, best, updatedAt }. `current` counts consecutive
 * correct answers; it resets on an incorrect answer (and on explicit session
 * reset). `best` is the high-water mark checked by the achievement evaluator.
 * ============================================================================
 */

import { getItem, setItem, STORAGE_KEYS } from './storage';

interface ChallengeStreakState {
  current: number;
  best: number;
  updatedAt: string;
}

const STREAK_KEY = STORAGE_KEYS.CHALLENGE_STREAK;

export function getChallengeStreak(): ChallengeStreakState {
  return getItem<ChallengeStreakState>(STREAK_KEY, { current: 0, best: 0, updatedAt: '' });
}

/** Records one graded answer; only correct answers extend the streak. */
export function recordChallengeAnswer(isCorrect: boolean): void {
  const state = getChallengeStreak();
  const current = isCorrect ? state.current + 1 : 0;
  setItem(STREAK_KEY, {
    current,
    best: Math.max(state.best, current),
    updatedAt: new Date().toISOString(),
  } satisfies ChallengeStreakState);
}

/** Starts a fresh streak window (call when a new challenge session begins). */
export function resetChallengeStreak(): void {
  const state = getChallengeStreak();
  setItem(STREAK_KEY, { current: 0, best: state.best, updatedAt: new Date().toISOString() });
}
