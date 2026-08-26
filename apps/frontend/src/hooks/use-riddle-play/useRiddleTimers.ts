/**
 * ============================================================================
 * useRiddleTimers — total/per-riddle countdown management
 * ============================================================================
 * Extracted from the riddle play page. Owns both clocks as pure ticks — no
 * side effects inside state updaters (time-up submission lives in the main
 * hook as a dedicated effect).
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';

export type RiddlePlayStatus = 'loading' | 'playing' | 'paused' | 'completed';

/** Practice-mode per-riddle countdown limit (visual only). */
export const PRACTICE_RIDDLE_LIMIT = 60;

interface UseRiddleTimersParams {
  status: RiddlePlayStatus;
  mode: 'timer' | 'practice';
  /** Total-session clock (timer mode); owned by the caller so submit can read it. */
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  currentIndex: number;
}

export function useRiddleTimers({
  status,
  mode,
  setTimeRemaining,
  currentIndex,
}: UseRiddleTimersParams): number {
  // Total-session countdown — pure tick, no side effects inside the updater
  useEffect(() => {
    if (status !== 'playing' || mode !== 'timer') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [status, mode, setTimeRemaining]);

  // Practice mode per-riddle countdown — resets on navigation, visual only
  const [practiceRiddleTime, setPracticeRiddleTime] = useState(PRACTICE_RIDDLE_LIMIT);

  useEffect(() => {
    if (mode === 'timer') return;
    setPracticeRiddleTime(PRACTICE_RIDDLE_LIMIT);
  }, [currentIndex, mode]);

  useEffect(() => {
    if (mode === 'timer' || status !== 'playing') return;
    const t = setInterval(() => {
      setPracticeRiddleTime((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [currentIndex, status, mode]);

  return practiceRiddleTime;
}
