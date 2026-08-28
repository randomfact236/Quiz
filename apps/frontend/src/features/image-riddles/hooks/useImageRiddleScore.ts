/**
 * ============================================================================
 * useImageRiddleScore — solved vs revealed tracking with persistence
 * ============================================================================
 * Correct guesses ("solved") are tracked separately from give-ups/time-outs
 * ("revealed") so the header shows an honest score. Both sets persist to
 * localStorage and survive reloads.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { STORAGE_KEYS, getItem, setItemDebounced } from '@/lib/storage';

export interface ImageRiddleScore {
  solved: number;
  revealed: number;
  total: number;
}

export function useImageRiddleScore(total: number) {
  const [solvedIds, setSolvedIds] = useState<Record<string, boolean>>({});
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  // Restore persisted progress once on mount (after first client render to
  // avoid hydration mismatch).
  useEffect(() => {
    setSolvedIds(getItem<Record<string, boolean>>(STORAGE_KEYS.IMAGE_RIDDLE_SOLVED, {}));
    setRevealedIds(getItem<Record<string, boolean>>(STORAGE_KEYS.IMAGE_RIDDLE_REVEALED, {}));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) setItemDebounced(STORAGE_KEYS.IMAGE_RIDDLE_SOLVED, solvedIds);
  }, [solvedIds, hydrated]);

  useEffect(() => {
    if (hydrated) setItemDebounced(STORAGE_KEYS.IMAGE_RIDDLE_REVEALED, revealedIds);
  }, [revealedIds, hydrated]);

  const recordSolved = useCallback((id: string) => {
    setSolvedIds((prev) => ({ ...prev, [id]: true }));
  }, []);

  const recordRevealed = useCallback((id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: true }));
  }, []);

  /** Card-level reveal toggle (show/hide the answer directly on the grid). */
  const toggleRevealed = useCallback((id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const score = useMemo<ImageRiddleScore>(
    () => ({
      solved: Object.keys(solvedIds).length,
      revealed: Object.keys(revealedIds).filter((id) => !solvedIds[id]).length,
      total,
    }),
    [solvedIds, revealedIds, total]
  );

  return { solvedIds, revealedIds, score, recordSolved, recordRevealed, toggleRevealed };
}
