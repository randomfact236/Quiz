/**
 * Pure-logic tests for the static game at
 * public/games/memory-quiz/ (plan/games/08-memory-quiz.md §8 + the upgrade
 * architecture in 08-memory-quiz-upgrade.md). The pure model lives in the
 * game's core.js (spec-driven), the level ladder in data/levels.js, the
 * question-type registry in data/questions.js, modes in data/modes.js,
 * persistence in storage.js (save v2 + v1 migration) and the config/flag
 * chain in config.js. The same core assertions ship in the folder's
 * core.test.html harness; this suite keeps them running in CI.
 */
import {
  DAILY_PREFIX,
  MAX_CELLS,
  MEMORIZE_FLOOR_S,
  QUESTION_FLOOR_S,
  bakedPercentile,
  buildBoard,
  dailyKey,
  dailySeed,
  formatCountdown,
  itemName,
  lintPacks,
  localPercentile,
  mulberry32,
  pickQuestions,
  pointsFor,
  spareNeed,
  starsFor,
} from '../../public/games/memory-quiz/core';
import { PACKS } from '../../public/games/memory-quiz/data/packs';
import {
  LEVELS,
  levelFor,
  levelUnlocked,
  lintLevels,
  makeEndlessLevel,
  nextLevelId,
  normalizeLevel,
} from '../../public/games/memory-quiz/data/levels';
import { QUESTION_TYPES } from '../../public/games/memory-quiz/data/questions';
import { MODES, MODE_ORDER, modeById, rulesFor } from '../../public/games/memory-quiz/data/modes';
import {
  SAVE_KEY,
  loadBest,
  loadDailyRecord,
  loadHistory,
  loadLevelRecord,
  loadLevelRecords,
  loadPrefs,
  loadSave,
  saveDailyRecord,
  saveLevelResult,
  savePrefs,
  saveRunResult,
  setRemoteAdapter,
} from '../../public/games/memory-quiz/storage';
import { GAME_CONFIG, resolveConfig, t } from '../../public/games/memory-quiz/config';

/* ==========================================================================
 * Level ladder (Phase A)
 * ========================================================================== */

describe('level ladder (data/levels.js)', () => {
  it('lintLevels accepts the shipped campaign', () => {
    expect(lintLevels(LEVELS)).toBe(true);
    expect(LEVELS).toHaveLength(30);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(30);
    expect(LEVELS[0].unlock).toBeNull();
  });

  it('every level holds its structural invariants', () => {
    for (const level of LEVELS) {
      const cells = level.cols * level.rows;
      expect(cells).toBeLessThanOrEqual(MAX_CELLS);
      expect(level.items).toBeGreaterThanOrEqual(4);
      expect(level.items).toBe(cells); // fully filled — no blank cells in play
      expect(level.memorizeS).toBeGreaterThanOrEqual(MEMORIZE_FLOOR_S);
      expect(level.questionS).toBeGreaterThanOrEqual(QUESTION_FLOOR_S);
      // spare budget against the 14-item packs
      expect(level.items + spareNeed(level, QUESTION_TYPES)).toBeLessThanOrEqual(14);
    }
  });

  it('campaign bands: Easy 1-10 = 4 blocks, Medium 11-20 = 6, Hard 21-30 = 8', () => {
    expect(LEVELS[0]).toMatchObject({ cols: 2, rows: 2, items: 4, memorizeS: 8 });
    expect(LEVELS[9]).toMatchObject({ cols: 2, rows: 2, items: 4, memorizeS: 4.5 });
    expect(LEVELS[10]).toMatchObject({ cols: 3, rows: 2, items: 6, memorizeS: 7 });
    expect(LEVELS[19]).toMatchObject({ cols: 3, rows: 2, items: 6, memorizeS: 4.75 });
    expect(LEVELS[20]).toMatchObject({ cols: 4, rows: 2, items: 8, memorizeS: 5 });
    expect(LEVELS[29]).toMatchObject({ cols: 4, rows: 2, items: 8, memorizeS: 3.2 });
    // strictly sequential unlocks across band boundaries too
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].unlock).toMatchObject({ levelId: LEVELS[i - 1].id, stars: 1 });
    }
  });

  it('normalizeLevel rejects malformed levels', () => {
    expect(() => normalizeLevel({ id: 'x' })).toThrow();
    expect(() =>
      normalizeLevel({
        id: 'x',
        cols: 1,
        rows: 2,
        items: 2,
        questions: [{ type: 'where', count: 1 }],
        memorizeS: 5,
        questionS: 5,
      })
    ).toThrow(/grid/);
    expect(() =>
      normalizeLevel({
        id: 'x',
        cols: 3,
        rows: 2,
        items: 6,
        questions: [{ type: 'nope', count: 1 }],
        memorizeS: 5,
        questionS: 5,
      })
    ).toThrow(/unknown question type/);
    expect(() =>
      normalizeLevel({
        id: 'x',
        cols: 3,
        rows: 2,
        items: 5,
        questions: [{ type: 'where', count: 1 }],
        memorizeS: 5,
        questionS: 5,
      })
    ).toThrow(/exactly filled/);
    expect(() =>
      normalizeLevel({
        id: 'x',
        cols: 4,
        rows: 2,
        items: 8,
        questions: [{ type: 'swap', count: 1 }],
        memorizeS: 5,
        questionS: 5,
      })
    ).not.toThrow(); // full grids: swap is an exchange, no empty cell needed
    expect(() =>
      normalizeLevel({
        id: 'x',
        cols: 3,
        rows: 2,
        items: 6,
        questions: [{ type: 'oddOne', count: 1 }],
        candidates: 3,
        memorizeS: 5,
        questionS: 5,
      })
    ).toThrow(/candidates ≥ 4/);
    expect(() =>
      normalizeLevel({
        id: 'x',
        cols: 3,
        rows: 2,
        items: 6,
        questions: [{ type: 'where', count: 1 }],
        memorizeS: 1,
        questionS: 5,
      })
    ).not.toThrow(); // floors are clamped, not rejected
  });

  it('levelFor resolves campaign clamping and the endless ladder', () => {
    expect(levelFor(1, 'campaign').id).toBe('l01');
    expect(levelFor(99, 'campaign').id).toBe('l30'); // campaign clamps
    expect(levelFor(1, 'ladder').id).toBe('l01');
    expect(levelFor(30, 'ladder').id).toBe('l30');
    expect(levelFor(31, 'ladder').id).toBe('endless-31');
    expect(levelFor(0, 'ladder').id).toBe('l01'); // position floor
  });

  it('makeEndlessLevel is deterministic and stays within every cap', () => {
    for (const position of [31, 32, 45, 75, 99]) {
      const a = makeEndlessLevel(position);
      const b = makeEndlessLevel(position);
      expect(a).toEqual(b);
      expect(a.items).toBe(a.cols * a.rows); // fully filled
      expect(a.cols * a.rows).toBeLessThanOrEqual(MAX_CELLS);
      expect(a.items + spareNeed(a, QUESTION_TYPES)).toBeLessThanOrEqual(14);
      expect(a.memorizeS).toBeGreaterThanOrEqual(MEMORIZE_FLOOR_S);
      expect(a.questionS).toBeGreaterThanOrEqual(QUESTION_FLOOR_S);
    }
    expect(makeEndlessLevel(31).id).toBe('endless-31');
  });

  it('starsFor: perfect → 3, one heart → 2, cleared → 1, failed → 0', () => {
    expect(starsFor(0, true)).toBe(3);
    expect(starsFor(1, true)).toBe(2);
    expect(starsFor(2, true)).toBe(1);
    expect(starsFor(3, false)).toBe(0);
  });

  it('levelUnlocked derives from stars, grants and the unlock-all override', () => {
    const l02 = LEVELS[1];
    expect(levelUnlocked(l02, {}, {})).toBe(false);
    expect(
      levelUnlocked(l02, { l01: { best: { score: 1, bestStreak: 1 }, stars: 1, clears: 1 } }, {})
    ).toBe(true);
    expect(levelUnlocked(l02, {}, { unlockAll: true })).toBe(true);
    expect(levelUnlocked(l02, {}, { grants: { l02: true } })).toBe(true);
    expect(levelUnlocked(LEVELS[0], {}, {})).toBe(true); // first level is open
  });

  it('nextLevelId walks the campaign and ends at l12', () => {
    expect(nextLevelId('l01')).toBe('l02');
    expect(nextLevelId('l11')).toBe('l12');
    expect(nextLevelId('l29')).toBe('l30');
    expect(nextLevelId('l30')).toBeNull();
    expect(nextLevelId('nope')).toBeNull();
  });
});

/* ==========================================================================
 * Question-type registry + composer (Phase B)
 * ========================================================================== */

describe('question-type registry (data/questions.js)', () => {
  it('exposes the four shipped types with valid metadata', () => {
    expect(Object.keys(QUESTION_TYPES).sort()).toEqual(['missing', 'oddOne', 'swap', 'where']);
    for (const type of Object.values(QUESTION_TYPES)) {
      expect(['boardItem', 'spareItem']).toContain(type.needs);
      expect(['grid', 'candidates']).toContain(type.answerUi);
      // the full plugin contract — a missing member breaks the shell at runtime
      for (const member of [
        'build',
        'banner',
        'candidates',
        'missMessage',
        'resolve',
        'truth',
        'invariants',
      ]) {
        expect(typeof (type as Record<string, unknown>)[member]).toBe('function');
      }
    }
    expect(QUESTION_TYPES.where.answerUi).toBe('grid');
    expect(QUESTION_TYPES.swap.answerUi).toBe('grid');
    expect(QUESTION_TYPES.missing.answerUi).toBe('candidates');
    expect(QUESTION_TYPES.oddOne.answerUi).toBe('candidates');
  });

  it('where resolves only its own cell', () => {
    const board = buildBoard(PACKS[0], LEVELS[0], 42);
    const questions = pickQuestions(board, LEVELS[0], mulberry32(1), QUESTION_TYPES);
    const q = questions[0];
    expect(
      QUESTION_TYPES.where.resolve(q, q.cell, { level: LEVELS[0], streak: 0, timeLeftMs: 0 })
    ).toEqual({
      outcome: 'hit',
      points: 100,
      heartsLost: 0,
    });
    expect(
      QUESTION_TYPES.where.resolve(q, (q.cell + 1) % board.cells.length, {
        level: LEVELS[0],
        streak: 0,
      }).outcome
    ).toBe('miss');
  });

  it('pointsFor honors the level spec, streak cap and time bonus', () => {
    const level = LEVELS[0]; // base 100, bonus 20, cap 300
    expect(pointsFor(level, 1)).toBe(100);
    expect(pointsFor(level, 2)).toBe(120);
    expect(pointsFor(level, 11)).toBe(300);
    expect(pointsFor(level, 50)).toBe(300);
    const timed = {
      ...level,
      points: { base: 100, streakBonus: 20, cap: 300 },
      rules: { timeBonusPerSecond: 5 },
    };
    expect(pointsFor(timed, 1, 7300)).toBe(135); // 100 + 5×7 (floor of 7.3 s)
  });

  it('swap is a two-item exchange and resolves only the destination', () => {
    const level = LEVELS[3]; // l04 has a swap
    for (let seed = 0; seed < 50; seed++) {
      const board = buildBoard(PACKS[0], level, seed);
      const questions = pickQuestions(board, level, mulberry32(seed + 100), QUESTION_TYPES);
      const swap = questions.find((q) => q.type === 'swap');
      if (!swap) continue;
      expect(() => QUESTION_TYPES.swap.invariants(board, swap)).not.toThrow();
      expect(swap.consumes).toEqual([swap.item.emoji, swap.partner.emoji]);
      expect(QUESTION_TYPES.swap.resolve(swap, swap.to, { level, streak: 0 }).outcome).toBe('hit');
      const other = board.cells.findIndex((_, i) => i !== swap.to);
      expect(QUESTION_TYPES.swap.resolve(swap, other, { level, streak: 0 }).outcome).toBe('miss');
      // the truth reveals both sides of the exchange
      expect(QUESTION_TYPES.swap.truth(swap)).toEqual([
        { cell: swap.to, item: swap.item, pulse: true },
        { cell: swap.from, item: swap.partner, pulse: false },
      ]);
      return;
    }
    throw new Error('no swap question generated in 50 seeds');
  });

  it('oddOne answers with the off-board spare among on-board distractors', () => {
    const level = LEVELS[4]; // l05 has an oddOne
    let seen = false;
    for (let seed = 0; seed < 50 && !seen; seed++) {
      const board = buildBoard(PACKS[seed % PACKS.length], level, seed);
      const questions = pickQuestions(board, level, mulberry32(seed + 7), QUESTION_TYPES);
      const odd = questions.find((q) => q.type === 'oddOne');
      if (!odd) continue;
      seen = true;
      expect(() => QUESTION_TYPES.oddOne.invariants(board, odd)).not.toThrow();
      expect(QUESTION_TYPES.oddOne.resolve(odd, odd.item, { level, streak: 0 }).outcome).toBe(
        'hit'
      );
      const onBoard = odd.candidates.find((c) => c.emoji !== odd.item.emoji)!;
      expect(QUESTION_TYPES.oddOne.resolve(odd, onBoard, { level, streak: 0 }).outcome).toBe(
        'miss'
      );
    }
    expect(seen).toBe(true);
  });
});

describe('composer invariants over every level × 100 seeds', () => {
  it('counts, distinctness, candidate rules and type invariants hold', () => {
    for (const level of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        const board = buildBoard(PACKS[seed % PACKS.length], level, seed * 7 + 1);
        const questions = pickQuestions(board, level, mulberry32(seed * 13 + 5), QUESTION_TYPES);
        const total = level.questions.reduce((sum, q) => sum + q.count, 0);
        expect(questions).toHaveLength(total);
        const seen = new Set();
        for (const q of questions) {
          const type = QUESTION_TYPES[q.type];
          // board-item questions never repeat an item on one board (plan §7.4);
          // multi-item types (swap) book their whole exchange
          if (type.needs === 'boardItem') {
            for (const emoji of q.consumes || [q.item.emoji]) {
              expect(seen.has(emoji)).toBe(false);
              seen.add(emoji);
            }
          }
          // each type's own generation invariants pass
          expect(() => type.invariants(board, q, level)).not.toThrow();
        }
      }
    }
  });

  it('same seed → identical board and question order (daily replay)', () => {
    for (const level of LEVELS.slice(0, 3)) {
      const a = buildBoard(PACKS[0], level, 12345);
      const b = buildBoard(PACKS[0], level, 12345);
      expect(a.cells.map((it) => it?.emoji)).toEqual(b.cells.map((it) => it?.emoji));
      const qa = pickQuestions(a, level, mulberry32(777), QUESTION_TYPES);
      const qb = pickQuestions(b, level, mulberry32(777), QUESTION_TYPES);
      expect(qa.map((q) => [q.type, q.item.emoji])).toEqual(qb.map((q) => [q.type, q.item.emoji]));
    }
  });

  it('unknown types fail fast', () => {
    const board = buildBoard(PACKS[0], LEVELS[0], 1);
    expect(() =>
      pickQuestions(
        board,
        { ...LEVELS[0], questions: [{ type: 'nope', count: 1 }] },
        mulberry32(1),
        QUESTION_TYPES
      )
    ).toThrow(/unknown question type/);
  });
});

/* ==========================================================================
 * Packs + lint
 * ========================================================================== */

describe('packs + lint (level-aware)', () => {
  it('shipped packs pass lint against the shipped ladder', () => {
    expect(lintPacks(PACKS, LEVELS, QUESTION_TYPES)).toBe(true);
    expect(PACKS.map((p) => p.id)).toEqual(['snacks', 'fruits']);
    for (const pack of PACKS) expect(pack.items).toHaveLength(14);
  });

  it('rejects malformed packs and levels that outrun the spares', () => {
    expect(() => lintPacks([])).toThrow();
    expect(() => lintPacks([{ id: 'x', title: 'X', items: PACKS[0].items.slice(0, 2) }])).toThrow(
      /at least 8/
    );
    expect(() =>
      lintPacks([{ id: 'dup', title: 'Dup', items: [...PACKS[0].items, PACKS[0].items[0]] }])
    ).toThrow(/duplicate emoji/);
    const greedyLevel = {
      ...LEVELS[0],
      id: 'greedy',
      items: 13,
      questions: [{ type: 'missing', count: 1 }],
    };
    (greedyLevel as { candidates: number }).candidates = 4;
    expect(() => lintPacks([PACKS[0]], [greedyLevel], QUESTION_TYPES)).toThrow(/lacks spares/);
  });
});

/* ==========================================================================
 * Modes
 * ========================================================================== */

describe('modes (data/modes.js)', () => {
  it('covers the shipped modes; daily is a dedicated (non-menu) mode', () => {
    expect(MODE_ORDER).toEqual(['campaign', 'endless', 'zen', 'hard', 'kids', 'timeAttack']);
    for (const id of [...MODE_ORDER, 'daily']) expect(MODES[id]).toBeTruthy();
    expect(MODES.campaign.levelSource).toBe('campaign');
    expect(MODES.endless.levelSource).toBe('ladder');
    expect(MODES.zen.hearts).toBe(Infinity);
    expect(MODES.hard.hearts).toBe(1);
  });

  it('mode rules merge over level rules (mode wins)', () => {
    const level = LEVELS[0];
    expect(rulesFor(MODES.campaign, level).questionS).toBeUndefined(); // level default applies
    expect(rulesFor(MODES.timeAttack, level).questionS).toBe(5);
    expect(rulesFor(MODES.kids, level).memorizeBonusS).toBe(2);
    expect(modeById('nope').id).toBe('campaign');
    expect(modeById('daily').id).toBe('daily');
  });
});

/* ==========================================================================
 * Countdown, daily keys, percentiles, item names
 * ========================================================================== */

describe('countdown / daily helpers / percentiles', () => {
  it('counts seconds up within the running second', () => {
    expect(formatCountdown(8000)).toBe('8');
    expect(formatCountdown(7500)).toBe('8');
    expect(formatCountdown(300)).toBe('1');
    expect(formatCountdown(0)).toBe('0');
  });

  it('dailySeed + dailyKey are YYYYMMDD-keyed', () => {
    const day = new Date(2026, 8, 12);
    expect(dailySeed(day)).toBe(20260912);
    expect(dailyKey(day)).toBe('game:memory-quiz:daily:20260912');
    expect(DAILY_PREFIX).toBe('game:memory-quiz:daily:');
  });

  it('baked table below 5 runs, real history from 5 runs', () => {
    expect(bakedPercentile(3000)).toBe(3);
    expect(bakedPercentile(10)).toBe(50);
    expect(localPercentile(500, [100])).toBe(bakedPercentile(500));
    expect(localPercentile(500, [100, 200, 300, 400, 1000])).toBe(20);
    expect(localPercentile(1000, [100, 100, 100, 100, 100])).toBe(1);
  });

  it('itemName reads the locale with an English fallback', () => {
    const pizza = PACKS[0].items[0];
    expect(itemName(pizza, 'en')).toBe('pizza');
    expect(itemName(pizza, 'fr')).toBe('pizza');
    expect(itemName(undefined, 'en')).toBe('');
  });
});

/* ==========================================================================
 * Storage facade — save v2 + v1 migration
 * ========================================================================== */

describe('storage facade (save v2 + v1 migration)', () => {
  const DAY = new Date(2026, 8, 12);
  const KEYS = [SAVE_KEY, dailyKey(DAY)];
  let original: Record<string, string | null>;

  beforeEach(() => {
    original = Object.fromEntries(KEYS.map((k) => [k, window.localStorage.getItem(k)]));
    KEYS.forEach((k) => window.localStorage.removeItem(k));
  });

  afterAll(() => {
    for (const [k, v] of Object.entries(original)) {
      if (v === null) window.localStorage.removeItem(k);
      else window.localStorage.setItem(k, v);
    }
  });

  it('defaults to a fresh v2 save when nothing is stored', () => {
    expect(loadSave()).toEqual({
      version: 2,
      best: { score: 0, bestStreak: 0 },
      levels: {},
      history: [],
      prefs: { muted: false, pack: 'snacks', mode: 'campaign', levelId: '' },
    });
    expect(loadBest()).toEqual({ score: 0, bestStreak: 0 });
    expect(loadLevelRecords()).toEqual({});
    expect(loadDailyRecord(DAY)).toBeNull();
  });

  it('migrates a v1 save without losing the best or history', () => {
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        best: { score: 700, bestStreak: 9 },
        history: [{ score: 700, boards: 5, ts: 1001 }],
        prefs: { muted: true, pack: 'fruits' },
      })
    );
    const save = loadSave();
    expect(save.version).toBe(2);
    expect(save.best).toEqual({ score: 700, bestStreak: 9 });
    expect(save.history).toEqual([{ score: 700, boards: 5, ts: 1001, mode: '', level: '' }]);
    expect(save.prefs).toEqual({ muted: true, pack: 'fruits', mode: 'campaign', levelId: '' });
    expect(save.levels).toEqual({});
  });

  it('saveLevelResult folds score/stars/clears per level id', () => {
    expect(saveLevelResult('l01', 220, 2, 3).newStars).toBe(true);
    expect(saveLevelResult('l01', 180, 1, 2).newStars).toBe(false);
    expect(loadLevelRecord('l01')).toEqual({
      best: { score: 220, bestStreak: 2 },
      stars: 3,
      clears: 2,
    });
    expect(saveLevelResult('l01', 260, 3, 2)).toMatchObject({ newBest: true, newStars: false });
    expect(loadLevelRecord('l01')).toMatchObject({
      best: { score: 260, bestStreak: 3 },
      stars: 3,
      clears: 3,
    });
    expect(loadLevelRecord('l99')).toBeNull();
  });

  it('saveRunResult keeps the global best, tags history and caps at 20', () => {
    saveRunResult(500, 3, 4, 1000, { mode: 'endless' });
    saveRunResult(700, 2, 5, 1001, { mode: 'zen' });
    expect(saveRunResult(100, 9, 2, 1002, { mode: 'campaign', level: 'l03' }).newBest).toBe(false);
    expect(loadBest()).toEqual({ score: 700, bestStreak: 9 });
    expect(loadHistory().map((run) => run.score)).toEqual([100, 700, 500]);
    expect(loadHistory()[0]).toMatchObject({ mode: 'campaign', level: 'l03' });
    for (let i = 0; i < 25; i++) saveRunResult(i, 1, 1, 2000 + i, {});
    expect(loadHistory()).toHaveLength(20);
    expect(loadHistory()[0].score).toBe(24);
  });

  it('drops corrupt saves and entries instead of trusting the store', () => {
    window.localStorage.setItem(SAVE_KEY, '{corrupt');
    expect(loadSave()).toEqual({
      version: 2,
      best: { score: 0, bestStreak: 0 },
      levels: {},
      history: [],
      prefs: { muted: false, pack: 'snacks', mode: 'campaign', levelId: '' },
    });
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 2,
        best: { score: -5, bestStreak: 'many' },
        levels: { l01: { best: { score: 10, bestStreak: 1 }, stars: 9, clears: 1 }, l02: 'junk' },
        history: [{ score: 10, boards: 1, ts: 1 }, 'junk'],
        prefs: { muted: 'yes', pack: 42, mode: 'warp' },
      })
    );
    expect(loadBest()).toEqual({ score: 0, bestStreak: 0 });
    expect(loadLevelRecord('l01')).toBeNull(); // stars > 3 is corrupt
    expect(loadLevelRecord('l02')).toBeNull();
    expect(loadHistory()).toEqual([{ score: 10, boards: 1, ts: 1, mode: '', level: '' }]);
    expect(loadPrefs()).toEqual({ muted: false, pack: 'snacks', mode: 'campaign', levelId: '' });
  });

  it('savePrefs round-trips mode and level selection', () => {
    savePrefs({ muted: true, pack: 'fruits', mode: 'zen', levelId: 'l07' });
    expect(loadPrefs()).toEqual({ muted: true, pack: 'fruits', mode: 'zen', levelId: 'l07' });
    savePrefs({ muted: false, pack: 'snacks', mode: 'warp', levelId: 'l07' });
    expect(loadPrefs().mode).toBe('campaign'); // unknown mode → default
    expect(JSON.parse(window.localStorage.getItem(SAVE_KEY) as string).version).toBe(2);
  });

  it('daily records fold per day (score maximum)', () => {
    expect(saveDailyRecord(DAY, 300)).toEqual({ score: 300 });
    expect(saveDailyRecord(DAY, 420)).toEqual({ score: 420 });
    expect(saveDailyRecord(DAY, 250)).toEqual({ score: 420 });
    expect(loadDailyRecord(DAY)).toEqual({ score: 420 });
    expect(loadDailyRecord(new Date(2026, 8, 13))).toBeNull();
  });

  it('mirrors writes to a host-injected remote adapter', () => {
    const seen: unknown[] = [];
    setRemoteAdapter({ save: (save: unknown) => seen.push(save) });
    saveRunResult(50, 1, 1, 3000, {});
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ version: 2, best: { score: 50 } });
    setRemoteAdapter(null);
    saveRunResult(60, 1, 1, 3001, {});
    expect(seen).toHaveLength(1); // adapter detached
  });

  it('works without localStorage (private mode)', () => {
    const originalGet = window.localStorage.getItem.bind(window.localStorage);
    const originalSet = window.localStorage.setItem.bind(window.localStorage);
    const originalRemove = window.localStorage.removeItem.bind(window.localStorage);
    const thrower = () => {
      throw new Error('quota');
    };
    window.localStorage.setItem = thrower as typeof window.localStorage.setItem;
    window.localStorage.removeItem = (() => {}) as typeof window.localStorage.removeItem;
    expect(() => saveRunResult(10, 1, 1, 4000, {})).not.toThrow();
    expect(() => saveLevelResult('l01', 10, 1, 2)).not.toThrow();
    expect(() =>
      savePrefs({ muted: true, pack: 'fruits', mode: 'zen', levelId: 'l02' })
    ).not.toThrow();
    window.localStorage.getItem = ((key: string) => {
      thrower();
      return originalGet(key);
    }) as typeof window.localStorage.getItem;
    expect(() => loadSave()).not.toThrow();
    window.localStorage.setItem = originalSet;
    window.localStorage.getItem = originalGet;
    window.localStorage.removeItem = originalRemove;
  });
});

/* ==========================================================================
 * Config (flags, grants, strings)
 * ========================================================================== */

describe('config (flags + grants + strings, host-overridable)', () => {
  it('resolves the defaults the game consumes', () => {
    expect(GAME_CONFIG.locale).toBe('en');
    expect(GAME_CONFIG.flags.dailyEnabled).toBe(true);
    expect(GAME_CONFIG.flags.unlockAll).toBe(false);
    expect(GAME_CONFIG.grants).toEqual({});
    expect(GAME_CONFIG.strings.en.memorizeBanner).toContain('seconds to memorize');
    expect(GAME_CONFIG.strings.en.whereIs).toContain('{item}');
    expect(GAME_CONFIG.strings.en.movedWhere).toContain('moved');
    expect(GAME_CONFIG.strings.en.oddOne).toContain('NOT');
    expect(GAME_CONFIG.strings.en.levelCleared).toContain('{n}');
    expect(GAME_CONFIG.strings.en.shareLevel).toContain('{level}');
  });

  it('resolveConfig merges flags, grants and strings per locale', () => {
    const merged = resolveConfig(
      {
        flags: { dailyEnabled: true, unlockAll: false },
        grants: {},
        strings: { en: { share: 'EN' } },
      },
      {
        locale: 'fr',
        flags: { unlockAll: true },
        grants: { l07: true },
        strings: { fr: { share: 'FR' } },
      }
    );
    expect(merged).toMatchObject({
      locale: 'fr',
      flags: { unlockAll: true },
      grants: { l07: true },
    });
    expect(merged.strings.en.share).toBe('EN');
    expect(merged.strings.fr.share).toBe('FR');
  });

  it('non-boolean flags and non-true grants are dropped', () => {
    const merged = resolveConfig(
      { flags: { unlockAll: false }, grants: {} },
      { flags: { unlockAll: 'yes' }, grants: { l07: 'sure' } }
    );
    expect(merged.flags.unlockAll).toBe(false);
    expect(merged.grants).toEqual({});
  });

  it('t() substitutes vars and falls back to the key', () => {
    expect(t('memorizeBanner', { seconds: 8 })).toBe('You have 8 seconds to memorize!');
    expect(t('whereIs', { item: 'pizza' })).toBe('Where is the pizza?');
    expect(t('movedWhere', { item: 'taco' })).toBe('The taco moved! Where is it now?');
    expect(t('levelCleared', { n: 7 })).toBe('Level 7 cleared!');
    expect(t('no-such-key')).toBe('no-such-key');
  });
});
