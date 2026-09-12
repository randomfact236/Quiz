/**
 * ============================================================================
 * Sliding Puzzle — storage.js (Game 03, guarded persistence facade)
 * ============================================================================
 * Rev 2 pattern (plan/games/03-sliding-puzzle.md §5/§6): one versioned save
 * document instead of loose keys, migrated once from the legacy layout, with
 * a remote adapter slot a host can inject for future account sync.
 *
 * Local-first contract: every call is try/catch guarded, works in private
 * mode (persistence silently skipped), and NEVER touches the network unless a
 * host has explicitly injected a remote adapter. The game never checks auth —
 * the host decides, and guests keep full local persistence.
 *
 * Legacy layout (pre-Rev 2, migrated on first write, then removed) — the key
 * builders live in core.js:
 *   game:sliding-puzzle:prefs              → { size, muted, mode, hard }
 *   game:sliding-puzzle:best:<size>[:hard] → { timeMs, moves }
 *   game:sliding-puzzle:daily:<yyyymmdd>   → { timeMs, moves }
 *
 * Versioned layout:
 *   game:sliding-puzzle:save → {
 *     version: 1,
 *     prefs: { size, muted, mode, hard },
 *     bests: { '<size>[:hard]': { timeMs, moves } },
 *     daily: { '<yyyymmdd>': { timeMs, moves } },
 *   }
 * ============================================================================
 */
import { DAILY_PREFIX, PREFS_KEY, SIZES, bestKey, dailySeed, mergeRecord } from './core.js';

export const SAVE_KEY = 'game:sliding-puzzle:save';

const SAVE_VERSION = 1;

let remoteAdapter = null;

/** Storage that degrades to an in-memory object when localStorage is unavailable. */
const storage = (() => {
  const fallback = {};
  function backend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const probe = '__sp_probe__';
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
    /** Every stored key with the given prefix (legacy daily-key enumeration). */
    keysWithPrefix(prefix) {
      const store = backend();
      const keys = [];
      if (store) {
        for (let i = 0; i < store.length; i++) {
          const key = store.key(i);
          if (key && key.startsWith(prefix)) keys.push(key);
        }
      } else {
        for (const key of Object.keys(fallback)) {
          if (key.startsWith(prefix)) keys.push(key);
        }
      }
      return keys;
    },
  };
})();

function readJson(key, fallbackValue) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
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

/** A stored {timeMs, moves} record, shape-checked; null for anything else. */
function sanitizeRecord(rec) {
  return rec &&
    typeof rec === 'object' &&
    typeof rec.timeMs === 'number' &&
    rec.timeMs >= 0 &&
    typeof rec.moves === 'number' &&
    rec.moves >= 0
    ? { timeMs: rec.timeMs, moves: rec.moves }
    : null;
}

/** Menu prefs, validated exactly like the legacy loader (unknown → defaults). */
function normalizePrefs(raw) {
  return {
    size: raw && SIZES.indexOf(raw.size) !== -1 ? raw.size : 3,
    muted: !!(raw && raw.muted === true),
    mode: raw && raw.mode === 'picture' ? 'picture' : 'numbers',
    hard: !!(raw && raw.hard === true),
  };
}

/** Shape-check a parsed save; anything corrupt falls back to migration. */
function normalizeSave(parsed) {
  if (!parsed || typeof parsed !== 'object' || parsed.version !== SAVE_VERSION) {
    return null;
  }
  const bests = {};
  const daily = {};
  if (parsed.bests && typeof parsed.bests === 'object') {
    for (const [slot, rec] of Object.entries(parsed.bests)) {
      const clean = sanitizeRecord(rec);
      if (clean) bests[slot] = clean;
    }
  }
  if (parsed.daily && typeof parsed.daily === 'object') {
    for (const [slot, rec] of Object.entries(parsed.daily)) {
      const clean = sanitizeRecord(rec);
      if (clean) daily[slot] = clean;
    }
  }
  return { version: SAVE_VERSION, prefs: normalizePrefs(parsed.prefs), bests, daily };
}

/** Save-doc slot for a best record — '<size>' or '<size>:hard'. */
function bestSlot(size, variant) {
  return String(size) + (variant ? ':' + variant : '');
}

/** Save-doc slot for a day's daily record — the YYYYMMDD seed as a string. */
function dailySlot(date) {
  return String(dailySeed(date));
}

/**
 * Read the versioned save, migrating from the legacy layout once. Migration
 * is idempotent: with the versioned key present it just validates and returns.
 */
export function loadSave() {
  const existing = normalizeSave(readJson(SAVE_KEY, null));
  if (existing) return existing;
  return migrateLegacy();
}

function migrateLegacy() {
  const legacyPrefs = readJson(PREFS_KEY, null);
  const bests = {};
  const daily = {};
  const staleKeys = [PREFS_KEY];
  for (const size of SIZES) {
    for (const variant of [null, 'hard']) {
      const key = bestKey(size, variant);
      staleKeys.push(key);
      const clean = sanitizeRecord(readJson(key, null));
      if (clean) bests[bestSlot(size, variant)] = clean;
    }
  }
  for (const key of storage.keysWithPrefix(DAILY_PREFIX)) {
    staleKeys.push(key);
    const clean = sanitizeRecord(readJson(key, null));
    if (clean) daily[key.slice(DAILY_PREFIX.length)] = clean;
  }
  const save = { version: SAVE_VERSION, prefs: normalizePrefs(legacyPrefs), bests, daily };
  // Only drop the legacy keys once the migrated save is durably written.
  if (writeJson(SAVE_KEY, save)) {
    for (const key of staleKeys) storage.removeItem(key);
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

export function loadPrefs() {
  return loadSave().prefs;
}

export function savePrefs(prefs) {
  const save = loadSave();
  save.prefs = normalizePrefs(prefs);
  persist(save);
}

export function loadBest(size, variant) {
  return loadSave().bests[bestSlot(size, variant)] || null;
}

/** Fold a finished run into a size's best. Returns `{ best, newTime, newMoves }`. */
export function saveBest(size, timeMs, moves, variant) {
  const save = loadSave();
  const slot = bestSlot(size, variant);
  const folded = mergeRecord(save.bests[slot] || null, timeMs, moves);
  save.bests[slot] = folded.best;
  persist(save);
  return { best: folded.best, newTime: folded.newTime, newMoves: folded.newMoves };
}

/** One day's daily-challenge record ({timeMs, moves}) or null. */
export function loadDailyRecord(date) {
  return loadSave().daily[dailySlot(date)] || null;
}

/** Fold a finished run into the day's record. Returns `{ best, newTime, newMoves }`. */
export function saveDailyRecord(date, timeMs, moves) {
  const save = loadSave();
  const slot = dailySlot(date);
  const folded = mergeRecord(save.daily[slot] || null, timeMs, moves);
  save.daily[slot] = folded.best;
  persist(save);
  return { best: folded.best, newTime: folded.newTime, newMoves: folded.newMoves };
}
