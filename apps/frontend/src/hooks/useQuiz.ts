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
async function loadQuestions(subject: string, chapter: string, level: string): Promise<Question[]> {
  try {
    let questions: QuizQuestion[] = [];

    if (subject === 'all') {
      if (level === 'all') {
        questions = await getMixedQuestions(50);
      } else {
        questions = await getRandomQuestions(level, 20);
      }
    } else {
      const subjectQuestionsResult = await getQuestionsBySubject(subject, { status: 'published' });
      const subjectQuestions = subjectQuestionsResult.data;

      if (chapter !== 'all') {
        const subjectData = await getSubjectBySlug(subject);
        const chapterObj = subjectData.chapters?.find((c) => c.name === chapter);
        if (chapterObj) {
          const chapterQuestions = await getQuestionsByChapter(chapterObj.id);
          questions = chapterQuestions.data || [];
        }
      } else {
        questions = subjectQuestions;
      }

      if (level !== 'all') {
        questions = questions.filter((q) => q.level === level);
      }
    }

    const convertedQuestions = questions.map(convertQuizQuestion).slice(0, 10);
    return convertedQuestions;
  } catch (error) {
    console.error('Failed to load questions from API:', error);
    return [];
  }
}

/** Load additional questions excluding already shown ones */
async function loadAdditionalQuestions(
  subject: string,
  chapter: string,
  level: string,
  excludeIds: string[],
  count: number
): Promise<Question[]> {
  try {
    let questions: QuizQuestion[] = [];

    if (subject === 'all') {
      if (level === 'all') {
        questions = await getMixedQuestions(count + excludeIds.length);
      } else {
        questions = await getRandomQuestions(level, count + excludeIds.length);
      }
    } else {
      const subjectQuestionsResult = await getQuestionsBySubject(subject, { status: 'published' });
      const subjectQuestions = subjectQuestionsResult.data;

      if (chapter !== 'all') {
        const subjectData = await getSubjectBySlug(subject);
        const chapterObj = subjectData.chapters?.find((c) => c.name === chapter);
        if (chapterObj) {
          const chapterQuestions = await getQuestionsByChapter(chapterObj.id);
          questions = chapterQuestions.data || [];
        }
      } else {
        questions = subjectQuestions;
      }

      if (level !== 'all') {
        questions = questions.filter((q) => q.level === level);
      }
    }

    const convertedQuestions = questions
      .map(convertQuizQuestion)
      .filter((q) => !excludeIds.includes(q.id))
      .slice(0, count);

    return convertedQuestions;
  } catch (error) {
    console.error('Failed to load additional questions from API:', error);
    return [];
  }
}

/** Count available questions excluding already shown ones */
async function countAvailableQuestions(
  subject: string,
  chapter: string,
  level: string,
  excludeIds: string[]
): Promise<number> {
  try {
    let questions: QuizQuestion[] = [];

    if (subject === 'all') {
      if (level === 'all') {
        questions = await getMixedQuestions(100);
      } else {
        questions = await getRandomQuestions(level, 100);
      }
    } else {
      const subjectQuestionsResult = await getQuestionsBySubject(subject, { status: 'published' });
      const subjectQuestions = subjectQuestionsResult.data;

      if (chapter !== 'all') {
        const subjectData = await getSubjectBySlug(subject);
        const chapterObj = subjectData.chapters?.find((c) => c.name === chapter);
        if (chapterObj) {
          const chapterQuestions = await getQuestionsByChapter(chapterObj.id);
          questions = chapterQuestions.data || [];
        }
      } else {
        questions = subjectQuestions;
      }

      if (level !== 'all') {
        questions = questions.filter((q) => q.level === level);
      }
    }

    const convertedQuestions = questions.map(convertQuizQuestion);
    return convertedQuestions.filter((q) => !excludeIds.includes(q.id)).length;
  } catch (error) {
    console.error('Failed to count available questions from API:', error);
    return 0;
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
      const questions = await loadQuestions(subject, chapter, level);
      const availableCount = await countAvailableQuestions(subject, chapter, level, []);
      setOriginalTotal(availableCount);

      if (questions.length === 0) {
        setState((prev) => ({ ...prev, status: 'completed' }));
        return;
      }

      sessionRef.current = {
        id: generateUUID(),
        subject,
        subjectName: await getSubjectName(subject),
        chapter,
        level,
        questions,
        answers: {},
        score: 0,
        maxScore: questions.length,
        startedAt: new Date().toISOString(),
        timeTaken: 0,
        status: 'in-progress',
      };

      const sid = sessionRef.current.id;

      // Clamp startFromShare to valid range
      let initialIndex = 0;
      if (startFromShare && startFromShare > 1) {
        initialIndex = Math.min(startFromShare - 1, questions.length - 1);
      }

      const initialVisited = new Set<string>();
      const initQuestion = questions[initialIndex];
      if (initQuestion) {
        initialVisited.add(initQuestion.id);
      }

      setState({
        questions,
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
      });

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

  // Extend quiz with additional questions
  const extendQuiz = useCallback(
    async (additionalCount: number) => {
      const currentQuestionIds = state.questions.map((q) => q.id);
      const additionalQuestions = await loadAdditionalQuestions(
        subject,
        chapter,
        level,
        currentQuestionIds,
        additionalCount
      );

      if (additionalQuestions.length === 0) {
        return;
      }

      let newQuestions: Question[] = [];
      setState((prev) => {
        newQuestions = [...prev.questions, ...additionalQuestions];

        if (sessionRef.current) {
          sessionRef.current.questions = newQuestions;
          sessionRef.current.maxScore = newQuestions.length;
          saveCurrentSession(sessionRef.current);
        }

        return {
          ...prev,
          questions: newQuestions,
        };
      });
    },
    [subject, chapter, level, state.questions]
  );

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
    const availableQuestions = originalTotal > loadedCount ? originalTotal - loadedCount : 0;

    return {
      currentQuestion,
      progress,
      isFirstQuestion,
      isLastQuestion,
      hasAnsweredCurrent,
      totalQuestions: loadedCount,
      answeredCount,
      availableQuestions,
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
    extendQuiz,
    handleSkip,
    jumpToQuestion,
    dismissUnvisited,
    startFromShare: startFromShare || null,
  };
}
