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
  subjects?: RiddleSubject[];
  riddles?: ClassicRiddle[];
  createdAt?: string;
  updatedAt?: string;
}

/** Riddle Subject - Backend Entity */
export interface RiddleSubject {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  description?: string;
  isActive: boolean;
  order: number;
  categoryId?: string;
  category?: RiddleMcqCategory;
  chapters?: RiddleChapter[];
  riddles?: QuizRiddle[];
}

/** Riddle Chapter - Backend Entity */
export interface RiddleChapter {
  id: string;
  name: string;
  chapterNumber: number;
  subjectId: string;
  subject?: RiddleSubject;
  riddles?: QuizRiddle[];
}

/** Quiz Riddle - Backend Entity (for gameplay) */
export interface QuizRiddle {
  id: string;
  question: string;
  options: string[];
  correctLetter: string | null; // 'A', 'B', 'C', 'D' or null for expert
  correctAnswer: string; // kept for backward compatibility
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  subjectId?: string;
  subject?: RiddleSubject;
  chapterId?: string;
  chapter?: RiddleChapter;
  explanation?: string;
  hint?: string;
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

/** Chapter with display info for frontend */
export interface ChapterDisplay {
  id: string;
  title: string;
  name: string; // alias for title
  icon: string;
  emoji?: string;
  chapterNumber: number;
  subjectId: string;
  subjectName?: string;
  riddleCount: number;
  order: number;
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

/** Riddle History Entry - Phase 0: Saved in localStorage */
export interface RiddleHistoryEntry {
  sessionId: string;
  mode: 'timer' | 'practice';
  chapterId: string | 'all';
  chapterName?: string;
  difficulty: string;
  totalRiddles: number;
  correctCount: number;
  percentage: number;
  grade: string;
  timeTaken: number;
  completedAt: string;
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
  { key: 'medium', label: 'Medium', emoji: '🌿', color: 'from-blue-400 to-blue-600', timeLimit: 30 },
  { key: 'hard', label: 'Hard', emoji: '🌲', color: 'from-orange-400 to-orange-600', timeLimit: 25 },
  { key: 'expert', label: 'Expert', emoji: '🔥', color: 'from-red-400 to-red-600', timeLimit: 20 },
];

export const DEFAULT_CHAPTER_ICONS: Record<string, string> = {
  'Trick Questions': '🤔',
  'Puzzle Stories': '📖',
  'Logic Puzzles': '🧩',
  'Word Play': '🔤',
  'Math Riddles': '🔢',
  'Mystery Cases': '🔍',
  'Brain Teasers': '🧠',
  'Visual Puzzles': '👁️',
  'Lateral Thinking': '💭',
  'Classic Riddles': '📜',
  'Funny Riddles': '😂',
  'Mystery Riddles': '🕵️',
  'Everyday Objects': '🏺',
  'Wordplay': '📝',
  'Pattern Recognition': '🔲',
  'Short & Quick': '⚡',
  'Long Story Riddles': '📚',
  'Kids Riddles': '🧒',
  'Animal Riddles': '🦁',
  'Deduction Riddles': '🔎',
};

// ============================================================================
// Adapter Functions
// ============================================================================

/**
 * Convert backend QuizRiddle to frontend Riddle format
 */
export function adaptQuizRiddle(riddle: QuizRiddle): Riddle {
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
    chapter: riddle.chapter?.name || riddle.subject?.name || 'General',
    chapterId: riddle.chapterId || riddle.subjectId || '',
    status: 'published',
    hint: riddle.hint || '',
    explanation: riddle.explanation || '',
  };
}

/**
 * Convert backend RiddleChapter to frontend ChapterDisplay format
 */
export function adaptChapter(chapter: RiddleChapter): ChapterDisplay {
  const icon = chapter.subject?.emoji || 
    DEFAULT_CHAPTER_ICONS[chapter.name] || 
    '📚';
  
  return {
    id: chapter.id,
    title: chapter.name,
    name: chapter.name,
    icon,
    emoji: icon,
    chapterNumber: chapter.chapterNumber,
    subjectId: chapter.subjectId,
    subjectName: chapter.subject?.name || '',
    riddleCount: chapter.riddles?.length || 0,
    order: chapter.chapterNumber,
  };
}

/**
 * Convert frontend Riddle back to backend format
 */
export function toBackendRiddle(riddle: Partial<Riddle>): Partial<QuizRiddle> {
  const result: Partial<QuizRiddle> = {};
  
  if (riddle.id) result.id = riddle.id;
  if (riddle.question) result.question = riddle.question;
  if (riddle.options) result.options = riddle.options;
  if (riddle.correctOption) result.correctAnswer = riddle.correctOption;
  if (riddle.difficulty) result.level = riddle.difficulty;
  if (riddle.chapterId) result.chapterId = riddle.chapterId;
  if (riddle.hint) result.hint = riddle.hint;
  if (riddle.explanation) result.explanation = riddle.explanation;
  
  return result;
}
