/**
 * ============================================================================
 * useQuiz Hook
 * ============================================================================
 * Core quiz state management hook
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  Question,
  QuizSession,
  QuizState,
  QuizComputed,
  UseQuizReturn
} from '@/types/quiz';
import { STORAGE_KEYS, getItem, setItem } from '@/lib/storage';
import { getSubjectBySlug, getPublicQuestions } from '@/lib/quiz-api';
import type { QuizQuestion, QuizChapter } from '@/lib/quiz-api';

/** Generate UUID for session */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
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
  questions.forEach(q => {
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

/**
 * Fix 3: loadQuestions now returns both questions AND total in a single API call.
 * No separate countAvailableQuestions call needed.
 */
async function loadQuestions(
  subject: string,
  chapter: string,
  level: string
): Promise<{ questions: Question[]; total: number }> {
  try {
    const result = await getPublicQuestions({
      subject: subject !== 'all' ? subject : undefined,
      chapter: chapter !== 'all' ? chapter : undefined,
      level: level !== 'all' ? level : undefined,
      limit: 10
    });

    return {
      questions: result.data.map(convertQuizQuestion),
      total: result.total,
    };
  } catch (error) {
    console.error('Failed to load questions from API:', error);
    return { questions: [], total: 0 };
  }
}

async function loadAdditionalQuestions(
  subject: string,
  chapter: string,
  level: string,
  excludeIds: string[],
  count: number
): Promise<Question[]> {
  try {
    // We fetch a bit more to handle exclusions if the backend doesn't support exclusion yet
    // For now, simple fetch and filter is okay as long as the initial set is filtered by level/subject on server
    const result = await getPublicQuestions({
      subject: subject !== 'all' ? subject : undefined,
      chapter: chapter !== 'all' ? chapter : undefined,
      level: level !== 'all' ? level : undefined,
      limit: count + excludeIds.length + 5 // Buffer for exclusions
    });

    return result.data
      .map(convertQuizQuestion)
      .filter(q => !excludeIds.includes(q.id))
      .slice(0, count);
  } catch (error) {
    console.error('Failed to load additional questions from API:', error);
    return [];
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

/**
 * Fix 2: Optional subjectData prop. If provided, useQuiz skips the internal
 * getSubjectBySlug call. If subject='all', both IDs are set to 'all' directly.
 */
export interface SubjectDataProp {
  id: string;
  name: string;
  chapters?: QuizChapter[];
}

export function useQuiz(
  subject: string,
  chapter: string,
  level: string,
  timeLimit?: number, // in seconds, undefined = no limit
  timerMode: 'total' | 'per-question' = 'per-question', // 'total' = whole quiz, 'per-question' = per question
  subjectData?: SubjectDataProp // Fix 2: optional pre-fetched subject data
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
  });

  const [originalTotal, setOriginalTotal] = useState(0);

  // Load questions on mount
  useEffect(() => {
    const load = async () => {
      // Fix 3: loadQuestions now returns total — no second API call needed
      const { questions, total } = await loadQuestions(subject, chapter, level);
      setOriginalTotal(total);

      if (questions.length === 0) {
        setState(prev => ({ ...prev, status: 'completed' }));
        return;
      }

      // Fix 2: Use provided subjectData if available, otherwise fetch it.
      // For subject='all', skip API call entirely.
      let resolvedSubjectId = 'all';
      let resolvedSubjectName = subject;
      let resolvedChapterId = 'all';

      if (subject !== 'all') {
        if (subjectData) {
          // Use prop — no API call needed
          resolvedSubjectId = subjectData.id;
          resolvedSubjectName = subjectData.name;
          if (chapter !== 'all') {
            const chapterObj = subjectData.chapters?.find(c => c.slug === chapter);
            resolvedChapterId = chapterObj?.id || 'all';
          }
        } else {
          // Fallback: fetch if not provided (e.g. direct URL navigation)
          try {
            const fetchedSubject = await getSubjectBySlug(subject);
            resolvedSubjectId = fetchedSubject.id;
            resolvedSubjectName = fetchedSubject.name;
            if (chapter !== 'all') {
              const chapterObj = fetchedSubject.chapters?.find(c => c.slug === chapter);
              resolvedChapterId = chapterObj?.id || 'all';
            }
          } catch (error) {
            console.error('Failed to fetch subject data:', error);
          }
        }
      }

      sessionRef.current = {
        id: generateUUID(),
        subject,
        subjectId: resolvedSubjectId,
        subjectName: resolvedSubjectName,
        chapter,
        chapterId: resolvedChapterId,
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

      setState({
        questions,
        currentQuestionIndex: 0,
        answers: {},
        score: 0,
        timeRemaining: timeLimit || 0,
        status: 'playing',
        startTime: Date.now(),
        sessionId: sid,
      });

      saveCurrentSession(sessionRef.current);
    };

    load();
  }, [subject, chapter, level, timeLimit, subjectData]);

  // Timer effect
  useEffect(() => {
    if (state.status !== 'playing' || !timeLimit) return;

    const timer = setInterval(() => {
      setState(prev => {
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
                currentQuestionIndex: prev.currentQuestionIndex + 1
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
    setState(prev => {
      const currentQuestion = prev.questions[prev.currentQuestionIndex];
      if (!currentQuestion) return prev;

      const newAnswers = { ...prev.answers, [currentQuestion.id]: option };
      const newScore = calculateScore(prev.questions, newAnswers);

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
      };
    });
  }, []);

  // Go to previous question
  const goToPrevious = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
      // Reset timer for per-question mode
      timeRemaining: timerMode === 'per-question' && timeLimit ? timeLimit : prev.timeRemaining,
    }));
  }, [timerMode, timeLimit]);

  // Go to next question
  const goToNext = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.questions.length - 1, prev.currentQuestionIndex + 1),
      // Reset timer for per-question mode
      timeRemaining: timerMode === 'per-question' && timeLimit ? timeLimit : prev.timeRemaining,
    }));
  }, [timerMode, timeLimit]);

  // Submit quiz
  const submitQuiz = useCallback(() => {
    setState(prev => {
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
    if (state.status === 'completed' && sessionRef.current && sessionRef.current.status !== 'completed') {
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
  const extendQuiz = useCallback(async (additionalCount: number) => {
    const currentQuestionIds = state.questions.map(q => q.id);
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
    setState(prev => {
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
  }, [subject, chapter, level, state.questions]);

  // Pause quiz
  const pauseQuiz = useCallback(() => {
    setState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  // Resume quiz
  const resumeQuiz = useCallback(() => {
    setState(prev => ({ ...prev, status: 'playing' }));
  }, []);

  // Computed values
  const computed: QuizComputed = useMemo(() => {
    const currentQuestion = state.questions[state.currentQuestionIndex] || null;
    const progress = state.questions.length > 0
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
  };
}
