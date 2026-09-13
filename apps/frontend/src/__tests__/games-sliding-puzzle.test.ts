/**
 * Pure-logic tests for the static game at
 * public/games/sliding-puzzle/ (plan/games/03-sliding-puzzle.md §8:
 * "100 shuffles per size → isSolved false + inversion-parity solvable;
 * no-undo rule; slideTile segments; scoreFor clamps") plus the Rev 2
 * modules: scenes.js slicing, the storage facade (versioned save + legacy
 * migration) and config resolution. The core assertions also ship in the
 * game's own core.test.html harness; this suite keeps them running in CI.
 */
import {
  DAILY_PREFIX,
  PREFS_KEY,
  SHUFFLE_MOVES,
  bestKey,
  blankAt,
  dailyKey,
  dailySeed,
  formatTime,
  isSolvable,
  isSolved,
  legalMoves,
  mergeRecord,
  mulberry32,
  neighbors,
  oneSwapFromSolved,
  scoreFor,
  shuffle,
  slideTile,
  solvedBoard,
} from '../../public/games/sliding-puzzle/core';
import { sliceBackground } from '../../public/games/sliding-puzzle/scenes';
import {
  SAVE_KEY,
  loadBest,
  loadDailyRecord,
  loadPrefs,
  loadSave,
  saveBest,
  saveDailyRecord,
  savePrefs,
  setRemoteAdapter,
} from '../../public/games/sliding-puzzle/storage';
import { GAME_CONFIG, resolveConfig, t } from '../../public/games/sliding-puzzle/config';

const boardStr = (board: number[]) => board.join(',');

function isPermutation(board: number[], n: number): boolean {
  if (board.length !== n * n) return false;
  if (board.filter((v) => v === 0).length !== 1) return false;
  const tiles = board.filter((v) => v !== 0).sort((a, b) => a - b);
  return tiles.every((v, i) => v === i + 1);
}

describe('solvedBoard / isSolved / isSolvable (basics)', () => {
  it.each([3, 4, 5])('solved %d×%d is solved, blank last, parity-solvable', (n) => {
    const solved = solvedBoard(n);
    expect(isSolved(solved)).toBe(true);
    expect(blankAt(solved)).toBe(n * n - 1);
    expect(isSolvable(solved, n)).toBe(true);
  });

  it('a single transposition is neither solved nor solvable (3×3 rule)', () => {
    const swapped = solvedBoard(3);
    swapped[0] = 2;
    swapped[1] = 1;
    expect(isSolved(swapped)).toBe(false);
    expect(isSolvable(swapped, 3)).toBe(false);
  });

  it('a single transposition is unsolvable under the 4×4 rule too', () => {
    const swapped = solvedBoard(4);
    swapped[0] = 2;
    swapped[1] = 1;
    // inversions 1 + blank row from bottom 1 → even → unsolvable
    expect(isSolvable(swapped, 4)).toBe(false);
  });
});

describe('neighbors / legalMoves', () => {
  it('center has 4 neighbours, corner 2, edge 3', () => {
    expect(neighbors(4, 3)).toEqual([1, 7, 3, 5]);
    expect(neighbors(0, 3)).toEqual([3, 1]);
    expect(neighbors(1, 3)).toEqual([4, 0, 2]);
  });

  it('legalMoves are exactly the blank’s neighbours', () => {
    expect(legalMoves(solvedBoard(3), 3)).toEqual(neighbors(8, 3));
  });
});

describe('slideTile (adjacent, segments, illegal, purity)', () => {
  const solved = solvedBoard(3); // [1,2,3,4,5,6,7,8,0]

  it('adjacent slide moves exactly one tile', () => {
    const single = slideTile(solved, 3, 5); // tile 6 sits directly above the blank
    expect(single).toEqual({ board: [1, 2, 3, 4, 5, 0, 7, 8, 6], moved: 1, pushed: [6] });
  });

  it('two-tile row segment counts 2 moves', () => {
    const row2 = slideTile(solved, 3, 6); // blank at 8, tap 6 in the same row
    expect(row2).toEqual({
      board: [1, 2, 3, 4, 5, 6, 0, 7, 8],
      moved: 2,
      pushed: [8, 7], // nearest the blank first
    });
  });

  it('three-tile row segment counts 3 moves', () => {
    const row3 = slideTile(solvedBoard(4), 4, 12); // whole bottom row
    expect(row3).toEqual({
      board: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 13, 14, 15],
      moved: 3,
      pushed: [15, 14, 13],
    });
  });

  it('column segment shifts tiles downward and counts both', () => {
    const col2 = slideTile(solved, 3, 2); // tile 3, two rows above the blank
    expect(col2).toEqual({
      board: [1, 2, 0, 4, 5, 3, 7, 8, 6],
      moved: 2,
      pushed: [6, 3], // nearest the blank first
    });
  });

  it('illegal slides are null: wrong row/column, the blank, out of range', () => {
    expect(slideTile(solved, 3, 0)).toBeNull();
    expect(slideTile(solved, 3, 8)).toBeNull();
    expect(slideTile(solved, 3, -1)).toBeNull();
    expect(slideTile(solved, 3, 9)).toBeNull();
  });

  it('never mutates its input board', () => {
    const before = solved.slice();
    slideTile(solved, 3, 5);
    expect(solved).toEqual(before);
  });
});

describe('shuffle guards (production pass)', () => {
  it('never hangs on a degenerate rng and still returns a mixed, solvable board', () => {
    for (const n of [3, 4, 5]) {
      const board = shuffle(n, SHUFFLE_MOVES[n as 3 | 4 | 5], () => 0);
      expect(isSolved(board)).toBe(false);
      expect(isSolvable(board, n)).toBe(true);
    }
  });

  it('fails fast for a size with no walk length instead of looping forever', () => {
    expect(() => shuffle(6, undefined as unknown as number)).toThrow(/no walk length/);
    expect(() => shuffle(6, 0)).toThrow(/no walk length/); // 6 has no default either
  });

  it('falls back to the size default for a non-positive explicit count', () => {
    const log: number[] = [];
    shuffle(3, 0, Math.random, log);
    expect(log).toHaveLength(SHUFFLE_MOVES[3]);
  });

  it('still honours an explicit walk length', () => {
    const log: number[] = [];
    shuffle(3, 7, Math.random, log);
    expect(log).toHaveLength(7);
  });
});

/* ---- the plan §8 proof: 100 shuffles per size ------------------------------
 * Every shuffle must be a real permutation, not solved, and pass the
 * inversion-parity check even though the walk makes it solvable by
 * construction. The blank-position log must be a legal walk with no move
 * undoing its predecessor, and it must replay through slideTile to exactly
 * the board shuffle returned.
 * -------------------------------------------------------------------------- */

describe.each([3, 4, 5])('shuffle (%d×%d, %d moves, 100 runs)', (n) => {
  const movesCount = SHUFFLE_MOVES[n as 3 | 4 | 5];

  it('never lands solved and always passes inversion parity', () => {
    for (let run = 0; run < 100; run++) {
      const board = shuffle(n, movesCount);
      expect(isSolved(board)).toBe(false);
      expect(isSolvable(board, n)).toBe(true);
      expect(isPermutation(board, n)).toBe(true);
    }
  });

  it('logs a legal no-undo walk that replays to the same board', () => {
    for (let run = 0; run < 100; run++) {
      const log: number[] = [];
      const board = shuffle(n, movesCount, Math.random, log);
      expect(log).toHaveLength(movesCount);
      for (let i = 0; i < log.length; i++) {
        const prev = i === 0 ? n * n - 1 : log[i - 1];
        expect(neighbors(prev, n)).toContain(log[i]);
        if (i >= 2) expect(log[i]).not.toBe(log[i - 2]); // no inverse of the predecessor
      }
      let replay = solvedBoard(n);
      for (const blank of log) {
        const step = slideTile(replay, n, blank);
        expect(step).not.toBeNull();
        replay = step!.board;
      }
      expect(replay).toEqual(board);
    }
  }, 60000);

  it('is deterministic for a fixed rng stream', () => {
    const seq = [0, 0.5, 0.99, 0.25];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    expect(shuffle(n, 40, rng)).toEqual(shuffle(n, 40, rng));
  });
});

describe('scoreFor (plan §2 formula)', () => {
  it('flawless solves pay the full sizeBonus', () => {
    expect(scoreFor(3, 0, 0)).toBe(300);
    expect(scoreFor(4, 0, 0)).toBe(500);
    expect(scoreFor(5, 0, 0)).toBe(800);
  });

  it('matches the worked example: 500 − ⌊213/2⌋ − ⌊161/5⌋ = 362', () => {
    expect(scoreFor(4, 213, 161)).toBe(362);
  });

  it('clamps at 0', () => {
    expect(scoreFor(3, 100000, 100000)).toBe(0);
  });

  it('never increases with more moves or more seconds', () => {
    for (let m = 0; m < 60; m += 7) {
      for (let s = 0; s < 400; s += 11) {
        expect(scoreFor(4, m + 2, s)).toBeLessThanOrEqual(scoreFor(4, m, s));
        expect(scoreFor(4, m, s + 5)).toBeLessThanOrEqual(scoreFor(4, m, s));
      }
    }
  });
});

describe('formatTime (m:ss clock)', () => {
  it('formats the plan hook 161 s as 2:41', () => {
    expect(formatTime(161000)).toBe('2:41');
  });

  it('zero, sub-minute and hour-scale times', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(59999)).toBe('0:59');
    expect(formatTime(3600000)).toBe('60:00');
  });
});

describe('sliceBackground (picture mode slicing, plan P3)', () => {
  it('sizes every tile’s background to the full n×n split', () => {
    expect(sliceBackground(0, 3).size).toBe('300% 300%');
    expect(sliceBackground(15, 4).size).toBe('400% 400%');
  });

  it('maps the first cell to the image’s top-left corner', () => {
    expect(sliceBackground(0, 3).position).toBe('0% 0%');
  });

  it('maps the last cell to the bottom-right corner', () => {
    expect(sliceBackground(8, 3).position).toBe('100% 100%');
    expect(sliceBackground(15, 4).position).toBe('100% 100%');
  });

  it('centers the middle slice of an odd grid', () => {
    expect(sliceBackground(4, 3).position).toBe('50% 50%');
  });

  it('places slices row-major, so tile v carries the (v−1)th piece', () => {
    // value 6 on a 3×3 sits at row 1, col 2 of the picture
    expect(sliceBackground(5, 3).position).toBe('100% 50%');
  });
});

describe('daily challenge (seeded shuffle)', () => {
  it('dailySeed maps a date to its YYYYMMDD number', () => {
    expect(dailySeed(new Date(2026, 8, 11))).toBe(20260911); // month is 0-based
    expect(dailySeed(new Date(2026, 0, 1))).toBe(20260101);
  });

  it('dailyKey composes the per-day storage key', () => {
    expect(dailyKey(new Date(2026, 8, 11))).toBe('game:sliding-puzzle:daily:20260911');
  });

  it('mulberry32 is deterministic per seed and stays in [0, 1)', () => {
    const a = mulberry32(20260911);
    const b = mulberry32(20260911);
    for (let i = 0; i < 500; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    // fresh streams with different seeds diverge immediately
    expect(mulberry32(42)()).not.toBe(mulberry32(43)());
  });

  it('same day → identical board; another day → a different board', () => {
    const day = new Date(2026, 8, 11);
    const run = (d: Date) => shuffle(4, SHUFFLE_MOVES[4], mulberry32(dailySeed(d)));
    expect(run(day)).toEqual(run(day));
    expect(run(day)).not.toEqual(run(new Date(2026, 8, 12)));
  });

  it('seeded daily boards are still valid shuffles', () => {
    const board = shuffle(4, SHUFFLE_MOVES[4], mulberry32(dailySeed(new Date(2026, 8, 11))));
    expect(isSolved(board)).toBe(false);
    expect(isSolvable(board, 4)).toBe(true);
  });
});

describe('records (mergeRecord + best keys)', () => {
  it('mergeRecord folds a run into the stored best', () => {
    expect(mergeRecord(null, 90000, 40)).toEqual({
      best: { timeMs: 90000, moves: 40 },
      newTime: true,
      newMoves: true,
    });
    const prev = { timeMs: 100000, moves: 50 };
    expect(mergeRecord(prev, 90000, 60)).toEqual({
      best: { timeMs: 90000, moves: 50 },
      newTime: true,
      newMoves: false,
    });
    expect(mergeRecord(prev, 120000, 45).best).toEqual({ timeMs: 100000, moves: 45 });
  });

  it('best keys separate normal and hard records', () => {
    expect(bestKey(3)).toBe('game:sliding-puzzle:best:3');
    expect(bestKey(4, 'hard')).toBe('game:sliding-puzzle:best:4:hard');
  });
});

/* ---- storage facade (Rev 2: one versioned save + legacy migration) ---------
 * The loose pre-Rev 2 keys (plan §5) are folded into game:sliding-puzzle:save
 * on first read, dropped only after the migrated save is durably written.
 * -------------------------------------------------------------------------- */

describe('storage facade (Rev 2: versioned save + legacy migration)', () => {
  const DAY = new Date(2026, 8, 11);
  const KEYS = [
    SAVE_KEY,
    PREFS_KEY,
    bestKey(3),
    bestKey(4),
    bestKey(5),
    bestKey(3, 'hard'),
    bestKey(4, 'hard'),
    bestKey(5, 'hard'),
    dailyKey(DAY),
  ];
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

  it('keeps the legacy key layout and the Rev 2 save key (plan §5)', () => {
    expect(PREFS_KEY).toBe('game:sliding-puzzle:prefs');
    expect(DAILY_PREFIX).toBe('game:sliding-puzzle:daily:');
    expect(SAVE_KEY).toBe('game:sliding-puzzle:save');
  });

  it('defaults to a fresh versioned save when nothing is stored', () => {
    expect(loadSave()).toEqual({
      version: 1,
      prefs: { size: 3, muted: false, mode: 'numbers', hard: false },
      bests: {},
      daily: {},
    });
    expect(JSON.parse(window.localStorage.getItem(SAVE_KEY) as string).version).toBe(1);
    expect(loadPrefs()).toEqual({ size: 3, muted: false, mode: 'numbers', hard: false });
    expect(loadBest(4)).toBeNull();
    expect(loadDailyRecord(DAY)).toBeNull();
  });

  it('migrates the legacy loose keys into the versioned save and removes them', () => {
    window.localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ size: 4, muted: true, mode: 'picture' })
    );
    window.localStorage.setItem(bestKey(4), JSON.stringify({ timeMs: 100000, moves: 50 }));
    window.localStorage.setItem(bestKey(5, 'hard'), JSON.stringify({ timeMs: 200000, moves: 120 }));
    window.localStorage.setItem(dailyKey(DAY), JSON.stringify({ timeMs: 90000, moves: 40 }));

    expect(loadPrefs()).toEqual({ size: 4, muted: true, mode: 'picture', hard: false });
    expect(loadBest(4)).toEqual({ timeMs: 100000, moves: 50 });
    expect(loadBest(5, 'hard')).toEqual({ timeMs: 200000, moves: 120 });
    expect(loadBest(3)).toBeNull();
    expect(loadDailyRecord(DAY)).toEqual({ timeMs: 90000, moves: 40 });
    expect(window.localStorage.getItem(PREFS_KEY)).toBeNull();
    expect(window.localStorage.getItem(bestKey(4))).toBeNull();
    expect(window.localStorage.getItem(bestKey(5, 'hard'))).toBeNull();
    expect(window.localStorage.getItem(dailyKey(DAY))).toBeNull();

    const saved = JSON.parse(window.localStorage.getItem(SAVE_KEY) as string);
    expect(saved.version).toBe(1);
    expect(saved.bests).toEqual({
      '4': { timeMs: 100000, moves: 50 },
      '5:hard': { timeMs: 200000, moves: 120 },
    });
    expect(saved.daily).toEqual({ '20260911': { timeMs: 90000, moves: 40 } });
  });

  it('drops corrupt legacy entries instead of trusting the store', () => {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ size: 9, muted: 'yes' }));
    window.localStorage.setItem(bestKey(3), JSON.stringify({ timeMs: 'fast', moves: -1 }));
    window.localStorage.setItem(dailyKey(DAY), 'not json');

    expect(loadPrefs()).toEqual({ size: 3, muted: false, mode: 'numbers', hard: false });
    expect(loadBest(3)).toBeNull();
    expect(loadDailyRecord(DAY)).toBeNull();
  });

  it('saveBest keeps the lower time and lower moves independently, per variant', () => {
    expect(saveBest(4, 100000, 50)).toEqual({
      best: { timeMs: 100000, moves: 50 },
      newTime: true,
      newMoves: true,
    });
    expect(saveBest(4, 90000, 60)).toEqual({
      best: { timeMs: 90000, moves: 50 },
      newTime: true,
      newMoves: false,
    });
    expect(saveBest(4, 120000, 45)).toEqual({
      best: { timeMs: 90000, moves: 45 },
      newTime: false,
      newMoves: true,
    });
    expect(loadBest(4)).toEqual({ timeMs: 90000, moves: 45 });
    expect(loadBest(4, 'hard')).toBeNull(); // variants stay separate
  });

  it('saveDailyRecord folds into the day slot and loadDailyRecord reads it back', () => {
    expect(saveDailyRecord(DAY, 90000, 40)).toEqual({
      best: { timeMs: 90000, moves: 40 },
      newTime: true,
      newMoves: true,
    });
    expect(saveDailyRecord(DAY, 80000, 45)).toEqual({
      best: { timeMs: 80000, moves: 40 },
      newTime: true,
      newMoves: false,
    });
    expect(loadDailyRecord(DAY)).toEqual({ timeMs: 80000, moves: 40 });
    expect(loadDailyRecord(new Date(2026, 8, 12))).toBeNull();
  });

  it('savePrefs round-trips through the versioned save', () => {
    savePrefs({ size: 5, muted: true, mode: 'picture', hard: true });
    expect(loadPrefs()).toEqual({ size: 5, muted: true, mode: 'picture', hard: true });
    expect(JSON.parse(window.localStorage.getItem(SAVE_KEY) as string).version).toBe(1);
  });

  it('mirrors writes to a host-injected remote adapter', () => {
    const seen: unknown[] = [];
    setRemoteAdapter({ save: (save: unknown) => seen.push(save) });
    saveBest(3, 60000, 30);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ version: 1, bests: { '3': { timeMs: 60000, moves: 30 } } });
    setRemoteAdapter(null);
    saveBest(3, 50000, 25);
    expect(seen).toHaveLength(1); // adapter detached
  });
});

describe('config (strings, host-overridable)', () => {
  it('resolves the defaults the game consumes', () => {
    expect(GAME_CONFIG.locale).toBe('en');
    expect(GAME_CONFIG.strings.en.share).toContain('Sliding Puzzle');
    expect(GAME_CONFIG.strings.en.shareDaily).toContain('Daily Sliding Puzzle');
  });

  it('resolveConfig merges host overrides over defaults, strings per locale', () => {
    const merged = resolveConfig(
      { locale: 'en', strings: { en: { share: 'EN' } } },
      { locale: 'fr', strings: { fr: { share: 'FR' } } }
    );
    expect(merged).toMatchObject({ locale: 'fr' });
    expect(merged.strings.en.share).toBe('EN');
    expect(merged.strings.fr.share).toBe('FR');
  });

  it('t() substitutes vars and falls back to the key', () => {
    expect(
      t('share', {
        size: 4,
        mode: ' on hard mode',
        result: '2:41 · 213 moves',
        url: 'http://x',
      })
    ).toBe(
      'I solved 4×4 on hard mode in 2:41 · 213 moves in Sliding Puzzle — can you beat it? http://x'
    );
    expect(t('shareDaily', { result: '1:00 · 20 moves', url: 'http://x' })).toBe(
      'I solved today\u2019s Daily Sliding Puzzle in 1:00 · 20 moves — can you beat me? http://x'
    );
    expect(t('no-such-key')).toBe('no-such-key');
  });
});

describe('oneSwapFromSolved (almost-there nudge, suggestion 03 item 2)', () => {
  it('is false for the solved board itself', () => {
    expect(oneSwapFromSolved(solvedBoard(3))).toBe(false);
    expect(oneSwapFromSolved(solvedBoard(4))).toBe(false);
  });

  it('is true for exactly one transposition of two tiles', () => {
    // 3×3 solved [1,2,3,4,5,6,7,8,0] with 5 and 6 swapped
    const board = solvedBoard(3);
    const i = board.indexOf(5);
    const j = board.indexOf(6);
    [board[i], board[j]] = [board[j], board[i]];
    expect(oneSwapFromSolved(board)).toBe(true);
  });

  it('is false for two swaps away (four misplaced tiles)', () => {
    const board = solvedBoard(3);
    let [i, j] = [board.indexOf(5), board.indexOf(6)];
    [board[i], board[j]] = [board[j], board[i]];
    [i, j] = [board.indexOf(1), board.indexOf(2)];
    [board[i], board[j]] = [board[j], board[i]];
    expect(oneSwapFromSolved(board)).toBe(false);
  });

  it('is false when two tiles are displaced but not into each other\u2019s slots', () => {
    const board = solvedBoard(3);
    // put tile 1 where tile 3 belongs and tile 2 where tile 1 belongs:
    // tiles 1 and 2 misplaced, but not a mutual transposition
    const b = board.slice();
    b[0] = 2;
    b[2] = 1;
    expect(oneSwapFromSolved(b)).toBe(false);
  });

  it('detects the classic last-two-tiles swap (blank at home, ignored)', () => {
    const board = [1, 2, 3, 4, 5, 6, 8, 7, 0];
    expect(oneSwapFromSolved(board)).toBe(true);
  });

  it('a blank move is a 3-cycle of tiles — never one swap away', () => {
    // a blank shifted off its home necessarily displaces a third tile
    const board = [1, 2, 3, 4, 5, 6, 0, 8, 7];
    expect(oneSwapFromSolved(board)).toBe(false);
  });
});
