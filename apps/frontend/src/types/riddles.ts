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
  correctAnswer?: string; // Text answer for expert level
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  subjectId?: string;
  subject?: RiddleMcqSubject;
  explanation?: string;
  hint?: string;
  answer?: string; // Backend column: the text answer (mapped to correctAnswer)
  status?: 'published' | 'draft' | 'trash';
  createdAt?: string;
  updatedAt?: string;
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
  subjectId: string | 'all';
  subjectName: string;
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
}

/** Riddle Configuration */
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
}

// ============================================================================
// Adapter Functions
// ============================================================================

/**
 * Convert backend RiddleMcq to frontend Riddle format
 */
export function adaptRiddleMcq(riddle: RiddleMcq): Riddle {
  // Map expert/extreme to 'extreme' for AnswerOptions compatibility (shows text input)
  const isOpenEnded = riddle.level === 'expert' || riddle.level === 'extreme';
  // Backend exposes the text answer as `answer` (no correctAnswer column); keep
  // a correctAnswer fallback so test fixtures that inject it directly keep working.
  const textAnswer = riddle.correctAnswer ?? riddle.answer ?? '';

  return {
    id: riddle.id,
    question: riddle.question,
    options: riddle.options,
    correctLetter: riddle.correctLetter || null,
    correctOption: riddle.correctLetter || textAnswer,
    correctAnswer: textAnswer,
    difficulty: isOpenEnded ? 'expert' : (riddle.level as Riddle['difficulty']),
    level: isOpenEnded ? 'extreme' : riddle.level,
    hint: riddle.hint || '',
    explanation: riddle.explanation || '',
  };
}
