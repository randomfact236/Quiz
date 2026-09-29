/**
 * ============================================================================
 * core.js — Othello / Reversi (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/12-othello.md. The pure model lives here; game.js is the UI shell
 * and the backend service re-implements the same rules server-side so a duel
 * cannot be faked.
 *
 * BOARD — a plain (0|1|2)[] row-major array, so it survives JSON for the wire
 * untouched. 0 empty, 1 dark (the opener, moves first), 2 light. 6×6, 8×8 and
 * 10×10 are all supported; the standard 2×2 centre opening is a RULES CONSTANT
 * of each size (like Checkers' starting ranks), not served content — every
 * other disc is placed by a player.
 *
 * A MOVE is one disc: it is legal only if it outflanks at least one straight
 * run of enemy discs closed by one of your own.
 * ============================================================================
 */

export const BOARD_SIZES = [6, 8, 10];
export const DEFAULT_SIZE = 8;

export const EMPTY = 0;
export const DARK = 1; // the opener
export const LIGHT = 2;

export const DIRS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export function other(side) {
  return side === DARK ? LIGHT : DARK;
}

export function sizeOf(cells) {
  return Math.round(Math.sqrt(cells.length));
}

export function at(cells, row, file) {
  const size = sizeOf(cells);
  if (row < 0 || row >= size || file < 0 || file >= size) return -1;
  return row * size + file;
}

/** A fresh board with the standard centre opening for this size. */
export function initialBoard(size = DEFAULT_SIZE) {
  const cells = new Array(size * size).fill(EMPTY);
  const mid = Math.floor(size / 2);
  cells[(mid - 1) * size + (mid - 1)] = LIGHT;
  cells[(mid - 1) * size + mid] = DARK;
  cells[mid * size + (mid - 1)] = DARK;
  cells[mid * size + mid] = LIGHT;
  return cells;
}

export function cloneCells(cells) {
  return cells.slice();
}

/* ---- flips ---------------------------------------------------------------- */

/**
 * The discs `side` would flip by playing at `idx` — a straight run of enemy
 * discs closed by one of `side`'s own. Returns [] for an illegal square.
 */
export function flipsFor(cells, idx, side) {
  if (idx < 0 || idx >= cells.length) return [];
  if (cells[idx] !== EMPTY) return [];
  const size = sizeOf(cells);
  const row = Math.floor(idx / size);
  const file = idx % size;
  const foe = other(side);
  const flipped = [];

  for (const [dr, df] of DIRS) {
    const run = [];
    let r = row + dr;
    let f = file + df;
    while (r >= 0 && r < size && f >= 0 && f < size) {
      const square = r * size + f;
      if (cells[square] === foe) {
        run.push(square);
      } else if (cells[square] === side) {
        if (run.length > 0) flipped.push(...run); // only a CLOSED run flips
        break;
      } else {
        break; // empty square ends the line — no bracket
      }
      r += dr;
      f += df;
    }
  }
  return flipped;
}

/** Every legal placement for `side`. */
export function legalMoves(cells, side) {
  const moves = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] !== EMPTY) continue;
    if (flipsFor(cells, idx, side).length > 0) moves.push(idx);
  }
  return moves;
}

export function isLegalMove(cells, side, idx) {
  return legalMoves(cells, side).indexOf(idx) !== -1;
}

/**
 * Play one disc: place it, flip everything it brackets, and hand the turn on.
 * A side with no legal move PASSES; when neither side can move the game is
 * over and `turn` stays with the side that could not move (the caller reads
 * `over`).
 *
 * Returns `{ cells, turn, flipped, passed, over }`. Throws on an illegal
 * placement — the server depends on that, rather than repairing it.
 */
export function applyMove(cells, side, idx) {
  const flipped = flipsFor(cells, idx, side);
  if (cells[idx] !== EMPTY || flipped.length === 0) {
    throw new Error('Illegal Othello move');
  }
  const next = cloneCells(cells);
  next[idx] = side;
  for (const square of flipped) next[square] = side;

  const foe = other(side);
  const foeCanMove = legalMoves(next, foe).length > 0;
  if (foeCanMove) {
    return { cells: next, turn: foe, flipped, passed: false, over: false };
  }
  // the foe is stuck — pass the turn back if we still have a move
  const weCanMove = legalMoves(next, side).length > 0;
  if (weCanMove) {
    return { cells: next, turn: side, flipped, passed: true, over: false };
  }
  return { cells: next, turn: foe, flipped, passed: true, over: true };
}

/**
 * Advance past a stuck side: `side` is the side TO MOVE and has no legal
 * placement, so the turn passes to its opponent — or the game ends when
 * neither can move. `passed` means "the side that was to move had to skip",
 * matching what applyMove() reports.
 *
 * If `side` actually has a move this is a no-op and the turn stays put: a
 * caller that wants the opponent's options should just read legalMoves().
 */
export function pass(cells, side) {
  const foe = other(side);
  if (legalMoves(cells, side).length > 0) {
    return { cells: cloneCells(cells), turn: side, flipped: [], passed: false, over: false };
  }
  const foeCanMove = legalMoves(cells, foe).length > 0;
  return {
    cells: cloneCells(cells),
    turn: foe,
    flipped: [],
    passed: true,
    over: !foeCanMove,
  };
}

/* ---- counts and outcome ----------------------------------------------------- */

export function discCount(cells) {
  let dark = 0;
  let light = 0;
  let empty = 0;
  for (const cell of cells) {
    if (cell === DARK) dark++;
    else if (cell === LIGHT) light++;
    else empty++;
  }
  return { dark, light, empty, total: cells.length };
}

export function isOver(cells) {
  return legalMoves(cells, DARK).length === 0 && legalMoves(cells, LIGHT).length === 0;
}

/**
 * The result: the winner (DARK/LIGHT) or 'draw', plus the counts.
 * `winner` is null on a draw so callers must not read it as a side.
 */
export function outcome(cells) {
  const { dark, light } = discCount(cells);
  const winner = dark === light ? null : dark > light ? DARK : LIGHT;
  return { winner, dark, light, draw: dark === light };
}

/* ---- evaluation -------------------------------------------------------------- */

/**
 * Static positional weights, scaled from the classic Othello disc tables. Corners
 * are worth a great deal, the X and C squares (just outside the corners) are
 * poison, and edges are mildly good. A BLACK square in the black player's own
 * numbering is worth more — the tables are given from one player's view and
 * mirrored for the other.
 */
const EVEN = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
];

function weightFor(row, file, size) {
  if (size === 8) return EVEN[row][file];
  // scale the 8×8 table onto a larger board so the other sizes still value
  // corners and avoid the X squares rather than playing blind
  const r = Math.min(7, Math.floor((row * 8) / size));
  const f = Math.min(7, Math.floor((file * 8) / size));
  return EVEN[r][f];
}

/** Positional score for `side` (positive = good for `side`). */
export function evaluate(cells, side) {
  const size = sizeOf(cells);
  let score = 0;
  for (let idx = 0; idx < cells.length; idx++) {
    const cell = cells[idx];
    if (cell === EMPTY) continue;
    const row = Math.floor(idx / size);
    const file = idx % size;
    const weight = weightFor(row, file, size);
    score += cell === side ? weight : -weight;
  }
  return score;
}

/* ---- AI ---------------------------------------------------------------------- */

/** Easy AI — the move that flips the most discs right now. */
export function easyMove(cells, side) {
  const moves = legalMoves(cells, side);
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestCount = -1;
  for (const move of moves) {
    const count = flipsFor(cells, move, side).length;
    if (count > bestCount) {
      bestCount = count;
      best = move;
    }
  }
  return best;
}

/** Medium AI — the positional table, with flips as a light tiebreak. */
export function mediumMove(cells, side) {
  const moves = legalMoves(cells, side);
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    const after = cloneCells(cells);
    const flipped = flipsFor(cells, move, side);
    after[move] = side;
    for (const square of flipped) after[square] = side;
    // positional value of the resulting board, plus a nudge for the disc count
    const score = evaluate(after, side) + flipsFor(cells, move, side).length;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

/**
 * Hard AI — alpha-beta over the real game tree, with positional + mobility.
 *
 * `maxNodes` bounds the work so a deep search can never hang the tab; hitting
 * the cap returns the best move found so far (always a legal one). From a
 * handful of empties the tree is small enough to solve exactly, which is why
 * `depth` is derived from the empties rather than fixed.
 */
export function search(cells, side, options = {}) {
  const maxNodes = options.maxNodes ?? 90000;
  let nodes = 0;
  let aborted = false;

  // mobility matters more than raw weight in the midgame; weight takes over
  // as the board fills, so blend by how many empties are left
  function score(position, mover) {
    const empty = position.filter((cell) => cell === EMPTY).length;
    const positional = evaluate(position, mover);
    const myMoves = legalMoves(position, mover).length;
    const foeMoves = legalMoves(position, other(mover)).length;
    const mobility = (myMoves - foeMoves) * 18;
    // a full board must be scored on discs alone
    if (empty === 0) {
      const { dark, light } = discCount(position);
      const diff = mover === DARK ? dark - light : light - dark;
      return diff * 1000;
    }
    return positional * 1.0 + mobility * (empty / 12);
  }

  function negamax(position, mover, depth, alpha, beta) {
    nodes++;
    if (nodes > maxNodes) {
      aborted = true;
      return score(position, mover);
    }
    const moves = legalMoves(position, mover);
    if (moves.length === 0) {
      if (legalMoves(position, other(mover)).length === 0) return score(position, mover); // terminal
      // a pass costs tempo but is not a turn: search the reply one level down
      return -negamax(position, other(mover), depth, -beta, -alpha);
    }
    if (depth <= 0) return score(position, mover);
    let best = -Infinity;
    // order: the moves the scorer likes first, so the cutoff bites early
    const ordered = moves
      .map((move) => ({
        move,
        hint: flipsFor(position, move, mover).length,
      }))
      .sort((a, b) => b.hint - a.hint)
      .map((entry) => entry.move);
    for (const move of ordered) {
      const after = cloneCells(position);
      const flipped = flipsFor(position, move, mover);
      after[move] = mover;
      for (const square of flipped) after[square] = mover;
      const value = -negamax(after, other(mover), depth - 1, -beta, -alpha);
      if (value > best) best = value;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break; // cutoff
      if (aborted) break;
    }
    return best;
  }

  const moves = legalMoves(cells, side);
  if (moves.length === 0) return null;
  const empties = cells.filter((cell) => cell === EMPTY).length;
  const maxDepth = Math.max(1, Math.min(empties, 10));

  // Iterative deepening: each pass re-searches every root move one level
  // deeper, and the answer from the last COMPLETED depth is the one returned.
  // That way the node cap degrades the search instead of corrupting it.
  let bestMove = moves[0];
  let bestValue = -Infinity;
  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let roundBest = null;
    let roundValue = -Infinity;
    for (const move of moves) {
      const after = cloneCells(cells);
      const flipped = flipsFor(cells, move, side);
      after[move] = side;
      for (const square of flipped) after[square] = side;
      const value = -negamax(after, other(side), depth - 1, -Infinity, -alpha);
      if (value > roundValue) {
        roundValue = value;
        roundBest = move;
        alpha = value;
      }
      if (aborted) break;
    }
    if (aborted) break; // keep the previous completed depth's answer
    bestMove = roundBest ?? bestMove;
    bestValue = roundValue;
  }
  return { move: bestMove, value: bestValue, nodes, aborted };
}

export function aiMove(cells, side, difficulty, options = {}) {
  if (difficulty === 'hard') {
    const found = search(cells, side, options);
    return found ? found.move : null;
  }
  if (difficulty === 'medium') return mediumMove(cells, side);
  return easyMove(cells, side);
}

/* ---- safety ------------------------------------------------------------------ */

/** Sanitise an untrusted board (the wire) into a legal 0|1|2 array. */
export function fromArray(cells, size = DEFAULT_SIZE) {
  const out = new Array(size * size).fill(EMPTY);
  for (let i = 0; i < out.length; i++) {
    const cell = Number(cells?.[i]) | 0;
    out[i] = cell === DARK || cell === LIGHT ? cell : EMPTY;
  }
  return out;
}
