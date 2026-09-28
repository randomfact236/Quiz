/**
 * ============================================================================
 * core.js — Gomoku / Five in a Row (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/02-gomoku.md. Same split as connect-four: the pure model lives
 * here (jest suite: src/__tests__/games-gomoku-core.test.ts), game.js is the
 * UI shell, the duel backend mirrors it server-side in TS.
 *
 * Board model = Array(size*size) of null | 'B' | 'W', row-major, row 0 = TOP.
 * Freestyle rules: five OR MORE in a row wins (no forbidden-move complexity).
 * 'B' (black, the creator) is the first mover of a match.
 * Sizes: 15 (standard) and 11 (quick rounds) — the size travels with the board.
 * ============================================================================
 */

export const SIZES = [11, 15];
export const WIN_LENGTH = 5;
const CENTER_BONUS = 2; // the middle band of an odd board

export function createEmptyBoard(size) {
  return Array(size * size).fill(null);
}

export function other(mark) {
  return mark === 'B' ? 'W' : 'B';
}

export function idx(size, row, col) {
  return row * size + col;
}

export function rowColOf(size, index) {
  return { row: Math.floor(index / size), col: index % size };
}

export function placeInPlace(board, size, index, mark) {
  if (index < 0 || index >= size * size || board[index] !== null) return false;
  board[index] = mark;
  return true;
}

/**
 * Win check through the last placed stone: four axes, counting contiguous
 * stones. Freestyle — five or more wins. Returns { mark, line } (the whole
 * run) or null.
 */
export function findWinFrom(board, size, index) {
  const { row, col } = rowColOf(size, index);
  const mark = board[index];
  if (!mark) return null;
  const axes = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of axes) {
    const line = [index];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < size && c >= 0 && c < size && board[idx(size, r, c)] === mark) {
        line.push(idx(size, r, c));
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= WIN_LENGTH) return { mark, line };
  }
  return null;
}

/**
 * Rules-aware round outcome after the drop at `index`:
 * { winner, line } | 'draw' | null (game still going).
 */
export function roundOutcome(board, size, index) {
  const win = findWinFrom(board, size, index);
  if (win) return { winner: win.mark, line: win.line };
  for (let i = 0; i < board.length; i++) if (board[i] === null) return null;
  return 'draw';
}

/* ---- AI -------------------------------------------------------------------- */

const SCORES = {
  five: 10_000_000,
  openFour: 100_000,
  four: 10_000,
  openThree: 8_000,
  three: 800,
  openTwo: 80,
  two: 8,
};

/**
 * Pattern score of playing `mark` at (row, col): walks each axis around the
 * point counting stones/open ends. Classic gomoku shape evaluation.
 */
export function pointScore(board, size, row, col, mark) {
  if (row < 0 || row >= size || col < 0 || col >= size) return 0;
  if (board[idx(size, row, col)] !== null) return 0;
  const axes = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  let total = 0;
  for (const [dr, dc] of axes) {
    let stones = 1; // the move itself
    let blocked = 0;
    let openEnds = 0;
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < size && c >= 0 && c < size) {
        const v = board[idx(size, r, c)];
        if (v === mark) stones++;
        else {
          if (v !== null) blocked++;
          break;
        }
        r += dr * sign;
        c += dc * sign;
      }
      // the cell just past our run is open?
      if (r >= 0 && r < size && c >= 0 && c < size && board[idx(size, r, c)] === null) openEnds++;
    }
    const length = stones;
    if (length >= WIN_LENGTH) total += SCORES.five;
    else if (length === 4) total += blocked === 0 ? SCORES.openFour : SCORES.four;
    else if (length === 3) total += blocked === 0 ? SCORES.openThree : SCORES.three;
    else if (length === 2) total += blocked === 0 ? SCORES.openTwo : SCORES.two;
  }
  const center = (size - 1) / 2;
  if (Math.abs(row - center) <= 1 && Math.abs(col - center) <= 1) total += CENTER_BONUS;
  return total;
}

/** Empty cells within distance 2 of any stone (all cells on an empty board). */
export function candidateCells(board, size) {
  const cells = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== null) continue;
    const { row, col } = rowColOf(size, i);
    let near = board.every((v) => v === null); // empty board → all cells
    if (!near) {
      for (let dr = -2; dr <= 2 && !near; dr++) {
        for (let dc = -2; dc <= 2 && !near; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < size && c >= 0 && c < size && board[idx(size, r, c)] !== null)
            near = true;
        }
      }
    }
    if (near) cells.push(i);
  }
  return cells;
}

/** Would playing `mark` at `index` win immediately? */
export function isWinningCell(board, size, index, mark) {
  if (board[index] !== null) return false;
  board[index] = mark;
  const win = findWinFrom(board, size, index) !== null;
  board[index] = null;
  return win;
}

/** Easy AI — random cell near the action (or anywhere on an empty board). */
export function easyMove(board, size, toMove) {
  const cells = candidateCells(board, size);
  if (cells.length === 0) return -1;
  return cells[Math.floor(Math.random() * cells.length)];
}

/** Medium AI — take the win, block the loss, block the opponent's open
 *  three (manual play showed it chasing its own shape instead of defending),
 *  else best shape score. */
export function mediumMove(board, size, toMove) {
  const cells = candidateCells(board, size);
  if (cells.length === 0) return -1;
  const opp = other(toMove);
  for (const i of cells) if (isWinningCell(board, size, i, toMove)) return i;
  for (const i of cells) if (isWinningCell(board, size, i, opp)) return i;
  // defend: the cell where the opponent would complete an open three/four
  let block = -1;
  let blockScore = 0;
  for (const i of cells) {
    const { row, col } = rowColOf(size, i);
    const s = pointScore(board, size, row, col, opp);
    if (s >= SCORES.openThree && s > blockScore) {
      blockScore = s;
      block = i;
    }
  }
  if (block >= 0) return block;
  let best = -Infinity;
  let bestCells = [];
  for (const i of cells) {
    const { row, col } = rowColOf(size, i);
    const score =
      pointScore(board, size, row, col, toMove) - pointScore(board, size, row, col, opp) * 1.1;
    if (score > best) {
      best = score;
      bestCells = [i];
    } else if (score === best) {
      bestCells.push(i);
    }
  }
  return bestCells[Math.floor(Math.random() * bestCells.length)];
}

/** Leaf evaluation from `mark`'s perspective. */
function evaluate(board, size, mark) {
  const opp = other(mark);
  let score = 0;
  for (const i of candidateCells(board, size)) {
    const { row, col } = rowColOf(size, i);
    score +=
      pointScore(board, size, row, col, mark) - pointScore(board, size, row, col, opp) * 1.15;
  }
  return score;
}

/** Depth-limited negamax over the top-N shaped candidates. */
function negamax(board, size, toMove, depth, alpha, beta, lastIndex) {
  if (lastIndex >= 0 && findWinFrom(board, size, lastIndex) !== null) {
    return findWinFrom(board, size, lastIndex).mark === toMove
      ? 10_000_000 - depth
      : depth - 10_000_000;
  }
  if (depth === 0) return evaluate(board, size, toMove);
  const ranked = rank(board, size, toMove).slice(0, 8);
  if (ranked.length === 0) return evaluate(board, size, toMove);
  let best = -Infinity;
  for (const i of ranked) {
    board[i] = toMove;
    const value = -negamax(board, size, other(toMove), depth - 1, -beta, -alpha, i);
    board[i] = null;
    if (value > best) best = value;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Candidate cells ranked by (my shape − opponent shape). */
function rank(board, size, mark) {
  const opp = other(mark);
  const scored = candidateCells(board, size).map((i) => {
    const { row, col } = rowColOf(size, i);
    return {
      i,
      s: pointScore(board, size, row, col, mark) - pointScore(board, size, row, col, opp) * 1.1,
    };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.i);
}

/**
 * Hard AI — shape-ranked negamax with alpha-beta. Plays very hard without
 * being a solved engine (plan §4: "very hard", not "unbeatable").
 */
export function hardMove(board, size, toMove, depth = 4) {
  const cells = candidateCells(board, size);
  if (cells.length === 0) return -1;
  const opp = other(toMove);
  for (const i of cells) if (isWinningCell(board, size, i, toMove)) return i;
  for (const i of cells) if (isWinningCell(board, size, i, opp)) return i;
  let bestValue = -Infinity;
  let best = [];
  let alpha = -Infinity;
  for (const i of rank(board, size, toMove).slice(0, 8)) {
    board[i] = toMove;
    const value = -negamax(board, size, opp, depth - 1, -Infinity, -alpha, i);
    board[i] = null;
    if (value > bestValue) {
      bestValue = value;
      best = [i];
    } else if (value === bestValue) {
      best.push(i);
    }
    if (bestValue > alpha) alpha = bestValue;
  }
  return best[Math.floor(Math.random() * best.length)];
}

export function aiMove(board, size, toMove, difficulty, hardDepth = 4) {
  if (difficulty === 'hard') return hardMove(board, size, toMove, hardDepth);
  if (difficulty === 'medium') return mediumMove(board, size, toMove);
  return easyMove(board, size, toMove);
}
