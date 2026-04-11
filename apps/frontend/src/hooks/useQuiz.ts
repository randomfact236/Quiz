/**
 * ============================================================================
 * useQuiz Hook
 * ============================================================================
 * Core quiz state management hook
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Question, QuizSession, QuizState, QuizComputed, UseQuizReturn } from '@/types/quiz';
import { STORAGE_KEYS, getItem, setItem } from '@/lib/storage';
import {
  saveQuizResume,
  loadQuizResume,
  clearQuizResume,
  isQuizResumeMatch,
  QuizResumeState,
} from '@/lib/quiz-resume';
import {
  getQuestionsBySubject,
  getQuestionsByChapter,
  getRandomQuestions,
  getMixedQuestions,
  getSubjectBySlug,
} from '@/lib/quiz-api';
import type { QuizQuestion } from '@/lib/quiz-api';

/** Generate UUID for session */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Convert QuizQuestion from API to Question type */
function convertQuizQuestion(q: QuizQuestion): Question {
  const options = q.options || [];
  return {
    id: q.id,
    question: q.question,
    optionA: options[0] || '',
    optionB: options[1] || '',
    optionC: options[2] || '',
    optionD: options[3] || '',
    correctAnswer: q.correctAnswer,
    correctLetter: q.correctLetter || null,
    level: q.level,
    chapter: q.chapterId,
    status: q.status || 'published',
  };
}

/** Calculate score based on answers */
function calculateScore(questions: Question[], answers: Record<string, string>): number {
  let score = 0;
  questions.forEach((q) => {
    const isOpenEnded = q.level === 'extreme';

    if (isOpenEnded) {
      const userAnswer = answers[q.id]?.toLowerCase().trim() || '';
      const correctAnswer = q.correctAnswer?.toLowerCase().trim() || '';
      if (userAnswer === correctAnswer) {
        score++;
      }
    } else {
      if (answers[q.id] === q.correctLetter) {
        score++;
      }
    }
  });
  return score;
}

/** Load questions from API based on subject, chapter, and level */
async function loadQuestions(
  subject: string,
  chapter: string,
  level: string
): Promise<{ all: Question[]; total: number }> {
  try {
    let allQuestions: QuizQuestion[] = [];

    if (subject === 'all') {
      if (level === 'all') {
        const result = await getMixedQuestions();
        allQuestions = result.data;
      } else {
        const result = await getRandomQuestions(level);
        allQuestions = result.data;
      }
    } else {
      const subjectQuestionsResult = await getQuestionsBySubject(subject, { status: 'published' });
      const subjectQuestions = subjectQuestionsResult.data;

      if (chapter !== 'all') {
        const subjectData = await getSubjectBySlug(subject);
        const chapterObj = subjectData.chapters?.find((c) => c.name === chapter);
        if (chapterObj) {
          const result = await getQuestionsByChapter(chapterObj.id);
          allQuestions = result.data || [];
        }
      } else {
        allQuestions = subjectQuestions;
      }

      if (level !== 'all') {
        allQuestions = allQuestions.filter((q) => q.level === level);
      }
    }

    const convertedQuestions = allQuestions.map(convertQuizQuestion);
    return { all: convertedQuestions, total: convertedQuestions.length };
  } catch (error) {
    console.error('Failed to load questions from API:', error);
    return { all: [], total: 0 };
  }
}

/** Save quiz session to history */
function saveToHistory(session: QuizSession): void {
  const history = getItem<QuizSession[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
  history.push(session);
  setItem(STORAGE_KEYS.QUIZ_HISTORY, history);
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
    const subject = await getSubjectBySlug(slug);
    return subject.name;
  } catch {
    return slug;
  }
}

export function useQuiz(
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
): UseQuizReturn {
  const sessionRef = useRef<QuizSession | null>(null);

  const startFromShareRef = useRef(startFromShare);
  const initialTotalRef = useRef(initialTotal || 10);

  const mountDecisionRef = useRef<{
    resumeSession: QuizResumeState | null;
    startIndex: number;
    sessionSize: number;
    isShared: boolean;
  } | null>(null);

  if (mountDecisionRef.current === null) {
    const isShared = isSharedLink ?? false;
    let resumeSession: QuizResumeState | null = null;

    if (!isShared) {
      const saved = loadQuizResume();
      const currentMode = type ? `${mode}_${type}` : (mode ?? 'normal');
      if (saved && isQuizResumeMatch(saved, subject, chapter, level, currentMode)) {
        resumeSession = saved;
      }
    }

    mountDecisionRef.current = {
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

  const [showResumePrompt, setShowResumePrompt] = useState(
    () => mountDecisionRef.current?.resumeSession !== null
  );
  const [pendingResumeState] = useState(() => mountDecisionRef.current?.resumeSession ?? null);

  const [state, setState] = useState<QuizState>({
    questions: [],
    availableQuestions: [],
    sessionSize: mountDecisionRef.current.sessionSize,
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
    if (mountDecisionRef.current?.resumeSession) return;

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

      const decision = mountDecisionRef.current!;
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
    };

    load();
    return () => controller.abort();
  }, [subject, chapter, level, resetKey]);

  useEffect(() => {
    setState((prev) => ({ ...prev, timeRemaining: timeLimit || 0 }));
  }, [timeLimit]);

  useEffect(() => {
    if (state.status !== 'playing' || !timeLimit) return;

    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.status === 'paused') return prev;

        const newTimeRemaining = prev.timeRemaining - 1;
        if (newTimeRemaining <= 0) {
          if (timerMode === 'per-question') {
            const isLast = prev.currentQuestionIndex >= prev.questions.length - 1;
            if (isLast) {
              return { ...prev, timeRemaining: 0, status: 'completed' };
            } else {
              return {
                ...prev,
                timeRemaining: timeLimit,
                currentQuestionIndex: prev.currentQuestionIndex + 1,
              };
            }
          } else {
            return { ...prev, timeRemaining: 0, status: 'completed' };
          }
        }
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.status, timeLimit, timerMode]);

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
        timeRemaining: timerMode === 'per-question' && timeLimit ? timeLimit : prev.timeRemaining,
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
        timeRemaining: timerMode === 'per-question' && timeLimit ? timeLimit : prev.timeRemaining,
      };
    });
  }, [timerMode, timeLimit]);

  const submitQuiz = useCallback(() => {
    setState((prev) => {
      const timeTaken = Math.floor((Date.now() - prev.startTime) / 1000);

      if (sessionRef.current) {
        sessionRef.current.status = 'completed';
        sessionRef.current.completedAt = new Date().toISOString();
        sessionRef.current.timeTaken = timeTaken;
        sessionRef.current.score = prev.score;
        sessionRef.current.answers = prev.answers;

        saveToHistory(sessionRef.current);
        clearCurrentSession();
        clearQuizResume();
      }

      return {
        ...prev,
        status: 'completed',
      };
    });
  }, []);

  useEffect(() => {
    if (
      state.status === 'completed' &&
      sessionRef.current &&
      sessionRef.current.status !== 'completed'
    ) {
      const timeTaken = Math.floor((Date.now() - state.startTime) / 1000);

      sessionRef.current.status = 'completed';
      sessionRef.current.completedAt = new Date().toISOString();
      sessionRef.current.timeTaken = timeTaken;
      sessionRef.current.score = state.score;
      sessionRef.current.answers = state.answers;

      saveToHistory(sessionRef.current);
      clearCurrentSession();
      clearQuizResume();
    }
  }, [state.status, state.startTime, state.score, state.answers]);

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
      availableQuestions: state.availableQuestions,
      savedAt: Date.now(),
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

    setShowResumePrompt(false);
    saveCurrentSession(sessionRef.current);
  }, [pendingResumeState, timeLimit]);

  const handleStartFresh = useCallback(() => {
    clearQuizResume();
    setShowResumePrompt(false);
    mountDecisionRef.current = {
      resumeSession: null,
      startIndex: 0,
      sessionSize: 10,
      isShared: false,
    };
    setResetKey((k) => k + 1);
  }, []);

  const addMoreQuestions = useCallback((count: number) => {
    setState((prev) => {
      const newSize = Math.min(prev.sessionSize + count, prev.availableQuestions.length);
      const newQuestions = prev.availableQuestions.slice(0, newSize);

      if (sessionRef.current) {
        sessionRef.current.maxScore = newSize;
        sessionRef.current.questions = newQuestions;
      }

      return {
        ...prev,
        questions: newQuestions,
        sessionSize: newSize,
      };
    });
  }, []);

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
        timeRemaining: timerMode === 'per-question' && timeLimit ? timeLimit : prev.timeRemaining,
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
          timeRemaining: timerMode === 'per-question' && timeLimit ? timeLimit : prev.timeRemaining,
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
        timeRemaining: timerMode === 'per-question' && timeLimit ? timeLimit : prev.timeRemaining,
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
