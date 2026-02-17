/**
 * ============================================================================
 * Quiz Types
 * ============================================================================
 * Shared types for the quiz module
 * ============================================================================
 */

import { type ContentStatus } from '@/app/admin/types';

/** Question Type (aligned with admin Question) */
export interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string; // 'A', 'B', 'C', or 'D'
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
  status?: ContentStatus;
  /** Optional explanation shown after answering (future) */
  explanation?: string;
}

/** Quiz Session State */
export interface QuizSession {
  id: string; // UUID for the session
  subject: string;
  subjectName: string;
  chapter: string;
  level: string;
  questions: Question[];
  answers: Record<number, string>; // questionId -> selectedOption (A/B/C/D)
  score: number;
  maxScore: number;
  startedAt: string;
  completedAt?: string;
  timeTaken: number; // in seconds
  status: 'in-progress' | 'completed' | 'abandoned';
}

/** Quiz Configuration */
export interface QuizConfig {
  subject: string;
  chapter: string;
  level: string;
  timeLimit?: number; // in seconds, undefined = no limit
  showFeedbackImmediately: boolean;
  allowNavigation: boolean; // Allow going back to previous questions
}

/** Quiz State for useQuiz hook */
export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, string>;
  score: number;
  timeRemaining: number;
  status: 'loading' | 'playing' | 'paused' | 'completed';
  startTime: number;
}

/** Quiz Actions */
export interface QuizActions {
  selectAnswer: (option: string) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  submitQuiz: () => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  extendQuiz: (additionalCount: number) => void;
}

/** Quiz Computed Values */
export interface QuizComputed {
  currentQuestion: Question | null;
  progress: number; // 0-100
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  hasAnsweredCurrent: boolean;
  totalQuestions: number;
  answeredCount: number;
  availableQuestions: number; // Questions available for extending
}

/** Combined Quiz Hook Return */
export interface UseQuizReturn extends QuizState, QuizActions, QuizComputed {}

/** Quiz Result Summary */
export interface QuizResult {
  session: QuizSession;
  correctCount: number;
  incorrectCount: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  byDifficulty: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
    expert: { correct: number; total: number };
    extreme: { correct: number; total: number };
  };
}

/** Chapter Progress */
export interface ChapterProgress {
  subject: string;
  chapter: string;
  attempts: number;
  bestScore: number;
  lastScore: number;
  averageScore: number;
  completed: boolean;
  lastAttemptAt: string;
}

/** Subject Progress */
export interface SubjectProgress {
  subject: string;
  totalChapters: number;
  completedChapters: number;
  totalAttempts: number;
  bestScore: number;
  overallAccuracy: number;
}

/** Achievement */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: {
    type: 'quiz_count' | 'perfect_score' | 'streak' | 'chapter_complete' | 'subject_master' | 'speed_run' | 'subject_explore' | 'retry' | 'accuracy';
    threshold: number;
  };
  unlockedAt?: string | undefined;
}
