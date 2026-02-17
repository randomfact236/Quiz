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

/** Generate UUID for session */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** Calculate score based on answers */
function calculateScore(questions: Question[], answers: Record<number, string>): number {
  let score = 0;
  questions.forEach(q => {
    if (answers[q.id] === q.correctAnswer) {
      score++;
    }
  });
  return score;
}

/** Load questions from localStorage (max 10) */
function loadQuestions(subject: string, chapter: string, level: string): Question[] {
  const allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
  const subjectQuestions = allQuestions[subject] || [];
  
  const filtered = subjectQuestions.filter(q => {
    // Filter by chapter
    if (q.chapter !== chapter) return false;
    // Filter by level
    if (q.level !== level) return false;
    // Filter by status (only published)
    if (q.status === 'trash' || q.status === 'draft') return false;
    return true;
  });
  
  // Limit to 10 questions
  return filtered.slice(0, 10);
}

/** Load additional questions excluding already shown ones */
function loadAdditionalQuestions(
  subject: string, 
  chapter: string, 
  level: string, 
  excludeIds: number[],
  count: number
): Question[] {
  const allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
  const subjectQuestions = allQuestions[subject] || [];
  
  const filtered = subjectQuestions.filter(q => {
    // Filter by chapter
    if (q.chapter !== chapter) return false;
    // Filter by level
    if (q.level !== level) return false;
    // Filter by status (only published)
    if (q.status === 'trash' || q.status === 'draft') return false;
    // Exclude already shown questions
    if (excludeIds.includes(q.id)) return false;
    return true;
  });
  
  // Limit to requested count
  return filtered.slice(0, count);
}

/** Count available questions excluding already shown ones */
function countAvailableQuestions(
  subject: string, 
  chapter: string, 
  level: string, 
  excludeIds: number[]
): number {
  const allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
  const subjectQuestions = allQuestions[subject] || [];
  
  const filtered = subjectQuestions.filter(q => {
    if (q.chapter !== chapter) return false;
    if (q.level !== level) return false;
    if (q.status === 'trash' || q.status === 'draft') return false;
    if (excludeIds.includes(q.id)) return false;
    return true;
  });
  
  return filtered.length;
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

interface SubjectInfo {
  slug: string;
  name: string;
}

/** Get subject name from slug */
function getSubjectName(slug: string): string {
  const subjects = getItem<SubjectInfo[]>(STORAGE_KEYS.SUBJECTS, []);
  const subject = subjects.find((s) => s.slug === slug);
  return subject?.name || slug;
}

export function useQuiz(
  subject: string, 
  chapter: string, 
  level: string,
  timeLimit?: number, // in seconds, undefined = no limit
  timerMode: 'total' | 'per-question' = 'per-question' // 'total' = whole quiz, 'per-question' = per question
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
  });

  // Load questions on mount
  useEffect(() => {
    const questions = loadQuestions(subject, chapter, level);
    
    if (questions.length === 0) {
      setState(prev => ({ ...prev, status: 'completed' }));
      return;
    }

    // Create new session
    sessionRef.current = {
      id: generateUUID(),
      subject,
      subjectName: getSubjectName(subject),
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

    setState({
      questions,
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      timeRemaining: timeLimit || 0,
      status: 'playing',
      startTime: Date.now(),
    });

    // Save session for potential resume
    saveCurrentSession(sessionRef.current);
  }, [subject, chapter, level, timeLimit]);

  // Timer effect
  useEffect(() => {
    if (state.status !== 'playing' || !timeLimit) return;

    const timer = setInterval(() => {
      setState(prev => {
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

  // Extend quiz with additional questions
  const extendQuiz = useCallback((additionalCount: number) => {
    setState(prev => {
      // Get IDs of already shown questions
      const shownIds = prev.questions.map(q => q.id);
      
      // Load additional questions
      const additionalQuestions = loadAdditionalQuestions(
        subject, 
        chapter, 
        level, 
        shownIds, 
        additionalCount
      );
      
      if (additionalQuestions.length === 0) {
        // No more questions available
        return prev;
      }
      
      // Combine questions
      const newQuestions = [...prev.questions, ...additionalQuestions];
      
      // Update session
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
  }, [subject, chapter, level]);

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
    
    // Count available questions for extending
    const shownIds = state.questions.map(q => q.id);
    const availableQuestions = countAvailableQuestions(subject, chapter, level, shownIds);

    return {
      currentQuestion,
      progress,
      isFirstQuestion,
      isLastQuestion,
      hasAnsweredCurrent,
      totalQuestions: state.questions.length,
      answeredCount,
      availableQuestions,
    };
  }, [state.questions, state.currentQuestionIndex, state.answers, subject, chapter, level]);

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
