/**
 * ============================================================================
 * storage.js — Tap or Don't Tap (guarded persistence facade)
 * ============================================================================
 * Rev 2 pattern (plan/games/01-tap-or-dont-tap.md §13): one versioned save
 * document instead of loose keys, migrated once from the legacy layout, with
 * a remote adapter slot a host can inject for future account sync.
 *
 * Local-first contract: every call is try/catch guarded, works in private
 * mode (persistence silently skipped), and NEVER touches the network unless a
 * host has explicitly injected a remote adapter. The game never checks auth —
 * the host decides, and guests keep full local persistence.
 *
 * Legacy layout (pre-Rev 2, migrated on first read, then removed):
 *   game:tap-or-dont-tap:best    → { score, bestMs }
 *   game:tap-or-dont-tap:history → [{ score, bestMs, rounds, ts }, …]
 *   game:tap-or-dont-tap:muted   → '1' | '0'
 *
 * Versioned layout:
 *   game:tap-or-dont-tap:save → { version: 2, best, history, prefs }
 *     v1: prefs.muted only.
 *     v2: adds prefs.seenTutorials { decoy, stroop, swap } (first-encounter
 *         tutorial flags — suggestion 01); v1 saves migrate on first read.
 * ============================================================================
 */

import { SLUG, HISTORY_MAX } from './core.js';

const SAVE_KEY = `game:${SLUG}:save`;
const SAVE_VERSION = 2;
const LEGACY_KEYS = {
  best: `game:${SLUG}:best`,
  history: `game:${SLUG}:history`,
  muted: `game:${SLUG}:muted`,
};

let remoteAdapter = null;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // private mode / quota — persistence is best-effort
  }
}

function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* best-effort */
  }
}

function readRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function defaultSave() {
  return {
    version: SAVE_VERSION,
    best: { score: 0, bestMs: null },
    history: [],
    prefs: {
      muted: false,
      seenTutorials: { decoy: false, stroop: false, swap: false },
    },
  };
}

/** Normalize the seenTutorials flags (missing/garbage fields read as false). */
function normalizeSeenTutorials(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    decoy: !!source.decoy,
    stroop: !!source.stroop,
    swap: !!source.swap,
  };
}

/** Shape-check a parsed save; anything corrupt falls back to defaults. */
function normalizeSave(parsed) {
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    parsed.version !== SAVE_VERSION ||
    !parsed.best ||
    typeof parsed.best.score !== 'number' ||
    !Array.isArray(parsed.history)
  ) {
    return null;
  }
  return {
    version: SAVE_VERSION,
    best: {
      score: parsed.best.score || 0,
      bestMs: typeof parsed.best.bestMs === 'number' ? parsed.best.bestMs : null,
    },
    history: parsed.history.filter((h) => h && typeof h === 'object'),
    prefs: {
      muted: !!(parsed.prefs && parsed.prefs.muted),
      seenTutorials: normalizeSeenTutorials(parsed.prefs && parsed.prefs.seenTutorials),
    },
  };
}

/**
 * v1 → v2 migration: carries best/history/muted over untouched and defaults
 * the three tutorial flags to false (they flip true after first showing).
 * Returns null for anything that isn't a well-formed v1 save.
 */
function migrateV1(parsed) {
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    parsed.version !== 1 ||
    !parsed.best ||
    typeof parsed.best.score !== 'number' ||
    !Array.isArray(parsed.history)
  ) {
    return null;
  }
  return {
    version: SAVE_VERSION,
    best: {
      score: parsed.best.score || 0,
      bestMs: typeof parsed.best.bestMs === 'number' ? parsed.best.bestMs : null,
    },
    history: parsed.history.filter((h) => h && typeof h === 'object'),
    prefs: {
      muted: !!(parsed.prefs && parsed.prefs.muted),
      seenTutorials: { decoy: false, stroop: false, swap: false },
    },
  };
}

/**
 * Read the save, migrating older layouts in once: v1 → v2 (tutorial flags)
 * first, then the legacy loose keys. Migration is idempotent: with a current
 * versioned key present it just validates and returns.
 */
export function loadSave() {
  const raw = readJson(SAVE_KEY, null);
  const existing = normalizeSave(raw);
  if (existing) return existing;

  const migrated = migrateV1(raw);
  if (migrated) {
    persist(migrated); // durable before the next read sees it as current
    return migrated;
  }

  const legacyBest = readJson(LEGACY_KEYS.best, null);
  const legacyHistory = readJson(LEGACY_KEYS.history, null);
  // The legacy mute flag was stored as a raw '1'/'0' string, not JSON.
  const legacyMuted = readRaw(LEGACY_KEYS.muted);
  const hasLegacy =
    (legacyBest && typeof legacyBest === 'object') ||
    Array.isArray(legacyHistory) ||
    legacyMuted !== null;

  const save = defaultSave();
  if (legacyBest && typeof legacyBest === 'object') {
    save.best = {
      score: typeof legacyBest.score === 'number' ? legacyBest.score : 0,
      bestMs: typeof legacyBest.bestMs === 'number' ? legacyBest.bestMs : null,
    };
  }
  if (Array.isArray(legacyHistory)) {
    save.history = legacyHistory.filter((h) => h && typeof h === 'object').slice(-HISTORY_MAX);
  }
  save.prefs.muted = legacyMuted === '1';
  if (writeJson(SAVE_KEY, save) && hasLegacy) {
    // Only drop the legacy keys once the migrated save is durably written.
    removeKey(LEGACY_KEYS.best);
    removeKey(LEGACY_KEYS.history);
    removeKey(LEGACY_KEYS.muted);
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

export function getBest() {
  return loadSave().best;
}

export function getHistory() {
  return loadSave().history;
}

/**
 * Fold a finished run into the save: best fields keep the lower reaction /
 * higher score independently; history is capped at HISTORY_MAX.
 * Returns `{ best, isRecord }`.
 */
export function recordRun({ score, bestMs = null }) {
  const save = loadSave();
  const prevBest = save.best;
  const isRecord = score > (prevBest.score || 0);
  save.best = {
    score: Math.max(score, prevBest.score || 0),
    bestMs:
      bestMs !== null && prevBest.bestMs !== null
        ? Math.min(bestMs, prevBest.bestMs)
        : (bestMs ?? prevBest.bestMs),
  };
  save.history.push({ score, bestMs });
  save.history = save.history.slice(-HISTORY_MAX);
  persist(save);
  return { best: save.best, isRecord };
}

export function getMuted() {
  return !!loadSave().prefs.muted;
}

export function setMuted(muted) {
  const save = loadSave();
  save.prefs.muted = !!muted;
  persist(save);
}

/** First-encounter tutorial flags — all false until the mechanic is shown. */
export function getSeenTutorials() {
  return { ...loadSave().prefs.seenTutorials };
}

export function markTutorialSeen(key) {
  const save = loadSave();
  if (!save.prefs.seenTutorials || !(key in save.prefs.seenTutorials)) return;
  save.prefs.seenTutorials[key] = true;
  persist(save);
}
