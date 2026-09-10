/**
 * Pure-logic tests for the static game at
 * public/games/sliding-puzzle/core.js (plan/games/03-sliding-puzzle.md §8:
 * "100 shuffles per size → isSolved false + inversion-parity solvable;
 * no-undo rule; slideTile segments; scoreFor clamps"). The same assertions
 * ship in the game's own core.test.html harness; this suite keeps them
 * running in CI.
 */
import {
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
  scoreFor,
  shuffle,
  slideTile,
  solvedBoard,
} from '../../public/games/sliding-puzzle/core';
import { sliceBackground } from '../../public/games/sliding-puzzle/game';

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
    expect(single).toEqual({ board: [1, 2, 3, 4, 5, 0, 7, 8, 6], moved: 1 });
  });

  it('two-tile row segment counts 2 moves', () => {
    const row2 = slideTile(solved, 3, 6); // blank at 8, tap 6 in the same row
    expect(row2).toEqual({ board: [1, 2, 3, 4, 5, 6, 0, 7, 8], moved: 2 });
  });

  it('three-tile row segment counts 3 moves', () => {
    const row3 = slideTile(solvedBoard(4), 4, 12); // whole bottom row
    expect(row3).toEqual({
      board: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 13, 14, 15],
      moved: 3,
    });
  });

  it('column segment shifts tiles downward and counts both', () => {
    const col2 = slideTile(solved, 3, 2); // tile 3, two rows above the blank
    expect(col2).toEqual({ board: [1, 2, 0, 4, 5, 3, 7, 8, 6], moved: 2 });
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
