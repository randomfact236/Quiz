/**
 * ============================================================================
 * Riddle Types
 * ============================================================================
 * Shared types for the riddle module - no-login architecture
 * ============================================================================
 */

import { type ContentStatus } from '@/app/admin/types';

/** Riddle Type (aligned with admin Riddle) */
export interface Riddle {
  id: number;
  question: string;
  options: string[];
  correctOption: string; // 'A', 'B', 'C', etc.
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  chapter: string;
  status: ContentStatus;
  /** Optional explanation shown after answering */
  explanation?: string;
}

/** Riddle Session State - Phase 0: Session Persistence */
export interface RiddleSession {
  id: string; // UUID for the session
  mode: 'timer' | 'practice';
  chapter: string | 'all'; // 'all' for mixed chapters
  difficulty: 'all' | 'easy' | 'medium' | 'hard' | 'expert';
  riddles: Riddle[];
  answers: Record<number, string>; // riddleId -> selectedOption (A/B/C/...)
  score: number;
  startedAt: string; // ISO timestamp
  lastSavedAt: string; // ISO timestamp - Phase 0: Auto-save timestamp
  completedAt?: string; // ISO timestamp
  timeTaken: number; // in seconds (for practice mode: time spent)
  timeRemaining?: number; // in seconds (for timer mode: time left)
  status: 'in-progress' | 'completed' | 'abandoned';
  hintsUsed: number; // Phase 2: hints feature
  skippedRiddles: number[]; // Phase 2: skip feature
}

/** Riddle Configuration */
export interface RiddleConfig {
  chapter: string | 'all';
  difficulty: 'all' | 'easy' | 'medium' | 'hard' | 'expert';
  mode: 'timer' | 'practice';
  timeLimit?: number; // in seconds, undefined = no limit (practice mode)
  riddleCount: number; // Number of riddles to include
}

/** Riddle State for useRiddle hook */
export interface RiddleState {
  riddles: Riddle[];
  currentRiddleIndex: number;
  answers: Record<number, string>;
  score: number;
  timeRemaining: number; // For timer mode
  status: 'loading' | 'playing' | 'paused' | 'completed';
  startTime: number;
  hintsUsed: number;
  skippedRiddles: number[];
}

/** Riddle Actions */
export interface RiddleActions {
  selectAnswer: (option: string) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  submitRiddle: () => void;
  pauseRiddle: () => void;
  resumeRiddle: () => void;
  useHint: () => void; // Phase 2: hint system
  skipRiddle: () => void; // Phase 2: skip feature
}

/** Riddle Computed Values */
export interface RiddleComputed {
  currentRiddle: Riddle | null;
  progress: number; // 0-100
  isFirstRiddle: boolean;
  isLastRiddle: boolean;
  hasAnsweredCurrent: boolean;
  totalRiddles: number;
  answeredCount: number;
  canUseHint: boolean;
  remainingSkips: number;
}

/** Combined Riddle Hook Return */
export interface UseRiddleReturn extends RiddleState, RiddleActions, RiddleComputed {}

/** Riddle Result Summary */
export interface RiddleResult {
  session: RiddleSession;
  correctCount: number;
  incorrectCount: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  byDifficulty: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
    expert: { correct: number; total: number };
  };
  timeBonus?: number; // Phase 1: bonus for timer mode
}

/** Riddle History Entry - Phase 0: Saved in localStorage */
export interface RiddleHistoryEntry {
  sessionId: string;
  mode: 'timer' | 'practice';
  chapter: string | 'all';
  difficulty: string;
  totalRiddles: number;
  correctCount: number;
  percentage: number;
  grade: string;
  timeTaken: number;
  completedAt: string;
}

/** Riddle Streak - Phase 2: Daily streak tracking */
export interface RiddleStreak {
  current: number;
  longest: number;
  lastPlayedDate: string; // YYYY-MM-DD format
}

/** Riddle Favorite - Phase 2: Bookmarked riddles */
export interface RiddleFavorite {
  riddleId: number;
  addedAt: string;
  notes?: string;
}

/** Riddle Achievement - Phase 2: Gamification */
export interface RiddleAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: {
    type: 'riddle_count' | 'perfect_score' | 'streak' | 'chapter_complete' | 'speed_solve' | 'hintless' | 'difficulty_master';
    threshold: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  };
  unlockedAt?: string;
}

/** Riddle User Settings - Phase 2: Preferences */
export interface RiddleSettings {
  autoRevealAnswer: boolean; // Auto-show answer after selection
  soundEffects: boolean;
  keyboardShortcuts: boolean;
  defaultMode: 'timer' | 'practice';
  defaultDifficulty: 'all' | 'easy' | 'medium' | 'hard' | 'expert';
  riddleCountPreference: number;
}

/** Chapter Progress for Riddles */
export interface RiddleChapterProgress {
  chapter: string;
  attempts: number;
  bestScore: number;
  lastScore: number;
  averageScore: number;
  completedRiddles: number[]; // IDs of riddles successfully solved
  lastAttemptAt: string;
}

/** Difficulty Statistics */
export interface RiddleDifficultyStats {
  easy: { attempted: number; correct: number };
  medium: { attempted: number; correct: number };
  hard: { attempted: number; correct: number };
  expert: { attempted: number; correct: number };
}
