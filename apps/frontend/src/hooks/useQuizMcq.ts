/**
 * ============================================================================
 * useQuizMcq Hook
 * ============================================================================
 * Core quiz state management — orchestration only. Pure helpers live in
 * ./use-quiz-mcq/quiz-engine.utils.ts, timers in useQuizTimers, and the
 * mount-time resume decision in useQuizResume.
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import type {
  Question,
  QuizSession,
  QuizState,
  QuizComputed,
  UseQuizMcqReturn,
} from '@/types/quiz-mcq';
import { STORAGE_KEYS, getItem, setItem } from '@/lib/storage';
import { QUIZ_HISTORY_MAX } from '@/lib/quiz-mcq-constants';
import { saveQuizResume, clearQuizResume, type QuizResumeState } from '@/lib/quiz-mcq-resume';
import {
  getSubjectBySlug,
  getSubjectRandomQuestions,
  getMixedQuestions,
  getRandomQuestions,
} from '@/lib/quiz-mcq-api';
import { calculateScore, calculateResult } from '@/lib/quiz-mcq-scoring';
import { saveQuizResult } from '@/lib/progress';
import { saveQuizSession } from '@/lib/quiz-mcq-api';
import { getGuestId } from '@/lib/guest-id';
import { checkAchievements, toastAchievementUnlocks } from '@/lib/achievements';
import { track } from '@/lib/analytics';
import { saveQuizResumeQuestions } from '@/lib/quiz-mcq-resume';

import {
  QUIZ_SESSION_SIZE,
  generateUUID,
  convertQuizQuestion,
  navigateTimeRemaining,
} from './use-quiz-mcq/quiz-engine.utils';
import { useQuizTimers } from './use-quiz-mcq/useQuizTimers';
import { useQuizResume } from './use-quiz-mcq/useQuizResume';

import type { QuizQuestion } from '@/lib/quiz-mcq-api';

/** Load questions from API based on subject, chapter, and level */
async function loadQuestions(
  subject: string,
  chapter: string,
  level: string
): Promise<{ all: Question[]; total: number }> {
  try {
    let allQuestions: QuizQuestion[] = [];

    if (subject === 'all') {
      const result = level === 'all' ? await getMixedQuestions() : await getRandomQuestions(level);
      allQuestions = result.data;
    } else {
      // Capacity-plan A2: capped random selection instead of whole-bank fetch.
      let chapterId: string | undefined;
      if (chapter !== 'all') {
        const subjectData = await getSubjectBySlug(subject);
        const found = subjectData.chapters?.find((c) => c.name === chapter);
        if (found) {
          chapterId = found.id;
        }
      }
      const result = await getSubjectRandomQuestions(subject, {
        count: QUIZ_SESSION_SIZE,
        level,
        ...(chapterId ? { chapterId } : {}),
      });
      allQuestions = result.data;
    }

    const convertedQuestions = allQuestions.map(convertQuizQuestion);
    return { all: convertedQuestions, total: convertedQuestions.length };
  } catch (error) {
    console.error('Failed to load questions from API:', error);
    return { all: [], total: 0 };
  }
}

/** Save quiz session to history (capped — oldest entries pruned) */
function saveToHistory(session: QuizSession): void {
  const history = getItem<QuizSession[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
  history.push(session);
  if (history.length > QUIZ_HISTORY_MAX) {
    history.splice(0, history.length - QUIZ_HISTORY_MAX);
  }
  setItem(STORAGE_KEYS.QUIZ_HISTORY, history);

  // P1 fix (TODO.md backlog): chapter/subject progress and achievements were
  // never written on completion; both completion paths funnel through here.
  saveQuizResult(session);
  const unlocked = checkAchievements();
  toastAchievementUnlocks(unlocked);
  // Analytics plan §4.4: sync achievement unlocks as events.
  unlocked.forEach((achievement) =>
    track(
      'achievement_unlocked',
      { achievementId: achievement.id, name: achievement.name },
      { module: 'quiz-mcq', sessionId: session.id }
    )
  );

  // Server-side persistence (plan/02-mcq-quiz.md P1 #1): completed sessions are
  // stored for the logged-in user (token auto-attached by api-client) or the
  // client-issued guestId, so results survive browser/device loss.
  if (session.status === 'completed') {
    void saveQuizSession({
      guestId: getGuestId(),
      subjectSlug: session.subject,
      subjectName: session.subjectName,
      chapterName: session.chapter,
      level: session.level,
      totalQuestions: session.questions.length,
      correctCount: calculateResult(session).correctCount,
      score: session.score,
      maxScore: session.maxScore,
      durationSeconds: session.timeTaken,
    }).catch(() => undefined);
  }
}

/** Save current session for resume */
function saveCurrentSession(session: QuizSession): void {
  setItem(STORAGE_KEYS.CURRENT_SESSION, session);
}

/** Clear current session */
function clearCurrentSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
}

/** Get subject name from slug */
async function getSubjectName(slug: string): Promise<string> {
  try {
    const meta = await getSubjectBySlug(slug);
    return meta.name || slug;
  } catch {
    return slug;
  }
}

export function useQuizMcq(
  subject: string,
  chapter: string,
  level: string,
  timeLimit?: number,
  timerMode?: 'total' | 'per-question',
  startFromShare?: number | null,
  initialTotal?: number | null,
  mode?: string,
  type?: string,
  isSharedLink?: boolean
): UseQuizMcqReturn {
  const sessionRef = useRef<QuizSession | null>(null);

  const startFromShareRef = useRef(startFromShare);

  // Mount-time resume decision + prompt state (extracted module)
  const resumeController = useQuizResume({
    subject,
    chapter,
    level,
    mode,
    type,
    isSharedLink: isSharedLink ?? false,
    startFromShare: startFromShare ?? null,
    initialTotal: initialTotal ?? null,
  });
  const { showResumePrompt, pendingResumeState } = resumeController;

  const [state, setState] = useState<QuizState>({
    questions: [],
    availableQuestions: [],
    sessionSize: resumeController.mountDecision.sessionSize,
    currentQuestionIndex: 0,
    answers: {},
    score: 0,
    timeRemaining: timeLimit || 0,
    status: 'loading',
    startTime: Date.now(),
    sessionId: '',
    visited: new Set<string>(),
    manuallySkipped: new Set<string>(),
    dismissedUnvisited: false,
  });

  const [originalTotal, setOriginalTotal] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (resumeController.mountDecision.resumeSession) return;

    const controller = new AbortController();

    const load = async () => {
      if (controller.signal.aborted) return;

      const { all, total } = await loadQuestions(subject, chapter, level);
      if (controller.signal.aborted) return;

      setOriginalTotal(total);

      if (all.length === 0) {
        setState((prev) => ({ ...prev, status: 'completed' }));
        return;
      }

      const decision = resumeController.mountDecision;
      const initialQuestions = all.slice(0, decision.sessionSize);

      sessionRef.current = {
        id: generateUUID(),
        subject,
        subjectName: await getSubjectName(subject),
        chapter,
        level,
        questions: initialQuestions,
        answers: {},
        score: 0,
        maxScore: initialQuestions.length,
        startedAt: new Date().toISOString(),
        timeTaken: 0,
        status: 'in-progress',
      };

      const initialVisited = new Set<string>();
      const startQ = initialQuestions[decision.startIndex];
      if (startQ) initialVisited.add(startQ.id);

      setState((prev) => ({
        ...prev,
        availableQuestions: all,
        questions: initialQuestions,
        sessionSize: decision.sessionSize,
        currentQuestionIndex: decision.startIndex,
        answers: {},
        score: 0,
        timeRemaining: timeLimit || 0,
        status: 'playing',
        startTime: Date.now(),
        sessionId: sessionRef.current!.id,
        visited: initialVisited,
        manuallySkipped: new Set<string>(),
        dismissedUnvisited: false,
      }));

      saveCurrentSession(sessionRef.current);

      // Write the immutable question snapshot once (two-key resume: the
      // lightweight progress key never re-serializes questions).
      const initialMode = type ? `${mode}_${type}` : (mode ?? 'normal');

      // Analytics plan §4.1: session_started with setup dimensions.
      track(
        'session_started',
        {
          mode: initialMode,
          subject,
          chapter,
          level,
          questionCount: initialQuestions.length,
        },
        { module: 'quiz-mcq', sessionId: sessionRef.current.id }
      );

      saveQuizResumeQuestions(
        {
          subject,
          chapter,
          level,
          mode: initialMode as QuizResumeState['mode'],
        },
        all
      );
    };

    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, chapter, level, resetKey]);

  // Timers (extracted module)
  useQuizTimers(state.status, setState, timeLimit, timerMode);

  const selectAnswer = useCallback((option: string) => {
    setState((prev) => {
      const currentQuestion = prev.questions[prev.currentQuestionIndex];
      if (!currentQuestion) return prev;

      const newAnswers = { ...prev.answers, [currentQuestion.id]: option };
      const newScore = calculateScore(prev.questions, newAnswers);

      const newVisited = new Set(prev.visited).add(currentQuestion.id);
      const newSkipped = new Set(prev.manuallySkipped);
      newSkipped.delete(currentQuestion.id);

      if (sessionRef.current) {
        sessionRef.current.answers = newAnswers;
        sessionRef.current.score = newScore;
        saveCurrentSession(sessionRef.current);
      }

      return {
        ...prev,
        answers: newAnswers,
        score: newScore,
        visited: newVisited,
        manuallySkipped: newSkipped,
      };
    });
  }, []);

  const goToPrevious = useCallback(() => {
    setState((prev) => {
      const newIndex = Math.max(0, prev.currentQuestionIndex - 1);
      const visitedQuestion = prev.questions[newIndex];
      const newVisited = new Set(prev.visited);
      if (visitedQuestion) newVisited.add(visitedQuestion.id);

      return {
        ...prev,
        currentQuestionIndex: newIndex,
        visited: newVisited,
        // UX fix: going BACK must not reset a per-question timer (free time).
        timeRemaining: navigateTimeRemaining('neutral', timerMode, timeLimit, prev.timeRemaining),
      };
    });
  }, [timerMode, timeLimit]);

  const goToNext = useCallback(() => {
    setState((prev) => {
      const newIndex = Math.min(prev.questions.length - 1, prev.currentQuestionIndex + 1);
      const visitedQuestion = prev.questions[newIndex];
      const newVisited = new Set(prev.visited);
      if (visitedQuestion) newVisited.add(visitedQuestion.id);

      return {
        ...prev,
        currentQuestionIndex: newIndex,
        visited: newVisited,
        timeRemaining: navigateTimeRemaining('forward', timerMode, timeLimit, prev.timeRemaining),
      };
    });
  }, [timerMode, timeLimit]);

  const submitQuiz = useCallback(() => {
    // Pure state flip only — all save/cleanup side effects live in the single
    // completion effect below (P1 fix: no side effects inside setState
    // updaters, no double-completion race between callback and effect).
    setState((prev) => ({ ...prev, status: 'completed' }));
  }, []);

  // Single completion save path — runs once per completed session.
  const didSaveCompletionRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.status !== 'completed') return;
    if (!sessionRef.current) return;
    if (didSaveCompletionRef.current === sessionRef.current.id) return;

    const timeTaken = Math.floor((Date.now() - state.startTime) / 1000);

    sessionRef.current.status = 'completed';
    sessionRef.current.completedAt = new Date().toISOString();
    sessionRef.current.timeTaken = timeTaken;
    sessionRef.current.score = state.score;
    sessionRef.current.answers = state.answers;

    didSaveCompletionRef.current = sessionRef.current.id;

    saveToHistory(sessionRef.current);

    // Analytics plan §4.1: session_completed with score + grade breakdown.
    const session = sessionRef.current;
    const result = calculateResult(session);
    const completedMode = type ? `${mode}_${type}` : (mode ?? 'normal');
    track(
      'session_completed',
      {
        mode: completedMode,
        subject: session.subject,
        chapter: session.chapter,
        level: session.level,
        questionCount: session.questions.length,
        score: session.score,
        maxScore: session.maxScore,
        percentage: result.percentage,
        grade: result.grade,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        answeredCount: Object.keys(session.answers).length,
        timeTaken,
      },
      { module: 'quiz-mcq', sessionId: session.id }
    );

    clearCurrentSession();
    clearQuizResume();
  }, [state.status, state.startTime, state.score, state.answers]);

  // Analytics plan §4.2: per-answer + manual-skip events. Effect-based (not
  // inside setState updaters) so React StrictMode double-invocation can't
  // double-emit; the ref makes each question tracked exactly once.
  const trackedAnswersRef = useRef<Set<string>>(new Set());
  const trackedSkipsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!sessionRef.current) return;
    const sessionId = sessionRef.current.id;
    for (const q of state.questions) {
      const selected = state.answers[q.id];
      if (selected && !trackedAnswersRef.current.has(q.id)) {
        trackedAnswersRef.current.add(q.id);
        track(
          'question_answered',
          {
            questionId: q.id,
            subject: sessionRef.current.subject,
            chapter: sessionRef.current.chapter,
            level: sessionRef.current.level,
            selectedOption: selected,
            correct: selected === q.correctAnswer,
          },
          { module: 'quiz-mcq', sessionId }
        );
      }
      if (state.manuallySkipped.has(q.id) && !trackedSkipsRef.current.has(q.id)) {
        trackedSkipsRef.current.add(q.id);
        track(
          'question_skipped',
          { questionId: q.id, manual: true },
          { module: 'quiz-mcq', sessionId }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answers, state.manuallySkipped, state.questions]);

  useEffect(() => {
    if (state.status !== 'playing') return;
    if (state.availableQuestions.length === 0) return;
    if (
      Object.keys(state.answers).length === 0 &&
      state.manuallySkipped.size === 0 &&
      state.currentQuestionIndex === 0
    )
      return;

    const currentMode = type ? `${mode}_${type}` : (mode ?? 'normal');

    saveQuizResume({
      subject,
      chapter,
      level,
      mode: currentMode as QuizResumeState['mode'],
      currentQuestionIndex: state.currentQuestionIndex,
      sessionSize: state.sessionSize,
      answers: state.answers,
      score: state.score,
      manuallySkipped: Array.from(state.manuallySkipped),
      startedAt: new Date(state.startTime).toISOString(),
    });
  }, [
    state.currentQuestionIndex,
    state.answers,
    state.manuallySkipped,
    state.sessionSize,
    state.status,
  ]);

  const handleResumeSession = useCallback(() => {
    const saved = pendingResumeState;
    if (!saved) return;

    const newId = generateUUID();
    sessionRef.current = {
      id: newId,
      subject: saved.subject,
      subjectName: saved.subject,
      chapter: saved.chapter,
      level: saved.level,
      questions: saved.availableQuestions.slice(0, saved.sessionSize),
      answers: saved.answers,
      score: saved.score,
      maxScore: saved.sessionSize,
      startedAt: saved.startedAt,
      timeTaken: 0,
      status: 'in-progress',
    };

    setState((prev) => ({
      ...prev,
      availableQuestions: saved.availableQuestions,
      questions: saved.availableQuestions.slice(0, saved.sessionSize),
      sessionSize: saved.sessionSize,
      currentQuestionIndex: saved.currentQuestionIndex,
      answers: saved.answers,
      score: saved.score,
      manuallySkipped: new Set(saved.manuallySkipped),
      status: 'playing',
      startTime: Date.now(),
      sessionId: newId,
      visited: new Set(Object.keys(saved.answers)),
      timeRemaining: timeLimit || 0,
    }));

    resumeController.clearPrompt();
    saveCurrentSession(sessionRef.current);

    // Analytics plan §4.1: session_resumed with saved progress.
    track(
      'session_resumed',
      {
        subject: saved.subject,
        chapter: saved.chapter,
        level: saved.level,
        progressAtSave: Object.keys(saved.answers).length,
      },
      { module: 'quiz-mcq', sessionId: newId }
    );
  }, [pendingResumeState, timeLimit]);

  const handleStartFresh = useCallback(() => {
    clearQuizResume();
    resumeController.startFreshReset();
    setResetKey((k) => k + 1);
  }, []);

  const addMoreQuestions = useCallback((count: number) => {
    // Pure updater — sessionRef sync happens in the effect below.
    setState((prev) => {
      const newSize = Math.min(prev.sessionSize + count, prev.availableQuestions.length);
      return {
        ...prev,
        questions: prev.availableQuestions.slice(0, newSize),
        sessionSize: newSize,
      };
    });
  }, []);

  // Keep the mutable session snapshot in sync after size changes.
  useEffect(() => {
    if (!sessionRef.current || state.status !== 'playing') return;
    sessionRef.current.maxScore = state.sessionSize;
    sessionRef.current.questions = state.questions;
  }, [state.sessionSize, state.questions, state.status]);

  const pauseQuiz = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'paused' }));
  }, []);

  const resumeQuiz = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'playing' }));
  }, []);

  const handleSkip = useCallback(() => {
    setState((prev) => {
      const currentQuestion = prev.questions[prev.currentQuestionIndex];
      if (!currentQuestion) return prev;

      const newIndex = Math.min(prev.questions.length - 1, prev.currentQuestionIndex + 1);
      const visitedQuestion = prev.questions[newIndex];

      const newSkipped = new Set(prev.manuallySkipped).add(currentQuestion.id);
      const newVisited = new Set(prev.visited).add(currentQuestion.id);
      if (visitedQuestion) newVisited.add(visitedQuestion.id);

      return {
        ...prev,
        currentQuestionIndex: newIndex,
        manuallySkipped: newSkipped,
        visited: newVisited,
        timeRemaining: navigateTimeRemaining('forward', timerMode, timeLimit, prev.timeRemaining),
      };
    });
  }, [timerMode, timeLimit]);

  const jumpToQuestion = useCallback(
    (index: number) => {
      setState((prev) => {
        const newIndex = Math.max(0, Math.min(index, prev.questions.length - 1));
        const visitedQuestion = prev.questions[newIndex];
        const newVisited = new Set(prev.visited);
        if (visitedQuestion) newVisited.add(visitedQuestion.id);

        return {
          ...prev,
          currentQuestionIndex: newIndex,
          visited: newVisited,
          timeRemaining:
            newIndex >= prev.currentQuestionIndex
              ? navigateTimeRemaining('forward', timerMode, timeLimit, prev.timeRemaining)
              : navigateTimeRemaining('neutral', timerMode, timeLimit, prev.timeRemaining),
        };
      });
    },
    [timerMode, timeLimit]
  );

  const dismissUnvisited = useCallback(() => {
    setState((prev) => {
      const visitedQuestion = prev.questions[0];
      const newVisited = new Set(prev.visited);
      if (visitedQuestion) newVisited.add(visitedQuestion.id);

      return {
        ...prev,
        currentQuestionIndex: 0,
        dismissedUnvisited: true,
        visited: newVisited,
        // Jumping back to Q1 must not grant fresh per-question time.
        timeRemaining: navigateTimeRemaining('neutral', timerMode, timeLimit, prev.timeRemaining),
      };
    });
  }, [timerMode, timeLimit]);

  const computed: QuizComputed = useMemo(() => {
    const currentQuestion = state.questions[state.currentQuestionIndex] || null;
    const progress =
      state.questions.length > 0
        ? ((state.currentQuestionIndex + 1) / state.questions.length) * 100
        : 0;
    const isFirstQuestion = state.currentQuestionIndex === 0;
    const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;
    const hasAnsweredCurrent = currentQuestion ? !!state.answers[currentQuestion.id] : false;
    const answeredCount = Object.keys(state.answers).length;

    const loadedCount = state.questions.length;
    const availableCount = originalTotal > loadedCount ? originalTotal - loadedCount : 0;

    return {
      currentQuestion,
      progress,
      isFirstQuestion,
      isLastQuestion,
      hasAnsweredCurrent,
      totalQuestions: loadedCount,
      answeredCount,
      availableCount,
    };
  }, [state.questions, state.currentQuestionIndex, state.answers, originalTotal]);

  return {
    ...state,
    ...computed,
    selectAnswer,
    goToPrevious,
    goToNext,
    submitQuiz,
    pauseQuiz,
    resumeQuiz,
    addMoreQuestions,
    handleSkip,
    jumpToQuestion,
    dismissUnvisited,
    startFromShare: startFromShareRef.current || null,
    showResumePrompt,
    pendingResumeState,
    handleResumeSession,
    handleStartFresh,
  };
}
