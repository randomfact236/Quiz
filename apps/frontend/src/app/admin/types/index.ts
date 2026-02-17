/**
 * ============================================================================
 * Admin Types
 * ============================================================================
 * Shared types for the admin module
 * ============================================================================
 */

import { type StatusFilter, type BulkActionType } from '@/types/status.types';

export type { StatusFilter, BulkActionType };

/** Content Status Type */
export type ContentStatus = 'published' | 'draft' | 'trash';

/** Question Type */
export interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
  status?: ContentStatus;
}

/** Subject Type */
export interface Subject {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  category: 'academic' | 'professional' | 'entertainment';
  order?: number;
}

/** Menu Section Type */
export type MenuSection = 
  | 'dashboard' 
  | 'science' | 'math' | 'history' | 'geography' | 'english' | 'technology'
  | 'jokes' | 'riddles' | 'image-riddles' 
  | 'users' | 'settings';

/** Joke Type - Enterprise Grade */
export interface Joke {
  id: number;
  joke: string;
  category: string;
  status: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Joke Category Type */
export interface JokeCategory {
  id: number;
  name: string;
  emoji: string;
  description?: string;
}

/** Riddle Type - Enterprise Grade */
export interface Riddle {
  id: number;
  question: string;
  answer?: string;
  options: string[];
  correctOption: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
  status: ContentStatus;
  hint?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Image Riddle Type - Enterprise Grade */
export interface ImageRiddle {
  id: string;
  title: string;
  imageUrl: string;
  answer: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: { name: string; emoji: string };
  status: ContentStatus;
  timerSeconds?: number | null;
  showTimer: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Validation Result Type */
export interface ValidationResult<T> {
  isValid: boolean;
  data: T | null;
  errors: string[];
  warnings: string[];
}

/** Import Result Type */
export interface ImportResult<T> {
  success: boolean;
  imported: T[];
  failed: { row: number; error: string; data: unknown }[];
  total: number;
}

/** Import/Export Config Type */
export interface ImportExportConfig<T> {
  entityName: string;
  filePrefix: string;
  csvHeaders: string[];
  jsonRootKey: string;
  validators: {
    required: (keyof T)[];
    enumFields?: Record<string, string[]>;
    maxLength?: Record<string, number>;
  };
}
