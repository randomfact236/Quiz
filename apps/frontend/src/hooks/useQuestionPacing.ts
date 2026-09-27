/**
 * ============================================================================
 * useQuestionPacing — reveal-hold → auto-advance, with the BUG-040 comments
 * gate. Shared by solo play (quiz-mcq/play) and duels (plan/18 §3): after an
 * answer, keep the reveal up for `advanceMs`, then advance. Opening the
 * comments panel cancels the pending advance; the caller proceeds when the
 * panel closes (closeComments + its own advance decision).
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export function useQuestionPacing({
  questionId,
  advanceMs = 3000,
  enabled = true,
  onAdvance,
}: {
  /** Question identity — when it changes, any pending advance and the comments
   *  panel are dropped (they belong to the previous question). */
  questionId: string | null;
  /** Milliseconds to hold the reveal before advancing. */
  advanceMs?: number;
  /** When false, scheduleAdvance is a no-op (solo timer mode advances on
   *  expiry instead; duels enable it always — race pacing). */
  enabled?: boolean;
  /** Fired when the timer expires. Uses the latest closure at fire time. */
  onAdvance: () => void;
}): {
  scheduleAdvance: () => void;
  clearAdvance: () => void;
  commentsOpen: boolean;
  toggleComments: () => void;
  closeComments: () => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirror for the fire-time check — the callback must not depend on state.
  const commentsOpenRef = useRef(false);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;
  const [commentsOpen, setCommentsOpen] = useState(false);

  const clearAdvance = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Question changed (advanced / went Back) or unmounted — nothing pending,
  // and the comments panel belongs to the previous question.
  useEffect(() => {
    clearAdvance();
    commentsOpenRef.current = false;
    setCommentsOpen(false);
    return clearAdvance;
  }, [questionId, clearAdvance]);

  const scheduleAdvance = useCallback(() => {
    if (!enabled) return;
    clearAdvance();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (!commentsOpenRef.current) onAdvanceRef.current();
    }, advanceMs);
  }, [enabled, advanceMs, clearAdvance]);

  const toggleComments = useCallback(() => {
    const next = !commentsOpenRef.current;
    commentsOpenRef.current = next;
    setCommentsOpen(next);
    // BUG-040: opening the panel cancels the pending advance.
    if (next) clearAdvance();
  }, [clearAdvance]);

  const closeComments = useCallback(() => {
    commentsOpenRef.current = false;
    setCommentsOpen(false);
  }, []);

  return {
    scheduleAdvance,
    clearAdvance,
    commentsOpen,
    toggleComments,
    closeComments,
  };
}
