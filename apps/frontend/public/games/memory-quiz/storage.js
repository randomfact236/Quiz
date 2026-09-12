/**
 * ============================================================================
 * Memory Quiz — storage.js (Game 08, guarded persistence facade — save v2)
 * ============================================================================
 * Rev 2 pattern (plan/games/08-memory-quiz-upgrade.md §4.4): one versioned
 * save document plus per-day daily record keys, with a remote adapter slot a
 * host can inject for future account sync.
 *
 * Local-first contract: every call is try/catch guarded, works in private
 * mode (persistence silently skipped), and NEVER touches the network unless a
 * host has explicitly injected a remote adapter. The game never checks auth —
 * guests keep full local persistence.
 *
 * Layout (v2 — the level upgrade):
 *   game:memory-quiz:save → {
 *     version: 2,
 *     best:    { score, bestStreak },                     // global (ladder runs)
 *     levels:  { '<id>': { best: {score, bestStreak}, stars, clears } },
 *     history: [{ score, boards, ts, mode, level } …max 20],
 *     prefs:   { muted, pack, mode, levelId },
 *   }
 *   game:memory-quiz:daily:<yyyymmdd> → { score }
 *
 * Unlocks are DERIVED from `levels[id].stars` + host grants (data/levels.js
 * levelUnlocked) — no stored unlock map to fall out of sync (a deliberate
 * simplification of the upgrade doc's §4.4 sketch).
 *
 * v1 saves ({version:1, best, history, prefs}) are migrated on first read
 * (migrateV1) and rewritten as v2 on the next persist — nothing is lost.
 * ============================================================================
 */
import { dailyKey } from './core.js';
import { DEFAULT_PACK_ID } from './data/packs.js';
import { MODES } from './data/modes.js';

export const SAVE_KEY = 'game:memory-quiz:save';

const SAVE_VERSION = 2;

/** History keeps the last 20 runs (plan §5). */
const HISTORY_CAP = 20;

let remoteAdapter = null;

/** Storage that degrades to an in-memory object when localStorage is unavailable. */
const storage = (() => {
  const fallback = {};
  function backend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const probe = '__mq_probe__';
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

/** A non-negative integer, or null. */
function count(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : null;
}

/** Shape-checked best record; null for anything else. */
function sanitizeBest(rec) {
  if (!rec || typeof rec !== 'object') return null;
  const score = count(rec.score);
  const bestStreak = count(rec.bestStreak);
  return score === null || bestStreak === null ? null : { score, bestStreak };
}

/** Shape-checked history entry (mode/level are v2 tags; v1 entries lack them). */
function sanitizeRun(rec) {
  if (!rec || typeof rec !== 'object') return null;
  const score = count(rec.score);
  const boards = count(rec.boards);
  const ts = count(rec.ts);
  if (score === null || boards === null || ts === null) return null;
  return {
    score,
    boards,
    ts,
    mode: typeof rec.mode === 'string' ? rec.mode : '',
    level: typeof rec.level === 'string' ? rec.level : '',
  };
}

/** Shape-checked per-level record; null for anything else. */
function sanitizeLevelRecord(rec) {
  if (!rec || typeof rec !== 'object') return null;
  const best = sanitizeBest(rec.best);
  const stars = count(rec.stars);
  const clears = count(rec.clears);
  if (!best || stars === null || stars > 3 || clears === null) return null;
  return { best, stars: Math.min(3, stars), clears };
}

/** Menu prefs validated against known values (unknown → defaults). */
function normalizePrefs(raw) {
  const mode = raw && typeof raw.mode === 'string' && MODES[raw.mode] ? raw.mode : 'campaign';
  const levelId = raw && typeof raw.levelId === 'string' ? raw.levelId : '';
  return {
    muted: !!(raw && raw.muted === true),
    pack: raw && typeof raw.pack === 'string' && raw.pack ? raw.pack : DEFAULT_PACK_ID,
    mode,
    levelId,
  };
}

function freshSave() {
  return {
    version: SAVE_VERSION,
    best: { score: 0, bestStreak: 0 },
    levels: {},
    history: [],
    prefs: normalizePrefs(null),
  };
}

/** Shape-check a parsed v2 save; anything corrupt falls back to fresh. */
function normalizeSaveV2(parsed) {
  if (!parsed || typeof parsed !== 'object' || parsed.version !== SAVE_VERSION) return null;
  const levels = {};
  if (parsed.levels && typeof parsed.levels === 'object') {
    for (const [id, rec] of Object.entries(parsed.levels)) {
      const clean = sanitizeLevelRecord(rec);
      if (clean) levels[id] = clean;
    }
  }
  return {
    version: SAVE_VERSION,
    best: sanitizeBest(parsed.best) || { score: 0, bestStreak: 0 },
    levels,
    history: Array.isArray(parsed.history)
      ? parsed.history.map(sanitizeRun).filter(Boolean).slice(0, HISTORY_CAP)
      : [],
    prefs: normalizePrefs(parsed.prefs),
  };
}

/** Fold a v1 document into the v2 shape (global best kept, no level records). */
function migrateV1(parsed) {
  if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return null;
  const v2 = freshSave();
  v2.best = sanitizeBest(parsed.best) || { score: 0, bestStreak: 0 };
  v2.history = Array.isArray(parsed.history)
    ? parsed.history.map(sanitizeRun).filter(Boolean).slice(0, HISTORY_CAP)
    : [];
  v2.prefs = normalizePrefs(parsed.prefs); // v1 prefs lack mode/levelId → defaults
  return v2;
}

export function loadSave() {
  const parsed = readJson(SAVE_KEY, null);
  const v2 = normalizeSaveV2(parsed);
  if (v2) return v2;
  const migrated = migrateV1(parsed);
  if (migrated) {
    persist(migrated); // durably upgrade v1 → v2 on first read (idempotent)
    return migrated;
  }
  return freshSave();
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

/* ---- prefs ------------------------------------------------------------------ */

export function loadPrefs() {
  return loadSave().prefs;
}

export function savePrefs(prefs) {
  const save = loadSave();
  save.prefs = normalizePrefs(prefs);
  persist(save);
}

/* ---- global best + history (ladder runs) -------------------------------------- */

export function loadBest() {
  return loadSave().best;
}

/** The stored run history (last 20, newest first). */
export function loadHistory() {
  return loadSave().history;
}

/**
 * Fold a finished ladder run into the global best record and push it onto
 * the history (last 20 runs). `meta` carries { mode, level } tags (v2).
 * Returns `{ best, newBest }` — `newBest` is a strict score record.
 */
export function saveRunResult(score, bestStreak, boards, ts, meta = {}) {
  const save = loadSave();
  const runScore = count(score) ?? 0;
  const runStreak = count(bestStreak) ?? 0;
  const runBoards = count(boards) ?? 0;
  const runTs = count(ts) ?? 0;
  const prev = save.best;
  const newBest = runScore > prev.score;
  save.best = {
    score: Math.max(prev.score, runScore),
    bestStreak: Math.max(prev.bestStreak, runStreak),
  };
  save.history = [
    {
      score: runScore,
      boards: runBoards,
      ts: runTs,
      mode: typeof meta.mode === 'string' ? meta.mode : '',
      level: typeof meta.level === 'string' ? meta.level : '',
    },
    ...save.history,
  ].slice(0, HISTORY_CAP);
  persist(save);
  return { best: save.best, newBest };
}

/* ---- per-level records (campaign, plan §4.4) ------------------------------------ */

export function loadLevelRecords() {
  return loadSave().levels;
}

export function loadLevelRecord(levelId) {
  return loadSave().levels[levelId] || null;
}

/**
 * Fold a finished campaign level: best score + best streak each hold their
 * maximum, stars take the maximum, clears increment. Returns
 * `{ record, newBest, newStars }`.
 */
export function saveLevelResult(levelId, score, bestStreak, stars) {
  const save = loadSave();
  const runScore = count(score) ?? 0;
  const runStreak = count(bestStreak) ?? 0;
  const runStars = Math.min(3, count(stars) ?? 0);
  const prev = save.levels[levelId] || { best: { score: 0, bestStreak: 0 }, stars: 0, clears: 0 };
  const record = {
    best: {
      score: Math.max(prev.best.score, runScore),
      bestStreak: Math.max(prev.best.bestStreak, runStreak),
    },
    stars: Math.max(prev.stars, runStars),
    clears: prev.clears + 1,
  };
  save.levels[levelId] = record;
  persist(save);
  return { record, newBest: runScore > prev.best.score, newStars: runStars > prev.stars };
}

/* ---- daily (plan §5: per-day record key) --------------------------------------- */

/** One day's best score, or null when that day was not played. */
export function loadDailyRecord(date) {
  const rec = readJson(dailyKey(date), null);
  const score = rec && count(rec.score);
  return score === null || score === undefined ? null : { score };
}

/** Fold a finished daily run into the day's record (score maximum). */
export function saveDailyRecord(date, score) {
  const key = dailyKey(date);
  const prev = loadDailyRecord(date);
  const next = { score: Math.max(prev ? prev.score : 0, count(score) ?? 0) };
  writeJson(key, next);
  return next;
}

/** Host-injected account-sync seam. Adapter shape: `{ save(saveObj) }`. */
export function setRemoteAdapter(adapter) {
  remoteAdapter = adapter && typeof adapter.save === 'function' ? adapter : null;
}
