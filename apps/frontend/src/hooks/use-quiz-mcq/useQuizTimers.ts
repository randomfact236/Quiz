/**
 * ============================================================================
 * useQuizTimers — total/per-question countdown management
 * ============================================================================
 * Extracted from useQuizMcq (P1 refactor). Owns the 1s tick interval and the
 * timeLimit sync effect. The tick is a pure state transition; completion is
 * detected by the single completion save path in the main hook.
 * ============================================================================
 */

'use client';

import { useEffect } from 'react';

import type { QuizState } from '@/types/quiz-mcq';

type SetState = React.Dispatch<React.SetStateAction<QuizState>>;

export function useQuizTimers(
  status: QuizState['status'],
  setState: SetState,
  timeLimit?: number,
  timerMode?: 'total' | 'per-question'
): void {
  // Sync when settings load / change
  useEffect(() => {
    setState((prev) => ({ ...prev, timeRemaining: timeLimit || 0 }));
  }, [timeLimit]);

  useEffect(() => {
    if (status !== 'playing' || !timeLimit) return;

    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.status === 'paused') return prev;

        const newTimeRemaining = prev.timeRemaining - 1;
        if (newTimeRemaining <= 0) {
          if (timerMode === 'per-question') {
            const isLast = prev.currentQuestionIndex >= prev.questions.length - 1;
            if (isLast) {
              return { ...prev, timeRemaining: 0, status: 'completed' };
            }
            return {
              ...prev,
              timeRemaining: timeLimit,
              currentQuestionIndex: prev.currentQuestionIndex + 1,
            };
          }
          return { ...prev, timeRemaining: 0, status: 'completed' };
        }
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLimit, timerMode]);
}
