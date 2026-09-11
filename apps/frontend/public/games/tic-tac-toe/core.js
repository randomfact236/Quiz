/**
 * ============================================================================
 * core.js — Tic Tac Toe (pure model, no DOM — the test surface)
 * ============================================================================
 * Extracted from game.js (Rev 2 architecture, plan/games/02-tic-tac-toe.md
 * §12, reference 03-sliding-puzzle.md Rev 2). game.test.html and the jest
 * suite (src/__tests__/games-tic-tac-toe.test.ts) import this module
 * directly; game.js is the UI shell.
 *
 * Board model = Array(9) of null | 'X' | 'O'. X is the first mover of the
 * series; the loser of a round starts the next one (starter flips on draw).
 * ============================================================================
 */

/** The 8 winning lines as cell index triples. */
export const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // columns
  [0, 4, 8],
  [2, 4, 6], // diagonals
];

export function emptyBoard() {
  return [null, null, null, null, null, null, null, null, null];
}

export function other(mark) {
  return mark === 'X' ? 'O' : 'X';
}

export function legalMoves(board) {
  const moves = [];
  for (let i = 0; i < 9; i++) if (!board[i]) moves.push(i);
  return moves;
}

/**
 * Rule-agnostic board check: returns { completedBy, line } when a mark
 * completed a line, 'draw' when the board is full without one, else null.
 * Misère interpretation happens in roundOutcome() / scoring, not here.
 */
export function checkWinner(board) {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const line = WIN_LINES[i];
    const a = board[line[0]];
    if (a && a === board[line[1]] && a === board[line[2]]) {
      return { completedBy: a, line };
    }
  }
  for (let j = 0; j < 9; j++) if (!board[j]) return null;
  return 'draw';
}

/**
 * Rules-aware round outcome: { winner, line } | 'draw' | null (game going).
 * Under the misère variant the mark that completes a line LOSES, so the
 * reported winner is the opponent (line still identifies the losing row).
 */
export function roundOutcome(board, misere) {
  const result = checkWinner(board);
  if (result === null || result === 'draw') return result;
  return {
    winner: misere ? other(result.completedBy) : result.completedBy,
    line: result.line,
    completedBy: result.completedBy,
  };
}

/**
 * Negamax game value from the perspective of `toMove`, for the position
 * AFTER the previous move. Wins/losses are depth-shaped so the AI prefers
 * faster wins and slower losses. Values: win > 0, draw 0, loss < 0.
 */
export function negamax(board, toMove, misere, depth) {
  const out = roundOutcome(board, misere);
  if (out === 'draw') return 0;
  if (out) return out.winner === toMove ? 10 - depth : depth - 10;
  let best = -Infinity;
  const moves = legalMoves(board);
  for (let i = 0; i < moves.length; i++) {
    board[moves[i]] = toMove;
    const value = -negamax(board, other(toMove), misere, depth + 1);
    board[moves[i]] = null;
    if (value > best) best = value;
  }
  return best;
}

/** Convenience wrapper: value of `board` for `toMove` to move. */
export function gameValue(board, toMove, misere) {
  return negamax(board, toMove, misere, 0);
}

/**
 * Hard AI — minimax with full search. Ties are broken randomly so repeated
 * rounds don't feel scripted; every returned move is still game-value
 * optimal (unbeatable). Returns { index, value } or null on a full board.
 */
export function bestMove(board, toMove, misere) {
  const moves = legalMoves(board);
  if (moves.length === 0) return null;
  let bestValue = -Infinity;
  let best = [];
  for (let i = 0; i < moves.length; i++) {
    board[moves[i]] = toMove;
    const value = -negamax(board, other(toMove), misere, 1);
    board[moves[i]] = null;
    if (value > bestValue) {
      bestValue = value;
      best = [moves[i]];
    } else if (value === bestValue) {
      best.push(moves[i]);
    }
  }
  return { index: best[Math.floor(Math.random() * best.length)], value: bestValue };
}

/**
 * Medium AI — win/block heuristic only. Normal rules: take a completing
 * move, else block the opponent's, else random. Misère twist: completing a
 * line LOSES, so "winning" moves are avoided and the level plays
 * "don't hand yourself three in a row", else random.
 */
export function mediumMove(board, toMove, misere) {
  const moves = legalMoves(board);
  if (moves.length === 0) return null;
  const safe = [];
  const completing = [];
  const blocking = [];
  for (let i = 0; i < moves.length; i++) {
    const idx = moves[i];
    const completesSelf = completesLine(board, idx, toMove);
    const completesOpponent = completesLine(board, idx, other(toMove));
    if (!completesSelf) safe.push(idx);
    if (completesSelf) completing.push(idx);
    if (completesOpponent) blocking.push(idx);
  }
  if (misere) {
    if (safe.length > 0) return safe[Math.floor(Math.random() * safe.length)];
    return moves[Math.floor(Math.random() * moves.length)]; // every move loses — any will do
  }
  if (completing.length > 0) return completing[0];
  if (blocking.length > 0) return blocking[Math.floor(Math.random() * blocking.length)];
  return moves[Math.floor(Math.random() * moves.length)];
}

/** Would placing `mark` on empty cell `idx` complete a line for it? */
export function completesLine(board, idx, mark) {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const line = WIN_LINES[i];
    if (line.indexOf(idx) === -1) continue;
    let hits = 0;
    for (let j = 0; j < 3; j++) {
      const cell = line[j] === idx ? mark : board[line[j]];
      if (cell === mark) hits++;
    }
    if (hits === 3) return true;
  }
  return false;
}

/** Easy AI — uniform random legal move. */
export function easyMove(board) {
  const moves = legalMoves(board);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

export function aiMove(board, toMove, difficulty, misere) {
  if (difficulty === 'hard') return bestMove(board, toMove, misere).index;
  if (difficulty === 'medium') return mediumMove(board, toMove, misere);
  return easyMove(board);
}
