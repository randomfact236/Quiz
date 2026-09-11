/**
 * ============================================================================
 * storage.js — Tic Tac Toe (guarded persistence facade)
 * ============================================================================
 * Rev 2 pattern (plan/games/02-tic-tac-toe.md §12): one versioned save
 * document instead of loose keys, migrated once from the legacy layout, with
 * a remote adapter slot a host can inject for future account sync.
 *
 * Local-first contract: every call is try/catch guarded, works in private
 * mode (persistence silently skipped), and NEVER touches the network unless a
 * host has explicitly injected a remote adapter. The game never checks auth —
 * the host decides, and guests keep full local persistence.
 *
 * Legacy layout (pre-Rev 2, migrated on first write, then removed):
 *   game:tic-tac-toe:series → { [setupKey]: { x, o, draw } }
 *   game:tic-tac-toe:prefs  → { mode, level, misere }
 *
 * Versioned layout:
 *   game:tic-tac-toe:save   → { version: 1, series, prefs }
 * ============================================================================
 */

export const SAVE_KEY = 'game:tic-tac-toe:save';
export const SAVE_VERSION = 1;

/** Legacy key constants — kept exported for the migration tests. */
export const SERIES_KEY = 'game:tic-tac-toe:series';
export const PREFS_KEY = 'game:tic-tac-toe:prefs';

const MODES = ['1p', '2p'];
const LEVELS = ['easy', 'medium', 'hard'];

/** What a fresh install plays with — also what corrupt prefs normalize into. */
export const DEFAULT_PREFS = Object.freeze({ mode: '1p', level: 'medium', misere: false });

let remoteAdapter = null;

/** Storage that degrades to an in-memory object when localStorage is unavailable. */
const storage = (() => {
  const fallback = {};
  function backend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const probe = '__t3_probe__';
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

/** One series per exact setup: "2p", "1p:hard", misère adds ":misere". */
export function seriesSetupKey(mode, difficulty, misere) {
  let key = mode;
  if (mode === '1p') key += ':' + difficulty;
  if (misere) key += ':misere';
  return key;
}

export function emptyTally() {
  return { x: 0, o: 0, draw: 0 };
}

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

/** Shape-check a parsed save; anything corrupt falls back to defaults. */
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

function normalizePrefs(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  return {
    mode: MODES.indexOf(parsed.mode) !== -1 ? parsed.mode : '1p',
    level: LEVELS.indexOf(parsed.level) !== -1 ? parsed.level : 'medium',
    misere: !!parsed.misere,
  };
}

/**
 * Read the versioned save, migrating from the legacy layout once. Migration
 * is idempotent: with the versioned key present it just validates and returns.
 */
function loadSave() {
  const existing = normalizeSave(readJson(SAVE_KEY, null));
  if (existing) return existing;

  const legacySeries = readJson(SERIES_KEY, null);
  const legacyPrefs = readJson(PREFS_KEY, null);
  const hasLegacy = (legacySeries && typeof legacySeries === 'object') || !!legacyPrefs;

  const series = {};
  if (legacySeries && typeof legacySeries === 'object') {
    for (const [setup, tally] of Object.entries(legacySeries)) {
      series[setup] = normalizeTally(tally);
    }
  }
  const save = {
    version: SAVE_VERSION,
    series,
    prefs: normalizePrefs(legacyPrefs) || { ...DEFAULT_PREFS },
  };

  if (writeJson(SAVE_KEY, save) && hasLegacy) {
    // Only drop the legacy keys once the migrated save is durably written.
    storage.removeItem(SERIES_KEY);
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

export function loadSeries(setup) {
  return normalizeTally(loadSave().series[setup]);
}

export function saveSeries(setup, tally) {
  const save = loadSave();
  save.series[setup] = normalizeTally(tally);
  persist(save);
}

export function loadPrefs() {
  return normalizePrefs(loadSave().prefs) || { ...DEFAULT_PREFS };
}

export function savePrefs(prefs) {
  const save = loadSave();
  const normalized = normalizePrefs(prefs);
  if (normalized) save.prefs = normalized;
  persist(save);
}
