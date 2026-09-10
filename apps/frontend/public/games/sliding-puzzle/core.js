/**
 * ============================================================================
 * Sliding Puzzle — core.js (Game 03, plan/games/03-sliding-puzzle.md §6)
 * ============================================================================
 * Pure model, zero DOM access — this module is the test surface (plan §8).
 * Plain ESM, no build step (same convention as games 01/02): game.js imports
 * it in the browser, and the jest suite (src/__tests__/games-sliding-puzzle.test.ts)
 * plus the folder's own core.test.html harness import it directly.
 *
 * Board model = Array(n²) of tile numbers; 0 is the blank. Solved state is
 * tiles 1..n²-1 in order with the blank last.
 * ============================================================================
 */

export const SIZES = [3, 4, 5];

/** Shuffle walk lengths per size (plan §2) — longer for bigger boards. */
export const SHUFFLE_MOVES = { 3: 120, 4: 250, 5: 400 };

/** sizeBonus for the score formula (plan §2). */
export const SIZE_BONUS = { 3: 300, 4: 500, 5: 800 };

export function bestKey(size, variant) {
  return 'game:sliding-puzzle:best:' + size + (variant ? ':' + variant : '');
}

export const PREFS_KEY = 'game:sliding-puzzle:prefs';

/** Storage key of one day's daily-challenge record, from a Date. */
export function dailyKey(date) {
  return 'game:sliding-puzzle:daily:' + dailySeed(date);
}

/** YYYYMMDD number of a Date — the daily challenge's identity + rng seed. */
export function dailySeed(date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/**
 * Deterministic 32-bit rng (mulberry32). shuffle() accepts it, so a fixed
 * seed makes every player — and every replay — walk the exact same board:
  * that is the whole daily challenge.
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
 * Folds a finished run into a personal record: lower time and lower moves
 * each win independently, so a run can be a time best, a moves best, or
 * both. `prev` is the stored record or null.
 */
export function mergeRecord(prev, timeMs, moves) {
  return {
    best: {
      timeMs: prev ? Math.min(prev.timeMs, timeMs) : timeMs,
      moves: prev ? Math.min(prev.moves, moves) : moves,
    },
    newTime: !prev || timeMs < prev.timeMs,
    newMoves: !prev || moves < prev.moves,
  };
}

export function solvedBoard(n) {
  const board = new Array(n * n);
  for (let i = 0; i < n * n - 1; i++) board[i] = i + 1;
  board[n * n - 1] = 0;
  return board;
}

export function blankAt(board) {
  return board.indexOf(0);
}

/** Indices orthogonally adjacent to cell i on an n×n board. */
export function neighbors(i, n) {
  const row = Math.floor(i / n);
  const col = i % n;
  const out = [];
  if (row > 0) out.push(i - n);
  if (row < n - 1) out.push(i + n);
  if (col > 0) out.push(i - 1);
  if (col < n - 1) out.push(i + 1);
  return out;
}

/** Positions of the tiles that can slide straight into the blank. */
export function legalMoves(board, n) {
  return neighbors(blankAt(board), n);
}

export function isSolved(board) {
  const len = board.length;
  for (let i = 0; i < len - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[len - 1] === 0;
}

/**
 * Slide the tile at `index` toward the blank (plan §6). A tile adjacent to
 * the blank moves alone (moved: 1); any other tile in the blank's row or
 * column pushes the whole segment between it and the blank one step toward
 * the blank (moved: tiles displaced — plan §2 move counting). Returns a NEW
 * board (input is never mutated) or null for an illegal slide: the blank
 * itself, an out-of-range index, or a tile not sharing the blank's row/column
 * (the UI turns null into the wrong-tile shake).
 */
export function slideTile(board, n, index) {
  if (!Number.isInteger(index) || index < 0 || index >= board.length) return null;
  const blank = blankAt(board);
  if (index === blank) return null;
  const sameRow = Math.floor(index / n) === Math.floor(blank / n);
  const sameCol = index % n === blank % n;
  if (!sameRow && !sameCol) return null;
  const step = index > blank ? (sameRow ? 1 : n) : sameRow ? -1 : -n;
  const dist = Math.abs(index - blank) / (sameRow ? 1 : n);
  const next = board.slice();
  let b = blank;
  for (let i = 0; i < dist; i++) {
    next[b] = next[b + step]; // nearest tile slides into the blank...
    b += step;                // ...and the blank takes its place
  }
  next[b] = 0;
  return { board: next, moved: dist };
}

/**
 * Shuffle by walking the blank through `movesCount` random legal single-tile
 * slides starting from the solved board (plan §2) — solvable by construction.
 * The walk never undoes its immediately previous move: the blank never steps
 * back onto the position it just left. If `log` is given it receives the
 * blank position after every move (test surface for the no-undo rule, §8).
 * Re-walks in the unlikely case the board lands back on solved (plan §7.2).
 */
export function shuffle(n, movesCount, rng = Math.random, log = null) {
  let board;
  do {
    board = solvedBoard(n);
    if (log) log.length = 0;
    let blank = n * n - 1;
    let prev = -1;
    for (let m = 0; m < movesCount; m++) {
      const options = neighbors(blank, n).filter((p) => p !== prev);
      const roll = Math.min(options.length - 1, Math.floor(rng() * options.length));
      const pick = options[roll];
      board[blank] = board[pick];
      board[pick] = 0;
      prev = blank;
      blank = pick;
      if (log) log.push(blank);
    }
  } while (isSolved(board));
  return board;
}

/**
 * Inversion-parity check (plan §8): odd widths (3×3, 5×5) are solvable iff
 * the inversion count among tiles is even; even widths (4×4) iff inversions
 * plus the blank's row counted from the bottom is odd. Shuffles are solvable
 * by construction — this runs anyway as an independent proof in the tests.
 */
export function isSolvable(board, n) {
  const tiles = board.filter((v) => v !== 0);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] > tiles[j]) inversions++;
    }
  }
  if (n % 2 === 1) return inversions % 2 === 0;
  const blankRowFromBottom = n - Math.floor(blankAt(board) / n);
  return (inversions + blankRowFromBottom) % 2 === 1;
}

/** score = max(0, sizeBonus − ⌊moves/2⌋ − ⌊seconds/5⌋) (plan §2). */
export function scoreFor(size, moves, seconds) {
  const bonus = SIZE_BONUS[size] || 0;
  return Math.max(0, bonus - Math.floor(moves / 2) - Math.floor(seconds / 5));
}

/** m:ss clock shared by the HUD, win overlay and share text. */
export function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}
