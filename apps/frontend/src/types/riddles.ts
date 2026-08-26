/**
 * ============================================================================
 * Riddle Types
 * ============================================================================
 * Types matching the backend API entities
 * ============================================================================
 */

// ============================================================================
// Backend Entity Types (from API)
// ============================================================================

/** Riddle Category - Backend Entity (for Riddle MCQ) */
export interface RiddleMcqCategory {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
  subjects?: RiddleMcqSubject[];
  riddles?: ClassicRiddle[];
  createdAt?: string;
  updatedAt?: string;
}

/** Riddle Subject - Backend Entity */
export interface RiddleMcqSubject {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  description?: string;
  categoryId?: string | null;
  category?: { id: string; name: string; emoji: string; slug: string };
  isActive: boolean;
  riddles?: RiddleMcq[];
  createdAt?: string;
  updatedAt?: string;
}

/** Riddle MCQ - Backend Entity (for gameplay) */
export interface RiddleMcq {
  id: string;
  question: string;
  options: string[];
  correctLetter: string | null; // 'A', 'B', 'C', 'D' or null for expert
  correctAnswer: string; // kept for backward compatibility
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  subjectId?: string;
  subject?: RiddleMcqSubject;
  explanation?: string;
  hint?: string;
  answer?: string;
  status?: 'published' | 'draft' | 'trash';
  createdAt?: string;
  updatedAt?: string;
}

/** Classic Riddle - Backend Entity (simple format) */
export interface ClassicRiddle {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  categoryId?: string;
  status: 'published' | 'draft' | 'trash';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Frontend Game Types
// ============================================================================

/** Unified Riddle type for frontend gameplay */
export interface Riddle {
  id: string;
  question: string;
  options: string[] | null;
  correctOption: string; // 'A', 'B', 'C', etc. (derived from correctLetter)
  correctLetter: string | null; // 'A', 'B', 'C', 'D' or null for expert
  correctAnswer?: string; // Text answer for expert level
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'; // For display
  level?: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme'; // For AnswerOptions component
  chapter: string; // chapter name (for display)
  chapterId: string; // chapter ID (for API)
  status: 'published' | 'draft' | 'trash';
  hint?: string;
  explanation?: string;
}

// ============================================================================
// Session & Game Types
// ============================================================================

/** Riddle Session State - Phase 0: Session Persistence */
export interface RiddleSession {
  id: string; // UUID for the session
  mode: 'timer' | 'practice';
  chapterId: string | 'all';
  chapterName: string;
  difficulty: 'all' | 'easy' | 'medium' | 'hard' | 'expert';
  riddles: Riddle[];
  answers: Record<string, string>; // riddleId -> selectedOption (A/B/C/...)
  score: number;
  startedAt: string; // ISO timestamp
  lastSavedAt: string; // ISO timestamp - Phase 0: Auto-save timestamp
  completedAt?: string; // ISO timestamp
  timeTaken: number; // in seconds (for practice mode: time spent)
  timeRemaining?: number; // in seconds (for timer mode: time left)
  status: 'in-progress' | 'completed' | 'abandoned';
  hintsUsed: number;
  skippedRiddles: string[];
}

/** Riddle Configuration */
export interface RiddleConfig {
  chapterId: string | 'all';
  chapterName: string;
  difficulty: 'all' | 'easy' | 'medium' | 'hard' | 'expert';
  mode: 'timer' | 'practice';
  riddleCount: number;
}

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
  timeBonus?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Difficulty level with metadata */
export interface DifficultyLevel {
  key: 'easy' | 'medium' | 'hard' | 'expert';
  label: string;
  emoji: string;
  color: string;
  timeLimit: number; // seconds per riddle
}

/** Filter options for riddle fetching */
export interface RiddleFilters {
  subjectId?: string;
  chapterId?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'all';
  status?: 'published' | 'draft' | 'trash' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { key: 'easy', label: 'Easy', emoji: '🌱', color: 'from-green-400 to-green-600', timeLimit: 45 },
  {
    key: 'medium',
    label: 'Medium',
    emoji: '🌿',
    color: 'from-blue-400 to-blue-600',
    timeLimit: 30,
  },
  {
    key: 'hard',
    label: 'Hard',
    emoji: '🌲',
    color: 'from-orange-400 to-orange-600',
    timeLimit: 25,
  },
  { key: 'expert', label: 'Expert', emoji: '🔥', color: 'from-red-400 to-red-600', timeLimit: 20 },
];

// ============================================================================
// Adapter Functions
// ============================================================================

/**
 * Convert backend RiddleMcq to frontend Riddle format
 */
export function adaptRiddleMcq(riddle: RiddleMcq): Riddle {
  // Map expert/extreme to 'extreme' for AnswerOptions compatibility (shows text input)
  const isOpenEnded = riddle.level === 'expert' || riddle.level === 'extreme';

  return {
    id: riddle.id,
    question: riddle.question,
    options: riddle.options,
    correctLetter: riddle.correctLetter || null,
    correctOption: riddle.correctLetter || riddle.correctAnswer,
    correctAnswer: riddle.correctAnswer,
    difficulty: isOpenEnded ? 'expert' : (riddle.level as Riddle['difficulty']),
    level: isOpenEnded ? 'extreme' : riddle.level,
    chapter: riddle.subject?.name || 'General',
    chapterId: riddle.subjectId || '',
    status: 'published',
    hint: riddle.hint || '',
    explanation: riddle.explanation || '',
  };
}
