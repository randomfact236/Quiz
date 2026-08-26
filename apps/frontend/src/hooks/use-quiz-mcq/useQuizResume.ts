/**
 * ============================================================================
 * useQuizResume — mount-time resume decision + prompt state
 * ============================================================================
 * Extracted from useQuizMcq (P1 refactor). Decides once per mount whether a
 * saved session can be resumed for these URL params, owns the prompt state,
 * and exposes the reset used by "Start Fresh".
 * ============================================================================
 */

'use client';

import { useCallback, useState } from 'react';

import { loadQuizResume, isQuizResumeMatch, type QuizResumeState } from '@/lib/quiz-mcq-resume';

export interface QuizResumeMountDecision {
  resumeSession: QuizResumeState | null;
  startIndex: number;
  sessionSize: number;
  isShared: boolean;
}

export interface UseQuizResumeOptions {
  subject: string;
  chapter: string;
  level: string;
  mode?: string | undefined;
  type?: string | undefined;
  isSharedLink: boolean;
  startFromShare: number | null;
  initialTotal: number | null;
}

/** Decided exactly once per mount (state initializer = stable identity). */
function computeMountDecision(options: UseQuizResumeOptions): QuizResumeMountDecision {
  const { subject, chapter, level, mode, type, isSharedLink, startFromShare, initialTotal } =
    options;

  const isShared = isSharedLink;
  let resumeSession: QuizResumeState | null = null;

  if (!isShared) {
    const saved = loadQuizResume();
    const currentMode = type ? `${mode}_${type}` : (mode ?? 'normal');
    if (saved && isQuizResumeMatch(saved, subject, chapter, level, currentMode)) {
      resumeSession = saved;
    }
  }

  return {
    resumeSession,
    startIndex: isShared
      ? startFromShare
        ? startFromShare - 1
        : 0
      : resumeSession
        ? resumeSession.currentQuestionIndex
        : 0,
    sessionSize: isShared ? initialTotal || 10 : resumeSession ? resumeSession.sessionSize : 10,
    isShared,
  };
}

const FRESH_DECISION: QuizResumeMountDecision = {
  resumeSession: null,
  startIndex: 0,
  sessionSize: 10,
  isShared: false,
};

export function useQuizResume(options: UseQuizResumeOptions) {
  const [mountDecision, setMountDecision] = useState<QuizResumeMountDecision>(() =>
    computeMountDecision(options)
  );

  const [showResumePrompt, setShowResumePrompt] = useState(
    () => mountDecision.resumeSession !== null
  );
  const [pendingResumeState] = useState<QuizResumeState | null>(() => mountDecision.resumeSession);

  const clearPrompt = useCallback(() => setShowResumePrompt(false), []);

  /** "Start Fresh": drop the saved decision so the loader refetches cleanly. */
  const startFreshReset = useCallback(() => {
    setMountDecision(FRESH_DECISION);
    setShowResumePrompt(false);
  }, []);

  return {
    mountDecision,
    showResumePrompt,
    pendingResumeState,
    clearPrompt,
    startFreshReset,
  };
}
