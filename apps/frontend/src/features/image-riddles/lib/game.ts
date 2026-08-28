/**
 * ============================================================================
 * features/image-riddles/lib/game.ts — pure game helpers
 * ============================================================================
 * Pure, DOM-free helpers shared by the image riddle hooks/components so the
 * logic stays unit-testable (mirrors the riddle-mcq shared-scorer pattern).
 * ============================================================================
 */

import type { ImageRiddle } from '@/lib/image-riddles-api';

export const ITEMS_PER_PAGE = 12;

export const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-orange-100 text-orange-700 border-orange-200',
  expert: 'bg-red-100 text-red-700 border-red-200',
};

export const difficultyLabels: Record<string, string> = {
  easy: '🌱 Easy',
  medium: '⭐ Medium',
  hard: '🔥 Hard',
  expert: '💎 Expert',
};

// Mirrors backend settings.imageRiddles.timers (RIDDLE_TIMERS) — single
// source of truth lives there; keep these values in sync.
export const defaultTimers: Record<string, number> = {
  easy: 60,
  medium: 90,
  hard: 120,
  expert: 180,
};

/** Effective timer for a riddle: explicit value, else difficulty default. */
export function resolveTimerSeconds(riddle: {
  timerSeconds: number | null;
  difficulty: string;
}): number {
  return riddle.timerSeconds ?? defaultTimers[riddle.difficulty] ?? 90;
}

/** `m:ss` clock format for badges and the modal countdown. */
export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

/**
 * Deterministic FNV-1a position hash for the "Mix" shuffle: same seed and id
 * always produce the same rank, so filtering never re-randomizes the grid.
 */
export function seededPosition(id: string, seed: number): number {
  let hash = 2166136261 ^ seed;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Stable seeded "Mix" ordering for a list of riddles. */
export function applyMixSort(riddles: ImageRiddle[], seed: number): ImageRiddle[] {
  return [...riddles].sort((a, b) => seededPosition(a.id, seed) - seededPosition(b.id, seed));
}

export interface RiddleFilterParams {
  activeCategory: string | null;
  difficulty: string;
  searchQuery: string;
}

/** Client-side filter used by the offline fallback dataset. */
export function filterRiddles(riddles: ImageRiddle[], params: RiddleFilterParams): ImageRiddle[] {
  let result = riddles.filter((r) => r.status === 'published');

  if (params.activeCategory) {
    result = result.filter((r) => r.category?.name === params.activeCategory);
  }
  if (params.difficulty !== 'all') {
    result = result.filter((r) => r.difficulty === params.difficulty);
  }
  const q = params.searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (r) => r.title.toLowerCase().includes(q) || r.answer.toLowerCase().includes(q)
    );
  }
  return result;
}

/**
 * Action ids the frontend can execute. Everything else (report/fullscreen/
 * timer controls presets) renders inert today, so it is dropped at render
 * time until real handlers exist (upgrade plan A2).
 */
export const UNSUPPORTED_ACTION_IDS: ReadonlySet<string> = new Set([
  'report',
  'fullscreen',
  'reset-timer',
  'pause-timer',
  'resume-timer',
]);
