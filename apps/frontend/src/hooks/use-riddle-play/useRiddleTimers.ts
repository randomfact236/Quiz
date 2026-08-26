/**
 * ============================================================================
 * useRiddleTimers — session countdown management
 * ============================================================================
 * Extracted from the riddle play page. Owns the total-session clock as a pure
 * tick — no side effects inside state updaters (time-up submission lives in
 * the main hook as a dedicated effect).
 *
 * Note: the card's timer ring in challenge mode visualizes the *shared pool*
 * (projected per-riddle budget computed by the page); there is no independent
 * per-riddle clock by design.
 * ============================================================================
 */

'use client';

import { useEffect } from 'react';

export type RiddlePlayStatus = 'loading' | 'playing' | 'paused' | 'completed';

interface UseRiddleTimersParams {
  status: RiddlePlayStatus;
  mode: 'timer' | 'practice';
  /** Total-session clock (timer mode); owned by the caller so submit can read it. */
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
}

export function useRiddleTimers({ status, mode, setTimeRemaining }: UseRiddleTimersParams): void {
  // Total-session countdown — pure tick, no side effects inside the updater
  useEffect(() => {
    if (status !== 'playing' || mode !== 'timer') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [status, mode, setTimeRemaining]);
}
