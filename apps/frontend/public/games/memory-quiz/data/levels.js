/**
 * ============================================================================
 * Memory Quiz — data/levels.js (upgrade architecture §4.1)
 * ============================================================================
 * The level ladder as pure data. A level descriptor is a complete,
 * self-contained spec of one board + its questions; the engine reads specs
 * and never counts levels. Levels are shown as NUMBERS (1, 2, 3…) with lock
 * icons — never difficulty names.
 *
 * Campaign = 30 levels in three bands of ten:
 *   1–10   Easy   — 4 blocks  (2×2, grid fully filled)
 *   11–20  Medium — 6 blocks  (3×2)
 *   21–30  Hard   — 8 blocks  (4×2)
 * Grids are **exactly filled** (`items === cols × rows`) — no blank filler
 * cells in play; missing questions still open a temporary socket, which is
 * the question, not layout. Within a band the memorize window shrinks and
 * the question mix escalates, so every level plays differently.
 *
 * Progression is strictly sequential: level N+1 stays locked until level N
 * is completed (≥ 1 star). Level ids are stable strings — storage keys and
 * share text reference them, never array positions.
 * ============================================================================
 */
import { MEMORIZE_FLOOR_S, QUESTION_FLOOR_S, MAX_CELLS, spareNeed } from '../core.js';
import { QUESTION_TYPES } from './questions.js';

/**
 * Structural validation + clamping for one level descriptor. Throws on a
 * malformed level (a data bug must fail fast, not mid-run — plan §7.8) and
 * returns a frozen copy with floors applied.
 */
export function normalizeLevel(level) {
  const where = 'normalizeLevel(' + (level && level.id) + '): ';
  if (!level || typeof level !== 'object') throw new Error(where + 'not an object');
  if (typeof level.id !== 'string' || !level.id) throw new Error(where + 'id required');
  const cols = level.cols;
  const rows = level.rows;
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 2 || rows < 2) {
    throw new Error(where + 'grid must be integers ≥ 2');
  }
  const cells = cols * rows;
  if (cells > MAX_CELLS) throw new Error(where + cells + ' cells exceeds MAX_CELLS ' + MAX_CELLS);
  if (!Number.isInteger(level.items) || level.items < 4)
    throw new Error(where + 'items must be ≥ 4');
  if (level.items !== cells) {
    throw new Error(where + 'grid must be exactly filled (items === cols×rows — no blank cells)');
  }
  if (!Array.isArray(level.questions) || level.questions.length === 0) {
    throw new Error(where + 'questions required');
  }
  for (const entry of level.questions) {
    if (!entry || typeof entry.type !== 'string' || !entry.type)
      throw new Error(where + 'question type required');
    if (!Number.isInteger(entry.count) || entry.count < 1)
      throw new Error(where + 'question count must be ≥ 1');
    if (!QUESTION_TYPES[entry.type])
      throw new Error(where + 'unknown question type "' + entry.type + '"');
  }
  const candidates = Number.isInteger(level.candidates) ? level.candidates : 3;
  if (candidates < 3) throw new Error(where + 'candidates must be ≥ 3');
  if (level.questions.some((q) => q.type === 'oddOne') && candidates < 4) {
    throw new Error(where + 'oddOne needs candidates ≥ 4');
  }
  const memorizeS = Math.max(MEMORIZE_FLOOR_S, level.memorizeS);
  const questionS = Math.max(QUESTION_FLOOR_S, level.questionS);
  const p = level.points || { base: 100, streakBonus: 20, cap: 300 };
  if (!Number.isInteger(p.base) || p.base < 1) throw new Error(where + 'points.base must be ≥ 1');
  if (!Number.isInteger(p.streakBonus) || p.streakBonus < 0)
    throw new Error(where + 'points.streakBonus must be ≥ 0');
  if (!Number.isInteger(p.cap) || p.cap < p.base)
    throw new Error(where + 'points.cap must be ≥ base');
  return Object.freeze({
    id: level.id,
    label: level.label || level.id,
    cols,
    rows,
    items: level.items,
    questions: level.questions.map((q) => Object.freeze({ type: q.type, count: q.count })),
    candidates,
    memorizeS,
    questionS,
    points: Object.freeze({ base: p.base, streakBonus: p.streakBonus, cap: p.cap }),
    rules: Object.freeze({ ...(level.rules || {}) }),
    unlock: level.unlock ? Object.freeze({ ...level.unlock }) : null,
  });
}

/** Spare sanity vs the registry + structural lint for the whole ladder. */
export function lintLevels(levels) {
  const ids = new Set();
  for (const level of levels) {
    normalizeLevel(level);
    if (ids.has(level.id)) throw new Error('lintLevels: duplicate level id "' + level.id + '"');
    ids.add(level.id);
    spareNeed(level, QUESTION_TYPES); // throws on unknown types
  }
  return true;
}

/* ---- the curated campaign (30 levels = Easy 1–10 / Medium 11–20 / Hard 21–30) */
/* Pack size is 14 (data/packs.js): every row keeps items + spares ≤ 14 —
   missing eats candidates − 1 spares, odd-one eats 1 (lintPacks enforces).
   Grids are fully filled — no blank blocks on screen. */
const band = (n) => 'Level ' + n;

export const LEVELS = Object.freeze(
  [
    /* ---- Easy · 4 blocks (2×2) ---- */
    {
      id: 'l01',
      label: band(1),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [{ type: 'where', count: 2 }],
      candidates: 3,
      memorizeS: 8,
      questionS: 10,
      unlock: null,
    },
    {
      id: 'l02',
      label: band(2),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [
        { type: 'where', count: 1 },
        { type: 'missing', count: 1 },
      ],
      candidates: 3,
      memorizeS: 7.5,
      questionS: 10,
      unlock: { levelId: 'l01', stars: 1 },
    },
    {
      id: 'l03',
      label: band(3),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [{ type: 'where', count: 2 }],
      candidates: 3,
      memorizeS: 7,
      questionS: 10,
      unlock: { levelId: 'l02', stars: 1 },
    },
    {
      id: 'l04',
      label: band(4),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [
        { type: 'missing', count: 1 },
        { type: 'swap', count: 1 },
      ],
      candidates: 3,
      memorizeS: 6.5,
      questionS: 10,
      unlock: { levelId: 'l03', stars: 1 },
    },
    {
      id: 'l05',
      label: band(5),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [
        { type: 'where', count: 1 },
        { type: 'missing', count: 1 },
        { type: 'oddOne', count: 1 },
      ],
      candidates: 4,
      memorizeS: 6,
      questionS: 10,
      unlock: { levelId: 'l04', stars: 1 },
    },
    {
      id: 'l06',
      label: band(6),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [{ type: 'where', count: 2 }],
      candidates: 3,
      memorizeS: 6,
      questionS: 10,
      unlock: { levelId: 'l05', stars: 1 },
    },
    {
      id: 'l07',
      label: band(7),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [
        { type: 'where', count: 1 },
        { type: 'missing', count: 1 },
        { type: 'swap', count: 1 },
      ],
      candidates: 3,
      memorizeS: 5.5,
      questionS: 10,
      unlock: { levelId: 'l06', stars: 1 },
    },
    {
      id: 'l08',
      label: band(8),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [
        { type: 'where', count: 1 },
        { type: 'missing', count: 1 },
        { type: 'oddOne', count: 1 },
      ],
      candidates: 4,
      memorizeS: 5,
      questionS: 10,
      unlock: { levelId: 'l07', stars: 1 },
    },
    {
      id: 'l09',
      label: band(9),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 1 },
      ],
      candidates: 3,
      memorizeS: 5,
      questionS: 10,
      unlock: { levelId: 'l08', stars: 1 },
    },
    {
      id: 'l10',
      label: band(10),
      cols: 2,
      rows: 2,
      items: 4,
      questions: [
        { type: 'where', count: 1 },
        { type: 'missing', count: 1 },
        { type: 'swap', count: 1 },
        { type: 'oddOne', count: 1 },
      ],
      candidates: 4,
      memorizeS: 4.5,
      questionS: 10,
      unlock: { levelId: 'l09', stars: 1 },
    },

    /* ---- Medium · 6 blocks (3×2) ---- */
    {
      id: 'l11',
      label: band(11),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 1 },
      ],
      candidates: 3,
      memorizeS: 7,
      questionS: 10,
      unlock: { levelId: 'l10', stars: 1 },
    },
    {
      id: 'l12',
      label: band(12),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [
        { type: 'where', count: 1 },
        { type: 'missing', count: 1 },
        { type: 'swap', count: 1 },
      ],
      candidates: 3,
      memorizeS: 6.75,
      questionS: 10,
      unlock: { levelId: 'l11', stars: 1 },
    },
    {
      id: 'l13',
      label: band(13),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [{ type: 'where', count: 3 }],
      candidates: 3,
      memorizeS: 6.5,
      questionS: 10,
      unlock: { levelId: 'l12', stars: 1 },
    },
    {
      id: 'l14',
      label: band(14),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 1 },
        { type: 'oddOne', count: 1 },
      ],
      candidates: 4,
      memorizeS: 6.25,
      questionS: 10,
      unlock: { levelId: 'l13', stars: 1 },
    },
    {
      id: 'l15',
      label: band(15),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [
        { type: 'where', count: 1 },
        { type: 'missing', count: 2 },
      ],
      candidates: 3,
      memorizeS: 6,
      questionS: 10,
      unlock: { levelId: 'l14', stars: 1 },
    },
    {
      id: 'l16',
      label: band(16),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 1 },
        { type: 'swap', count: 1 },
      ],
      candidates: 3,
      memorizeS: 5.75,
      questionS: 10,
      unlock: { levelId: 'l15', stars: 1 },
    },
    {
      id: 'l17',
      label: band(17),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [
        { type: 'where', count: 1 },
        { type: 'missing', count: 1 },
        { type: 'swap', count: 1 },
        { type: 'oddOne', count: 1 },
      ],
      candidates: 4,
      memorizeS: 5.5,
      questionS: 10,
      unlock: { levelId: 'l16', stars: 1 },
    },
    {
      id: 'l18',
      label: band(18),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [
        { type: 'where', count: 3 },
        { type: 'missing', count: 1 },
      ],
      candidates: 3,
      memorizeS: 5.25,
      questionS: 10,
      unlock: { levelId: 'l17', stars: 1 },
    },
    {
      id: 'l19',
      label: band(19),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 2 },
      ],
      candidates: 3,
      memorizeS: 5,
      questionS: 10,
      unlock: { levelId: 'l18', stars: 1 },
    },
    {
      id: 'l20',
      label: band(20),
      cols: 3,
      rows: 2,
      items: 6,
      questions: [
        { type: 'where', count: 1 },
        { type: 'missing', count: 2 },
        { type: 'swap', count: 1 },
      ],
      candidates: 3,
      memorizeS: 4.75,
      questionS: 10,
      unlock: { levelId: 'l19', stars: 1 },
    },

    /* ---- Hard · 8 blocks (4×2) ---- */
    {
      id: 'l21',
      label: band(21),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 3 },
        { type: 'missing', count: 1 },
      ],
      candidates: 4,
      memorizeS: 5,
      questionS: 10,
      unlock: { levelId: 'l20', stars: 1 },
    },
    {
      id: 'l22',
      label: band(22),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 1 },
        { type: 'swap', count: 1 },
      ],
      candidates: 4,
      memorizeS: 4.8,
      questionS: 10,
      unlock: { levelId: 'l21', stars: 1 },
    },
    {
      id: 'l23',
      label: band(23),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 2 },
      ],
      candidates: 3,
      memorizeS: 4.6,
      questionS: 10,
      unlock: { levelId: 'l22', stars: 1 },
    },
    {
      id: 'l24',
      label: band(24),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 3 },
        { type: 'missing', count: 1 },
        { type: 'oddOne', count: 1 },
      ],
      candidates: 4,
      memorizeS: 4.4,
      questionS: 10,
      unlock: { levelId: 'l23', stars: 1 },
    },
    {
      id: 'l25',
      label: band(25),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 2 },
        { type: 'swap', count: 1 },
      ],
      candidates: 3,
      memorizeS: 4.2,
      questionS: 10,
      unlock: { levelId: 'l24', stars: 1 },
    },
    {
      id: 'l26',
      label: band(26),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 3 },
        { type: 'missing', count: 2 },
      ],
      candidates: 3,
      memorizeS: 4,
      questionS: 10,
      unlock: { levelId: 'l25', stars: 1 },
    },
    {
      id: 'l27',
      label: band(27),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 1 },
        { type: 'swap', count: 1 },
        { type: 'oddOne', count: 1 },
      ],
      candidates: 4,
      memorizeS: 3.8,
      questionS: 10,
      unlock: { levelId: 'l26', stars: 1 },
    },
    {
      id: 'l28',
      label: band(28),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 3 },
        { type: 'missing', count: 2 },
      ],
      candidates: 3,
      memorizeS: 3.6,
      questionS: 10,
      unlock: { levelId: 'l27', stars: 1 },
    },
    {
      id: 'l29',
      label: band(29),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 2 },
        { type: 'swap', count: 1 },
      ],
      candidates: 3,
      memorizeS: 3.4,
      questionS: 10,
      unlock: { levelId: 'l28', stars: 1 },
    },
    {
      id: 'l30',
      label: band(30),
      cols: 4,
      rows: 2,
      items: 8,
      questions: [
        { type: 'where', count: 2 },
        { type: 'missing', count: 2 },
        { type: 'swap', count: 1 },
      ],
      candidates: 3,
      memorizeS: 3.2,
      questionS: 10,
      unlock: { levelId: 'l29', stars: 1 },
    },
  ].map(normalizeLevel)
);

/**
 * The level at a 1-based ladder `position`. `source` 'campaign' clamps to the
 * curated rows (a level is one board); 'ladder' continues past the campaign
 * into the endless generator (endless/zen/hard/kids/time-attack/daily runs).
 */
export function levelFor(position, source = 'ladder') {
  const n = Math.max(1, Math.floor(position) || 1);
  if (source === 'campaign') return LEVELS[Math.min(n, LEVELS.length) - 1];
  return n <= LEVELS.length ? LEVELS[n - 1] : makeEndlessLevel(n);
}

/**
 * Endless ladder: deterministic per position (no rng — every player at
 * endless board 50 sees the same spec). Grids stay fully filled and rotate
 * through 8 / 9 / 12 blocks at the memorize floor; the mix keeps swap and
 * double-missing questions. Item counts respect the 14-item packs' spare
 * budget (12 + 2 is the worst case).
 */
export function makeEndlessLevel(position) {
  const k = position - LEVELS.length; // steps beyond the curated rows
  if (k <= 0) return LEVELS[position - 1];
  const grids = [
    { cols: 4, rows: 2 }, // 8 blocks
    { cols: 3, rows: 3 }, // 9 blocks
    { cols: 4, rows: 3 }, // 12 blocks
  ];
  const grid = grids[(k - 1) % grids.length];
  const mix =
    k % 2 === 1
      ? [
          { type: 'where', count: 3 },
          { type: 'missing', count: 1 },
          { type: 'swap', count: 1 },
        ]
      : [
          { type: 'where', count: 2 },
          { type: 'missing', count: 2 },
          { type: 'swap', count: 1 },
        ];
  return normalizeLevel({
    id: 'endless-' + position,
    label: 'Endless ' + position,
    cols: grid.cols,
    rows: grid.rows,
    items: grid.cols * grid.rows, // fully filled — no blank cells
    questions: mix,
    candidates: 3,
    memorizeS: MEMORIZE_FLOOR_S,
    questionS: 8,
    points: { base: 100, streakBonus: 20, cap: 300 },
    rules: { endless: true },
    unlock: null,
  });
}

/** Id of the level after `levelId` in the campaign, or null at the end. */
export function nextLevelId(levelId) {
  const i = LEVELS.findIndex((l) => l.id === levelId);
  return i >= 0 && i + 1 < LEVELS.length ? LEVELS[i + 1].id : null;
}

/**
 * Unlock check (plan §4.5): a level is open when it has no prerequisite, its
 * prerequisite level holds the required stars, or a host override opens it
 * (`opts.unlockAll` or `opts.grants[levelId]`). Derived from records — there
 * is no stored unlock map to fall out of sync.
 */
export function levelUnlocked(level, records, opts = {}) {
  if (opts.unlockAll) return true;
  if (opts.grants && opts.grants[level.id]) return true;
  if (!level.unlock) return true;
  const stars = (records[level.unlock.levelId] && records[level.unlock.levelId].stars) || 0;
  return stars >= (level.unlock.stars || 1);
}
