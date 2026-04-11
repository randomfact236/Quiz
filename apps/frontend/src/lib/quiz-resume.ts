import { STORAGE_KEYS, getItem, setItem, removeItem } from './storage';
import type { Question } from '@/types/quiz';

const RESUME_KEY = STORAGE_KEYS.QUIZ_RESUME_SESSION;
const RESUME_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface QuizResumeState {
  subject: string;
  chapter: string;
  level: string;
  mode: 'normal' | 'timer_challenge' | 'practice_challenge';
  currentQuestionIndex: number;
  sessionSize: number;
  answers: Record<string, string>;
  score: number;
  manuallySkipped: string[];
  availableQuestions: Question[];
  savedAt: number;
  startedAt: string;
}

export function saveQuizResume(state: QuizResumeState): void {
  setItem(RESUME_KEY, { ...state, savedAt: Date.now() });
}

export function loadQuizResume(): QuizResumeState | null {
  const saved = getItem<QuizResumeState | null>(RESUME_KEY, null);
  if (!saved) return null;
  if (isQuizResumeExpired(saved)) {
    clearQuizResume();
    return null;
  }
  return saved;
}

export function clearQuizResume(): void {
  removeItem(RESUME_KEY);
}

export function isQuizResumeExpired(state: QuizResumeState): boolean {
  return Date.now() - state.savedAt > RESUME_EXPIRY_MS;
}

export function isQuizResumeMatch(
  state: QuizResumeState,
  subject: string,
  chapter: string,
  level: string,
  mode: string
): boolean {
  return (
    state.subject === subject &&
    state.chapter === chapter &&
    state.level === level &&
    state.mode === mode
  );
}
