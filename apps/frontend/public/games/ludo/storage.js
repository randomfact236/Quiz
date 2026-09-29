/**
 * ============================================================================
 * storage.js — Ludo (guarded persistence facade)
 * ============================================================================
 * The games convention: one versioned save document, guarded reads and
 * writes, in-memory fallback for private mode, never any network.
 *
 *   game:ludo:save → { version: 1, series, prefs }
 *     series: { [setupKey]: { r, b, draw } }   setupKey like '1p:hard' / '2p' / 'online'
 *     prefs:  { mode, difficulty }
 * ============================================================================
 */

export const SAVE_KEY = 'game:ludo:save';
export const SAVE_VERSION = 1;

const MODES = ['1p', '2p', 'online'];
const LEVELS = ['easy', 'medium', 'hard'];

export const DEFAULT_PREFS = Object.freeze({ mode: '1p', difficulty: 'medium' });

/** One series per exact setup. */
export function seriesSetupKey(mode, difficulty) {
  // the board is fixed, so mode + difficulty is the whole setup
  return mode === '1p' ? mode + ':' + difficulty : mode;
}

export function emptyTally() {
  // d/l = red/blue, matching how game.js counts a Ludo series. This file was
  // generated from the Chess template and kept chess's white/black keys, so the
  // series card rendered "undefined" — the same trap Chess hit.
  return { d: 0, l: 0, draw: 0 };
}

/** Storage that degrades to an in-memory object when localStorage is unavailable. */
const storage = (() => {
  const fallback = {};
  function backend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const probe = '__cs_probe__';
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

function normalizeTally(tally) {
  return tally && typeof tally === 'object' ? Object.assign(emptyTally(), tally) : emptyTally();
}

function normalizePrefs(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  return {
    mode: MODES.indexOf(parsed.mode) !== -1 ? parsed.mode : '1p',
    difficulty: LEVELS.indexOf(parsed.difficulty) !== -1 ? parsed.difficulty : 'medium',
  };
}

function normalizeSave(parsed) {
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    parsed.version !== SAVE_VERSION ||
    !parsed.series ||
    typeof parsed.series !== 'object'
  ) {
    return null;
  }
  const series = {};
  for (const [setup, tally] of Object.entries(parsed.series)) {
    series[setup] = normalizeTally(tally);
  }
  return {
    version: SAVE_VERSION,
    series,
    prefs: normalizePrefs(parsed.prefs) || { ...DEFAULT_PREFS },
  };
}

let save = null;

function loadSave() {
  if (save) return save;
  save = normalizeSave(readJson(SAVE_KEY, null)) || {
    version: SAVE_VERSION,
    series: {},
    prefs: { ...DEFAULT_PREFS },
  };
  return save;
}

function persist() {
  writeJson(SAVE_KEY, save);
}

export function loadSeries(setup) {
  return normalizeTally(loadSave().series[setup]);
}

export function saveSeries(setup, tally) {
  const doc = loadSave();
  doc.series[setup] = normalizeTally(tally);
  persist();
}

export function loadPrefs() {
  return { ...(normalizePrefs(loadSave().prefs) || { ...DEFAULT_PREFS }) };
}

export function savePrefs(prefs) {
  const doc = loadSave();
  const normalized = normalizePrefs(prefs);
  if (normalized) doc.prefs = normalized;
  persist();
}
