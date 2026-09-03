/**
 * ============================================================================
 * Settings Service (API-backed — plan/11-site-settings.md P1 #1/#2, P3 #1)
 * ============================================================================
 * - getSettings(): gameplay-relevant settings from the public
 *   `GET /settings/public` endpoint (timers only). Falls back to the same
 *   defaults the backend ships with when the API is unreachable, so gameplay
 *   never breaks offline.
 * - getAdminSettings() / updateSettings(): full read/write via the admin-only
 *   `GET|PATCH /settings` endpoints (admin token required).
 *
 * The former localStorage mock (DEFAULT_MOCK_SETTINGS + MOCK_API_DELAY_MS) is
 * gone — the backend's config/settings.ts is the single defaults source.
 * ============================================================================
 */

import { adminApi, api } from '@/lib/api-client';
import { RIDDLE_TIMERS } from '@/lib/constants';
import type { SystemSettings } from '@/types/settings.types';

// Re-export SystemSettings for backward compatibility
export type { SystemSettings };

/** Gameplay-visible settings shape returned by GET /settings/public. */
export interface PublicSettings {
  quiz: {
    defaults: {
      levelTimers: {
        easy: number;
        medium: number;
        hard: number;
        expert: number;
        extreme: number;
      };
    };
  };
  riddles: {
    defaults: {
      categoryEmoji: string;
      difficulty: string;
      levelTimers: {
        easy: number;
        medium: number;
        hard: number;
        expert: number;
      };
    };
  };
  imageRiddles: {
    timers: {
      easy: number;
      medium: number;
      hard: number;
      expert: number;
    };
  };
}

/** Mirrors the backend's config/settings.ts defaults (single-source parity). */
export const FALLBACK_PUBLIC_SETTINGS: PublicSettings = {
  quiz: {
    defaults: {
      levelTimers: { easy: 30, medium: 45, hard: 60, expert: 90, extreme: 120 },
    },
  },
  riddles: {
    defaults: {
      categoryEmoji: '🧩',
      difficulty: 'medium',
      levelTimers: {
        easy: RIDDLE_TIMERS.EASY,
        medium: RIDDLE_TIMERS.MEDIUM,
        hard: RIDDLE_TIMERS.HARD,
        expert: RIDDLE_TIMERS.EXPERT,
      },
    },
  },
  imageRiddles: {
    timers: {
      easy: RIDDLE_TIMERS.EASY,
      medium: RIDDLE_TIMERS.MEDIUM,
      hard: RIDDLE_TIMERS.HARD,
      expert: RIDDLE_TIMERS.EXPERT,
    },
  },
};

// Simple in-process cache — settings change rarely.
let cache: { data: PublicSettings; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

export const SettingsService = {
  /** Gameplay settings (public endpoint). Falls back to defaults offline. */
  async getSettings(): Promise<PublicSettings> {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return cache.data;
    }
    try {
      const response = await api.get<PublicSettings>('/settings/public');
      cache = { data: response.data, fetchedAt: Date.now() };
      return response.data;
    } catch {
      return FALLBACK_PUBLIC_SETTINGS;
    }
  },

  /** Full settings for the admin UI (admin token). */
  async getAdminSettings(): Promise<SystemSettings> {
    const response = await adminApi.get<SystemSettings>('/settings');
    return response.data;
  },

  /** Persist admin changes (admin token). */
  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await adminApi.patch<SystemSettings>('/settings', updates);
    cache = null; // gameplay cache may now be stale
    return response.data;
  },
};
