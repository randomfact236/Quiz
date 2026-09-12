/**
 * ============================================================================
 * storage.js — Hurdle Runner (guarded persistence facade)
 * ============================================================================
 * Rev 2 pattern (plan/games/05-continuous-runner.md §12): one versioned save
 * document instead of loose keys, migrated once from the legacy layout, with
 * a remote adapter slot a host can inject for future account sync.
 *
 * Local-first contract: every call is try/catch guarded, works in private
 * mode (persistence silently skipped), and NEVER touches the network unless a
 * host has explicitly injected a remote adapter. The game never checks auth —
 * the host decides, and guests keep full local persistence. Mid-run resume is
 * N/A by design (§7.7: a lost tab loses the run — death reads as fair).
 *
 * Legacy layout (pre-Rev 2, migrated on first write, then removed):
 *   game:hurdle-runner:best   → { distanceM }
 *   game:hurdle-runner:prefs  → { muted }
 *
 * Versioned layout:
 *   game:hurdle-runner:save   → { version: 1, best: { distanceM }, prefs: { muted } }
 * ============================================================================
 */

import { BEST_KEY, PREFS_KEY } from './core.js';

export const SAVE_KEY = 'game:hurdle-runner:save';
const SAVE_VERSION = 1;

let remoteAdapter = null;

/** Storage that degrades to an in-memory object when localStorage is unavailable. */
const storage = (() => {
  const fallback = {};
  function backend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const probe = '__hr_probe__';
        window.localStorage.setItem(probe, '1');
        window.localStorage.removeItem(probe);
        return window.localStorage;
      }
    } catch {
      /* private mode / disabled — fall through */
    }
    return null;
  }
  return {
    getItem(key) {
      const store = backend();
      return store ? store.getItem(key) : fallback[key] || null;
    },
    setItem(key, value) {
      const store = backend();
      if (store) store.setItem(key, value);
      else fallback[key] = value;
    },
    removeItem(key) {
      const store = backend();
      if (store) store.removeItem(key);
      else delete fallback[key];
    },
  };
})();

function readJson(key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // quota / private mode — persistence is best-effort
  }
}

/** Shape-check a parsed save; anything corrupt falls back to defaults. */
function normalizeSave(parsed) {
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    parsed.version !== SAVE_VERSION ||
    !parsed.best ||
    typeof parsed.best.distanceM !== 'number' ||
    parsed.best.distanceM < 0
  ) {
    return null;
  }
  return {
    version: SAVE_VERSION,
    best: { distanceM: parsed.best.distanceM },
    prefs: { muted: !!(parsed.prefs && parsed.prefs.muted) },
  };
}

/**
 * Read the versioned save, migrating from the legacy layout once. Migration
 * is idempotent: with the versioned key present it just validates and returns.
 */
function loadSave() {
  const existing = normalizeSave(readJson(SAVE_KEY, null));
  if (existing) return existing;

  const legacyBest = readJson(BEST_KEY, null);
  const legacyPrefs = readJson(PREFS_KEY, null);
  const hasLegacy = (legacyBest && typeof legacyBest === 'object') || !!legacyPrefs;

  const save = {
    version: SAVE_VERSION,
    best:
      legacyBest && typeof legacyBest === 'object' && typeof legacyBest.distanceM === 'number'
        ? { distanceM: legacyBest.distanceM }
        : { distanceM: 0 },
    prefs: { muted: !!(legacyPrefs && legacyPrefs.muted === true) },
  };
  if (writeJson(SAVE_KEY, save) && hasLegacy) {
    // Only drop the legacy keys once the migrated save is durably written.
    storage.removeItem(BEST_KEY);
    storage.removeItem(PREFS_KEY);
  }
  return save;
}

/** Host-injected account-sync seam. Adapter shape: `{ save(saveObj) }`. */
export function setRemoteAdapter(adapter) {
  remoteAdapter = adapter && typeof adapter.save === 'function' ? adapter : null;
}

function persist(save) {
  const written = writeJson(SAVE_KEY, save);
  if (remoteAdapter) {
    try {
      remoteAdapter.save(save); // host contract — never let it break gameplay
    } catch {
      /* best-effort mirror */
    }
  }
  return written;
}

/** `{ distanceM } | null` — null before the first run. */
export function getBest() {
  const best = loadSave().best;
  return best.distanceM > 0 ? best : null;
}

/** Stores `distanceM` when it beats the record; returns true exactly then. */
export function saveBest(distanceM) {
  if (typeof distanceM !== 'number' || distanceM <= 0) return false;
  const save = loadSave();
  if (save.best.distanceM >= distanceM) return false;
  save.best = { distanceM };
  persist(save);
  return true;
}

export function getMuted() {
  return !!loadSave().prefs.muted;
}

export function setMuted(muted) {
  const save = loadSave();
  save.prefs.muted = !!muted;
  persist(save);
}
