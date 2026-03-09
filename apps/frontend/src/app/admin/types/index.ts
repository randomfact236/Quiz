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
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
  status?: ContentStatus | undefined;
  hint?: string | undefined;
  explanation?: string | undefined;
}

/** Subject Type */
export interface Subject {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  category: 'academic' | 'professional' | 'entertainment';
  order?: number;
  isActive?: boolean;
}

/** Menu Section Type */
export type MenuSection = string;

/** Joke Type - Enterprise Grade */
export type Joke = import("@/lib/jokes-api").Joke;

/** Joke Category Type */
export interface JokeCategory {
  id: string;
  name: string;
  emoji: string;
  description?: string;
}

/** Riddle Type - Enterprise Grade */
export interface Riddle {
  id: string;
  question: string;
  answer?: string;
  options: string[];
  correctOption: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
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
  category?: { name: string; emoji: string } | undefined;
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
