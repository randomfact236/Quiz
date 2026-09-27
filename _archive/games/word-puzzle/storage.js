/**
 * ============================================================================
 * storage.js — Word Puzzle (guarded persistence facade)
 * ============================================================================
 * Rev 2 pattern (plan/games/04-word-puzzle.md §12): one versioned save
 * document instead of loose keys, migrated once from the legacy layout, with
 * a remote adapter slot a host can inject for future account sync.
 *
 * Local-first contract: every call is try/catch guarded, works in private
 * mode (persistence silently skipped), and NEVER touches the network unless a
 * host has explicitly injected a remote adapter. The game never checks auth —
 * the host decides, and guests keep full local persistence.
 *
 * Legacy layout (pre-Rev 2, migrated on first write, then removed):
 *   game:word-puzzle:progress → { "<theme>:<lvl>": { stars, bestTimeMs } }
 *   game:word-puzzle:prefs    → { muted }
 *
 * Versioned layout:
 *   game:word-puzzle:save     → { version: 1, levels, prefs }
 * ============================================================================
 */

/** Legacy key constants — kept exported for the migration tests. */
export const PROGRESS_KEY = 'game:word-puzzle:progress';
export const PREFS_KEY = 'game:word-puzzle:prefs';

export const SAVE_KEY = 'game:word-puzzle:save';
const SAVE_VERSION = 1;

let remoteAdapter = null;

/** Storage that degrades to an in-memory object when localStorage is unavailable. */
const storage = (() => {
  const fallback = {};
  function backend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const probe = '__wp_probe__';
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

function normalizeTally(rec) {
  return rec &&
    typeof rec === 'object' &&
    typeof rec.stars === 'number' &&
    rec.stars >= 0 &&
    rec.stars <= 3 &&
    typeof rec.bestTimeMs === 'number' &&
    rec.bestTimeMs >= 0
    ? { stars: rec.stars, bestTimeMs: rec.bestTimeMs }
    : null;
}

/** Shape-check a parsed save; anything corrupt falls back to defaults. */
function normalizeSave(parsed) {
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    parsed.version !== SAVE_VERSION ||
    !parsed.levels ||
    typeof parsed.levels !== 'object'
  ) {
    return null;
  }
  const levels = {};
  for (const [key, rec] of Object.entries(parsed.levels)) {
    const normalized = normalizeTally(rec);
    if (normalized) levels[key] = normalized;
  }
  return {
    version: SAVE_VERSION,
    levels,
    prefs: { muted: !!(parsed.prefs && parsed.prefs.muted) },
  };
}

/**
 * Read the versioned save, migrating from the legacy layout once. Migration
 * is idempotent: with the versioned key present it just validates and returns.
 */
export function loadSave() {
  const existing = normalizeSave(readJson(SAVE_KEY, null));
  if (existing) return existing;

  const legacyProgress = readJson(PROGRESS_KEY, {});
  const legacyPrefs = readJson(PREFS_KEY, {});
  const hasLegacy =
    (legacyProgress &&
      typeof legacyProgress === 'object' &&
      Object.keys(legacyProgress).length > 0) ||
    Object.keys(legacyPrefs).length > 0;

  const levels = {};
  if (legacyProgress && typeof legacyProgress === 'object') {
    for (const [key, rec] of Object.entries(legacyProgress)) {
      const normalized = normalizeTally(rec);
      if (normalized) levels[key] = normalized;
    }
  }
  const save = {
    version: SAVE_VERSION,
    levels,
    prefs: { muted: legacyPrefs.muted === true },
  };
  if (writeJson(SAVE_KEY, save) && hasLegacy) {
    // Only drop the legacy keys once the migrated save is durably written.
    storage.removeItem(PROGRESS_KEY);
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

export function loadLevels() {
  return loadSave().levels;
}

/**
 * Fold a finished level into the versioned save: best stars + best time are
 * kept independently. Returns `{ record, newBest }`.
 */
export function saveResult(themeId, levelNo, stars, timeMs) {
  const save = loadSave();
  const key = themeId + ':' + levelNo;
  const prev = save.levels[key] || { stars: 0, bestTimeMs: Infinity };
  save.levels[key] = {
    stars: Math.max(prev.stars, stars),
    bestTimeMs: Math.min(prev.bestTimeMs, timeMs),
  };
  persist(save);
  return { record: save.levels[key], newBest: timeMs < prev.bestTimeMs };
}

export function getMuted() {
  return !!loadSave().prefs.muted;
}

export function setMuted(muted) {
  const save = loadSave();
  save.prefs.muted = !!muted;
  persist(save);
}
