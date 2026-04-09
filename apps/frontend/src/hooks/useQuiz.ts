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
      // Open-ended: compare normalized text
      const userAnswer = answers[q.id]?.toLowerCase().trim() || '';
      const correctAnswer = q.correctAnswer?.toLowerCase().trim() || '';
      if (userAnswer === correctAnswer) {
        score++;
      }
    } else {
      // MCQ: compare letters
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
  timeLimit?: number, // in seconds, undefined = no limit
  timerMode: 'total' | 'per-question' = 'per-question', // 'total' = whole quiz, 'per-question' = per question
  startFromShare?: number | null // 1-based question number from URL, null = fresh start
): UseQuizReturn {
  // Session ref (persists across re-renders)
  const sessionRef = useRef<QuizSession | null>(null);

  // State
  const [state, setState] = useState<QuizState>({
    questions: [],
    availableQuestions: [],
    sessionSize: 10,
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

  // Load questions on mount
  useEffect(() => {
    const load = async () => {
      const { all, total } = await loadQuestions(subject, chapter, level);
      setOriginalTotal(total);

      if (all.length === 0) {
        setState((prev) => ({ ...prev, status: 'completed' }));
        return;
      }

      const initialQuestions = all.slice(0, 10);

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

      const sid = sessionRef.current.id;

      // Clamp startFromShare to valid range
      let initialIndex = 0;
      if (startFromShare && startFromShare > 1) {
        initialIndex = Math.min(startFromShare - 1, initialQuestions.length - 1);
      }

      const initialVisited = new Set<string>();
      const initQuestion = initialQuestions[initialIndex];
      if (initQuestion) {
        initialVisited.add(initQuestion.id);
      }

      setState((prev) => ({
        ...prev,
        availableQuestions: all,
        questions: initialQuestions,
        sessionSize: 10,
        currentQuestionIndex: initialIndex,
        answers: {},
        score: 0,
        timeRemaining: timeLimit || 0,
        status: 'playing',
        startTime: Date.now(),
        sessionId: sid,
        visited: initialVisited,
        manuallySkipped: new Set<string>(),
        dismissedUnvisited: false,
      }));

      saveCurrentSession(sessionRef.current);
    };

    load();
  }, [subject, chapter, level, timeLimit, startFromShare]);

  // Timer effect
  useEffect(() => {
    if (state.status !== 'playing' || !timeLimit) return;

    const timer = setInterval(() => {
      setState((prev) => {
        // Don't count down if paused
        if (prev.status === 'paused') return prev;

        const newTimeRemaining = prev.timeRemaining - 1;
        if (newTimeRemaining <= 0) {
          // Time's up
          if (timerMode === 'per-question') {
            // Auto-move to next question or submit if last
            const isLast = prev.currentQuestionIndex >= prev.questions.length - 1;
            if (isLast) {
              return { ...prev, timeRemaining: 0, status: 'completed' };
            } else {
              return {
                ...prev,
                timeRemaining: timeLimit, // Reset timer for next question
                currentQuestionIndex: prev.currentQuestionIndex + 1,
              };
            }
          } else {
            // Total timer - submit quiz
            return { ...prev, timeRemaining: 0, status: 'completed' };
          }
        }
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.status, timeLimit, timerMode]);

  // Select answer
  const selectAnswer = useCallback((option: string) => {
    setState((prev) => {
      const currentQuestion = prev.questions[prev.currentQuestionIndex];
      if (!currentQuestion) return prev;

      const newAnswers = { ...prev.answers, [currentQuestion.id]: option };
      const newScore = calculateScore(prev.questions, newAnswers);

      // Track visited and remove from manuallySkipped
      const newVisited = new Set(prev.visited).add(currentQuestion.id);
      const newSkipped = new Set(prev.manuallySkipped);
      newSkipped.delete(currentQuestion.id);

      // Update session
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

  // Go to previous question
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

  // Go to next question
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

  // Submit quiz
  const submitQuiz = useCallback(() => {
    setState((prev) => {
      const timeTaken = Math.floor((Date.now() - prev.startTime) / 1000);

      if (sessionRef.current) {
        sessionRef.current.status = 'completed';
        sessionRef.current.completedAt = new Date().toISOString();
        sessionRef.current.timeTaken = timeTaken;
        sessionRef.current.score = prev.score;
        sessionRef.current.answers = prev.answers;

        // Save to history and clear current
        saveToHistory(sessionRef.current);
        clearCurrentSession();
      }

      return {
        ...prev,
        status: 'completed',
      };
    });
  }, []);

  // Auto-save session when timer expires (status becomes 'completed')
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

      // Save to history and clear current
      saveToHistory(sessionRef.current);
      clearCurrentSession();
    }
  }, [state.status, state.startTime, state.score, state.answers]);

  // Add more questions to session
  const addMoreQuestions = useCallback(() => {
    setState((prev) => {
      const newSize = Math.min(prev.sessionSize + 10, prev.availableQuestions.length);
      return {
        ...prev,
        questions: prev.availableQuestions.slice(0, newSize),
        sessionSize: newSize,
      };
    });
  }, []);

  // Pause quiz
  const pauseQuiz = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'paused' }));
  }, []);

  // Resume quiz
  const resumeQuiz = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'playing' }));
  }, []);

  // Handle skip - track as manually skipped, move to next
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

  // Jump to a specific question index
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

  // Dismiss unvisited banner - jump to Q1, never show again
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

  // Computed values
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
    startFromShare: startFromShare || null,
  };
}
