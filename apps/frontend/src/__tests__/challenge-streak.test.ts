/**
 * Challenge streak tracker tests — feeds the 'streak' achievement condition
 * (plan/02-mcq-quiz.md P1 #2): consecutive correct answers, best high-water mark.
 */

import {
  getChallengeStreak,
  recordChallengeAnswer,
  resetChallengeStreak,
} from '@/lib/challenge-streak';

describe('challenge-streak', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts at zero', () => {
    expect(getChallengeStreak()).toEqual({ current: 0, best: 0, updatedAt: '' });
  });

  it('counts consecutive correct answers', () => {
    [true, true, true].forEach((ok) => recordChallengeAnswer(ok));
    expect(getChallengeStreak().current).toBe(3);
    expect(getChallengeStreak().best).toBe(3);
  });

  it('resets current on an incorrect answer but keeps best', () => {
    [true, true, true, true, true].forEach((ok) => recordChallengeAnswer(ok));
    recordChallengeAnswer(false);
    expect(getChallengeStreak().current).toBe(0);
    expect(getChallengeStreak().best).toBe(5);
  });

  it('a new session window resets current, never best', () => {
    [true, true, true, true, true, true, true].forEach((ok) => recordChallengeAnswer(ok));
    resetChallengeStreak();
    expect(getChallengeStreak().current).toBe(0);
    expect(getChallengeStreak().best).toBe(7);
  });
});
