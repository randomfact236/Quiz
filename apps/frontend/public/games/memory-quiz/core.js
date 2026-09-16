/**
 * ============================================================================
 * Memory Quiz — core.js (Game 08, upgrade architecture §16)
 * ============================================================================
 * Pure model, zero DOM access — this module is the test surface. Plain ESM,
 * no build step: game.js imports it in the browser; the jest suite
 * (src/__tests__/games-memory-quiz.test.ts) and the folder's core.test.html
 * harness import it directly.
 *
 * Since the 08-memory-quiz.md Part II upgrade pass (§13–§21), the engine is **spec-driven**:
 * boards and questions are built from a level descriptor (`data/levels.js`)
 * and a question-type registry (`data/questions.js`) that the caller injects.
 * core.js owns only mechanics: rng, board construction, question composition,
 * scoring math, lint, percentile helpers. It hardcodes no level count, no
 * question mix and no question type.
 *
 * Board   = { cells: (item|null)[], items: [item], pack }   (item: {emoji, name:{en}})
 * Level   = { id, cols, rows, items, questions: [{type,count}], candidates,
 *             memorizeS, questionS, points:{base,streakBonus,cap}, rules, … }
 * ============================================================================
 */

/* ---- floors & caps (enforced by data/levels.js normalizeLevel) ------------- */

/** Memorize countdown never shrinks below this, on any level or mode. */
export const MEMORIZE_FLOOR_S = 3;
/** Answer window never shrinks below this. */
export const QUESTION_FLOOR_S = 3;
/** Hard cell-count cap for the DOM renderer (plan §4.7; canvas seam beyond). */
export const MAX_CELLS = 40;

/** Transient overlay timings (plan §2 — not level data). */
export const FEEDBACK_MS = 400;
export const FEEDBACK_BLANK_MS = 250;

/* ---- daily (plan §5: per-day record key) ------------------------------------ */

/** YYYYMMDD number of a Date — the daily board's identity + rng seed. */
export function dailySeed(date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/** Prefix of one day's daily record key. */
export const DAILY_PREFIX = 'game:memory-quiz:daily:';

/** Storage key of one day's daily record, from a Date. */
export function dailyKey(date) {
  return DAILY_PREFIX + dailySeed(date);
}

/* ---- rng ------------------------------------------------------------------- */

/**
 * Deterministic 32-bit rng (mulberry32). Boards and questions take it
 * injected, so a fixed seed — the daily's date — replays the exact same run
 * for every player.
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Partial Fisher–Yates: returns the first `count` picks of a shuffled copy.
 * Exported for the question-type registry (data/questions.js), which shares
 * the same seeded stream so whole boards replay deterministically.
 */
export function sampleWith(rng, list, count) {
  const pool = list.slice();
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, n);
}

/** Fisher–Yates copy with shuffled order (registry helper, see sampleWith). */
export function shuffleWith(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Bounded restarts before generation gives up and throws (plan §7.8). */
const MAX_GENERATION_ATTEMPTS = 20;

/**
 * Build a board from a level spec: `level.items` distinct items from the
 * pack placed on random cells of the `level.cols × level.rows` grid. Rng via
 * `seed` — the same seed always yields the same board. The pack rides on the
 * result so the question registry can draw spare items from it.
 */
export function buildBoard(pack, level, seed) {
  const cellCount = level.cols * level.rows;
  const itemCount = level.items;
  const rng = mulberry32(seed);
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const items = sampleWith(rng, pack.items, itemCount);
    const slots = sampleWith(
      rng,
      Array.from({ length: cellCount }, (_, i) => i),
      itemCount
    );
    if (items.length < itemCount || slots.length < itemCount) continue; // malformed — retry, then throw
    const cells = new Array(cellCount).fill(null);
    for (let i = 0; i < itemCount; i++) cells[slots[i]] = items[i];
    return { cells, items, pack };
  }
  throw new Error(
    'buildBoard: pack "' +
      pack.id +
      '" cannot fill level "' +
      level.id +
      '" — lintLevels should have caught this'
  );
}

/**
 * Compose a board's questions in answer order. The level's `questions` list
 * (`[{ type, count }]`) is expanded to jobs; each job consumes distinct
 * items — on-board items for registry types with `needs: 'boardItem'`
 * (`boardItems` says how many a single question needs — the swap exchange
 * takes two), off-board spares for `needs: 'spareItem'` — and the type's own
 * `build()` produces the question, declaring what it consumed via
 * `q.consumes` (emoji list). The registry comes in as `types` so core.js
 * stays free of question-type knowledge. A shared off-board pool keeps a
 * level's questions from colliding on the same spare (a missing-question
 * distractor is never another question's answer). Deterministic under a
 * fixed rng.
 */
export function pickQuestions(board, level, rng, types) {
  const jobs = [];
  for (const entry of level.questions) {
    if (!types[entry.type]) {
      throw new Error(
        'pickQuestions: unknown question type "' + entry.type + '" (level "' + level.id + '")'
      );
    }
    for (let i = 0; i < entry.count; i++) jobs.push(entry.type);
  }
  const onBoard = new Set(board.items.map((it) => it.emoji));
  const spares = (board.pack ? board.pack.items : []).filter((it) => !onBoard.has(it.emoji));
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const boardItemJobs = jobs.filter((id) => types[id].needs === 'boardItem');
    const spareJobs = jobs.filter((id) => types[id].needs === 'spareItem');
    const demand = boardItemJobs.reduce((sum, id) => sum + (types[id].boardItems || 1), 0);
    const pickedItems = sampleWith(rng, board.items, demand);
    const pickedSpares = sampleWith(rng, spares, spareJobs.length);
    if (pickedItems.length < demand || pickedSpares.length < spareJobs.length) continue;
    const questions = [];
    const used = new Set();
    let bi = 0;
    let si = 0;
    let ok = true;
    for (const id of jobs) {
      const t = types[id];
      const count = t.boardItems || 1;
      const item = t.needs === 'spareItem' ? pickedSpares[si++] : pickedItems[bi];
      const extraItems = t.needs === 'boardItem' ? pickedItems.slice(bi + 1, bi + count) : [];
      bi += count;
      const q = t.build({ board, level, item, extraItems, rng });
      if (!q) {
        ok = false; // e.g. a swap with no partner available — retry, then throw
        break;
      }
      for (const emoji of q.consumes || [q.item.emoji]) {
        if (used.has(emoji)) {
          ok = false; // composer double-booking is a data bug — retry, then throw
          break;
        }
        used.add(emoji);
      }
      if (!ok) break;
      questions.push(q);
    }
    if (!ok) continue;
    return shuffleWith(rng, questions);
  }
  throw new Error(
    'pickQuestions: level "' + level.id + '" generation failed — lintLevels should have caught this'
  );
}

/* ---- scoring ---------------------------------------------------------------- */

/**
 * Points for one hit: `base + streakBonus × (streak − 1)`, capped at `cap`
 * (all from the level spec — core hardcodes no numbers). If the level opts
 * into `rules.timeBonus`, remaining answer time pays `+timeBonusPerSecond ×
 * whole seconds left`, added after the cap so fast play always pays.
 */
export function pointsFor(level, streak, timeLeftMs = 0) {
  const p = level.points || { base: 100, streakBonus: 20, cap: 300 };
  const s = Math.max(1, Math.floor(streak) || 1);
  const base = Math.min(p.cap, p.base + p.streakBonus * (s - 1));
  const perSecond = (level.rules && level.rules.timeBonusPerSecond) || 0;
  return base + perSecond * Math.floor(Math.max(0, timeLeftMs) / 1000);
}

/**
 * Stars for a finished campaign level: 3 = perfect (no hearts lost), 2 = one
 * lost, 1 = cleared with more damage, 0 = failed. Failure is the caller's
 * `cleared: false`.
 */
export function starsFor(heartsLost, cleared) {
  if (!cleared) return 0;
  return heartsLost <= 0 ? 3 : heartsLost === 1 ? 2 : 1;
}

/* ---- countdown + percentile helpers ----------------------------------------- */

/** Seconds left for the banner/ring, counting up the last second ("8"…"0"). */
export function formatCountdown(msLeft) {
  return String(Math.max(0, Math.ceil(msLeft / 1000)));
}

/**
 * Local top-% for the end screen (game 01's contract): with a real history
 * (≥5 runs), the top-% implied by the share of past runs the current score
 * beats; otherwise a baked-in score→top-% curve. Local only — no backend.
 */
export function localPercentile(score, pastScores) {
  if (Array.isArray(pastScores) && pastScores.length >= 5) {
    const beaten = pastScores.filter((s) => s < score).length;
    const beatenPct = Math.round((beaten / pastScores.length) * 100);
    return Math.min(99, Math.max(1, 100 - beatenPct));
  }
  return bakedPercentile(score);
}

const BAKED_TABLE = [
  [3000, 3],
  [1800, 8],
  [1000, 15],
  [600, 25],
  [300, 40],
];

export function bakedPercentile(score) {
  for (const [min, topPct] of BAKED_TABLE) {
    if (score >= min) return topPct;
  }
  return 50;
}

/* ---- content lint ------------------------------------------------------------ */

/** Locales every pack must name its items in (grows with config.strings). */
export const LOCALES = ['en'];

/**
 * Validate content packs (plan §8 contract, level-aware): unique emoji +
 * per-locale names per pack, and enough off-board spares for **every level's
 * worst demand** — spare demand comes from the registry's `spareCost`
 * metadata (a missing-question eats `candidates − 1` distractors, an odd-one
 * eats its answer; where/swap eat none). `levels`/`types` may be omitted for
 * a legacy shape-only check. Throws with a precise message; returns true.
 */
export function lintPacks(packs, levels = null, types = null) {
  if (!Array.isArray(packs) || packs.length === 0) throw new Error('lintPacks: no packs');
  const ids = new Set();
  for (const pack of packs) {
    if (!pack || typeof pack !== 'object') throw new Error('lintPacks: pack is not an object');
    if (!pack.id || typeof pack.id !== 'string') throw new Error('lintPacks: pack without id');
    if (ids.has(pack.id)) throw new Error('lintPacks: duplicate pack id "' + pack.id + '"');
    ids.add(pack.id);
    if (!Array.isArray(pack.items) || pack.items.length < 8) {
      throw new Error('lintPacks: pack "' + pack.id + '" needs at least 8 items');
    }
    const emojis = new Set();
    const names = LOCALES.map(() => new Set());
    for (const item of pack.items) {
      if (!item || typeof item !== 'object')
        throw new Error('lintPacks: ' + pack.id + ' has a non-object item');
      if (!item.emoji || typeof item.emoji !== 'string') {
        throw new Error('lintPacks: ' + pack.id + ' has an item without emoji');
      }
      if (emojis.has(item.emoji))
        throw new Error('lintPacks: ' + pack.id + ' has duplicate emoji ' + item.emoji);
      emojis.add(item.emoji);
      for (let l = 0; l < LOCALES.length; l++) {
        const name = item.name && item.name[LOCALES[l]];
        if (!name || typeof name !== 'string') {
          throw new Error(
            'lintPacks: ' + pack.id + ' item ' + item.emoji + ' lacks a ' + LOCALES[l] + ' name'
          );
        }
        if (names[l].has(name)) {
          throw new Error(
            'lintPacks: ' + pack.id + ' has duplicate ' + LOCALES[l] + ' name "' + name + '"'
          );
        }
        names[l].add(name);
      }
    }
    if (levels) {
      for (const level of levels) {
        const need = spareNeed(level, types);
        if (pack.items.length - level.items < need) {
          throw new Error(
            'lintPacks: pack "' +
              pack.id +
              '" lacks spares for level "' +
              level.id +
              '" (has ' +
              pack.items.length +
              ' items, level places ' +
              level.items +
              ' and needs ' +
              need +
              ' spares)'
          );
        }
      }
    }
  }
  return true;
}

/**
 * Off-board spare items a level consumes across one board: each question
 * entry costs `types[type].spareCost(entry, level)` spares (0 for most
 * types). Core reads the metadata — it never names question types.
 */
export function spareNeed(level, types) {
  let need = 0;
  for (const entry of level.questions) {
    const t = types && types[entry.type];
    if (!t) {
      throw new Error(
        'spareNeed: unknown question type "' + entry.type + '" (level "' + level.id + '")'
      );
    }
    const cost = typeof t.spareCost === 'function' ? t.spareCost(entry, level) : t.spareCost || 0;
    need += cost * entry.count;
  }
  return need;
}

/** Item name for the active locale, English fallback, then the emoji. */
export function itemName(item, locale) {
  if (!item) return '';
  const name = item.name && (item.name[locale] || item.name.en);
  return name || item.emoji;
}
