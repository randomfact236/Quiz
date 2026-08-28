/**
 * ============================================================================
 * useImageRiddleTimers — modal countdown (mirrors riddle-mcq useRiddleTimers)
 * ============================================================================
 * Starts a countdown for the open riddle and reports expiry via callback.
 * The hook never auto-reveals; the game layer decides what expiry means.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useImageRiddleTimers(onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  /** Start (or restart) the countdown; seconds <= 0 leaves it untimed. */
  const start = useCallback((seconds: number) => {
    setTimeLeft(seconds);
    setIsActive(seconds > 0);
  }, []);

  const stop = useCallback(() => setIsActive(false), []);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Fire expiry exactly once when the clock reaches zero while running.
  useEffect(() => {
    if (isActive && timeLeft === 0) {
      setIsActive(false);
      onExpireRef.current();
    }
  }, [isActive, timeLeft]);

  return { timeLeft, isActive, start, stop };
}
