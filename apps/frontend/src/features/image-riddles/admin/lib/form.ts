/**
 * ============================================================================
 * admin/lib/form.ts — riddle form state helpers
 * ============================================================================
 * Form state type, defaults, the riddle→form mapping used by the edit modal,
 * and the completeness predicate shared by the submit handlers and the
 * disabled state of the save button.
 * ============================================================================
 */

import type { ContentStatus, ImageRiddle } from '@/app/admin/types';

/** Riddle form state type */
export interface RiddleFormState {
  title: string;
  imageUrl: string;
  answer: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  timerSeconds: string;
  showTimer: boolean;
  isActive: boolean;
  categoryName: string;
  categoryEmoji: string;
  status?: ContentStatus;
}

/** Default form state */
export const defaultFormState: RiddleFormState = {
  title: '',
  imageUrl: '',
  answer: '',
  hint: '',
  difficulty: 'medium',
  timerSeconds: '',
  showTimer: true,
  isActive: true,
  categoryName: '',
  categoryEmoji: '',
  status: 'draft',
};

/** Required-text predicate: identical to the original inline checks. */
export function isRiddleFormComplete(form: RiddleFormState): boolean {
  return Boolean(
    form.title.trim() && form.imageUrl.trim() && form.answer.trim() && form.categoryName.trim()
  );
}

/** Map an existing riddle onto the form (used when opening the edit modal). */
export function riddleToFormState(riddle: ImageRiddle): RiddleFormState {
  return {
    title: riddle.title,
    imageUrl: riddle.imageUrl,
    answer: riddle.answer,
    hint: riddle.hint || '',
    difficulty: riddle.difficulty,
    status: riddle.status,
    timerSeconds: riddle.timerSeconds?.toString() || '',
    showTimer: riddle.showTimer,
    isActive: riddle.isActive,
    categoryName: riddle.category?.name || '',
    categoryEmoji: riddle.category?.emoji || '',
  };
}

/** Parse the timer string into the API payload value (null when unset). */
export function parseTimerSeconds(timerSeconds: string): number | null {
  return timerSeconds ? parseInt(timerSeconds, 10) : null;
}
