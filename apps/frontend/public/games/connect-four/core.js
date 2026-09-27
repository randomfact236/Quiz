/**
 * ============================================================================
 * core.js — Connect Four (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/01-connect-four.md phase 1. Same split as tic-tac-toe: the pure
 * model lives here (jest suite: src/__tests__/games-connect-four-core.test.ts),
 * game.js is the UI shell, the duel backend mirrors it server-side in TS.
 *
 * Board model = Array(42) of null | 'R' | 'Y', row-major, row 0 = TOP.
 * Gravity: a drop lands in the LOWEST empty row of the column.
 * 'R' (red) is the first mover of a round; the loser opens the rematch
 * (starter flips on a draw) — handled by game.js.
 * ============================================================================
 */

export const COLS = 7;
export const ROWS = 6;
export const CELLS = COLS * ROWS;

export const COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6]; // center first (AI move ordering)

export function emptyBoard() {
  return Array(CELLS).fill(null);
}

export function other(mark) {
  return mark === 'R' ? 'Y' : 'R';
}

export function idx(row, col) {
  return row * COLS + col;
}

/** Lowest empty row in a column (bottom-up), or -1 when the column is full. */
export function lowestRow(board, col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[idx(row, col)] === null) return row;
  }
  return -1;
}

/** All columns that can still accept a disc, center-first. */
export function validColumns(board) {
  const cols = [];
  for (let c = 0; c < COLUMN_ORDER.length; c++) {
    const col = COLUMN_ORDER[c];
    if (lowestRow(board, col) !== -1) cols.push(col);
  }
  return cols;
}

/**
 * Drop a disc IN PLACE (minimax needs fast undo: set board[idx] back to null).
 * Returns the landing row, or -1 on a full column.
 */
export function dropInPlace(board, col, mark) {
  const row = lowestRow(board, col);
  if (row === -1) return -1;
  board[idx(row, col)] = mark;
  return row;
}

/**
 * Win check that only looks through the LAST dropped cell — four axes,
 * counting contiguous marks through (row, col). Returns { mark, line }
 * (line = the 4+ cell indices of the winning run) or null.
 */
export function findWinFrom(board, row, col) {
  const mark = board[idx(row, col)];
  if (!mark) return null;
  const axes = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]; // →, ↓, ↘, ↗ (dr, dc)
  for (const [dr, dc] of axes) {
    const line = [idx(row, col)];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[idx(r, c)] === mark) {
        line.push(idx(r, c));
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= 4) return { mark, line };
  }
  return null;
}

/**
 * Rules-aware round outcome after the drop landed at (row, lastCol):
 * { winner, line } | 'draw' | null (game still going).
 */
export function roundOutcome(board, row, lastCol) {
  const win = findWinFrom(board, row, lastCol);
  if (win) return { winner: win.mark, line: win.line };
  for (let i = 0; i < CELLS; i++) if (board[i] === null) return null;
  return 'draw';
}

/* ---- AI -------------------------------------------------------------------- */

const WIN_SCORE = 100000;

/** Heuristic value of one 4-cell window for `mark`. */
function scoreWindow(board, cells, mark) {
  const opp = other(mark);
  let mine = 0;
  let theirs = 0;
  for (let i = 0; i < 4; i++) {
    const cell = board[cells[i]];
    if (cell === mark) mine++;
    else if (cell === opp) theirs++;
  }
  if (mine > 0 && theirs > 0) return 0; // dead window
  if (mine === 4) return WIN_SCORE;
  if (theirs === 4) return -WIN_SCORE;
  if (mine === 3) return 50;
  if (theirs === 3) return -60; // blocking bias — threats matter more than chances
  if (mine === 2) return 5;
  if (theirs === 2) return -5;
  return 0;
}

/** Board heuristic for `mark`: all windows + a center-column preference. */
export function scoreBoard(board, mark) {
  let score = 0;
  // horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow(board, [idx(r, c), idx(r, c + 1), idx(r, c + 2), idx(r, c + 3)], mark);
    }
  }
  // vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += scoreWindow(board, [idx(r, c), idx(r + 1, c), idx(r + 2, c), idx(r + 3, c)], mark);
    }
  }
  // diagonal ↘ and ↗ windows
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow(
        board,
        [idx(r, c), idx(r + 1, c + 1), idx(r + 2, c + 2), idx(r + 3, c + 3)],
        mark
      );
      score += scoreWindow(
        board,
        [idx(r, c + 3), idx(r + 1, c + 2), idx(r + 2, c + 1), idx(r + 3, c)],
        mark
      );
    }
  }
  // center-column preference (the statistically strongest opening area)
  for (let r = 0; r < ROWS; r++) {
    if (board[idx(r, 3)] === mark) score += 4;
  }
  return score;
}

/** Columns where a drop would immediately win for `mark`. */
export function winningColumns(board, mark) {
  return validColumns(board).filter((col) => {
    const row = dropInPlace(board, col, mark);
    const win = findWinFrom(board, row, col);
    board[idx(row, col)] = null;
    return win !== null;
  });
}

/** Depth-limited negamax with alpha-beta; leaf = heuristic eval. */
function negamax(board, toMove, depth, alpha, beta, lastCol, lastRow) {
  if (lastCol >= 0) {
    const win = findWinFrom(board, lastRow, lastCol);
    if (win) {
      // The player who just moved is `other(toMove)` — depth-shaped preference.
      return win.mark === toMove ? WIN_SCORE - depth : depth - WIN_SCORE;
    }
    let full = true;
    for (let i = 0; i < CELLS; i++) {
      if (board[i] === null) {
        full = false;
        break;
      }
    }
    if (full) return 0;
  }
  if (depth === 0) return scoreBoard(board, toMove);

  let best = -Infinity;
  for (const col of validColumns(board)) {
    const row = dropInPlace(board, col, toMove);
    const value = -negamax(board, other(toMove), depth - 1, -beta, -alpha, col, row);
    board[idx(row, col)] = null;
    if (value > best) best = value;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * Hard AI — minimax + alpha-beta at the given depth (game.js uses 7), with
 * center-first move ordering. Ties break randomly so rounds don't feel
 * scripted. Returns a valid column.
 */
export function hardMove(board, toMove, depth = 7) {
  const moves = validColumns(board);
  if (moves.length === 0) return -1;
  let bestValue = -Infinity;
  let best = [];
  let alpha = -Infinity;
  for (const col of moves) {
    const row = dropInPlace(board, col, toMove);
    // An immediate winning drop short-circuits the search honestly.
    const win = findWinFrom(board, row, col);
    const value = win
      ? WIN_SCORE
      : -negamax(board, other(toMove), depth - 1, -Infinity, -alpha, col);
    board[idx(row, col)] = null;
    if (value > bestValue) {
      bestValue = value;
      best = [col];
    } else if (value === bestValue) {
      best.push(col);
    }
    if (bestValue > alpha) alpha = bestValue;
  }
  return best[Math.floor(Math.random() * best.length)];
}

/**
 * Medium AI — win if possible → block the opponent's immediate win → else
 * center-first preference with a little randomness.
 */
export function mediumMove(board, toMove) {
  const moves = validColumns(board);
  if (moves.length === 0) return -1;
  const mine = winningColumns(board, toMove);
  if (mine.length > 0) return mine[0];
  const theirs = winningColumns(board, other(toMove));
  if (theirs.length > 0) return theirs[0];
  const prefs = moves.slice();
  if (Math.random() < 0.35 && prefs.length > 1) {
    // occasional second-choice keeps medium beatable in straight races
    prefs.reverse();
  }
  return prefs[0];
}

/** Easy AI — random valid column, but takes an instant win half the time. */
export function easyMove(board, toMove) {
  const moves = validColumns(board);
  if (moves.length === 0) return -1;
  const wins = winningColumns(board, toMove);
  if (wins.length > 0 && Math.random() < 0.5) return wins[0];
  return moves[Math.floor(Math.random() * moves.length)];
}

export function aiMove(board, toMove, difficulty, hardDepth = 7) {
  if (difficulty === 'hard') return hardMove(board, toMove, hardDepth);
  if (difficulty === 'medium') return mediumMove(board, toMove);
  return easyMove(board, toMove);
}
