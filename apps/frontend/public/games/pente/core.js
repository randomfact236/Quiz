/**
 * ============================================================================
 * core.js — Pente (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/23-pente.md. Gomoku's meaner sibling: five in a row wins, but
 * flanking a PAIR captures it, and a player who collects 5 pairs wins first.
 * Pair-captures are what make a draw almost impossible.
 *
 * BOARD — a plain (0|1|2)[] row-major grid (15×15 or 19×19) so it survives JSON
 * untouched. 0 empty, 1 black, 2 white. The CENTRE stone is a rules constant
 * placed by the game before play (like Othello's opening discs), not served
 * content — every other intersection is player-placed.
 *
 * A CAPTURE needs your two stones bracketing EXACTLY two enemy stones, closed
 * by the stone you just placed. One or three does not capture; several pairs
 * can be taken by a single placement.
 * ============================================================================
 */

export const BOARD_SIZES = [15, 19];
export const DEFAULT_SIZE = 19;

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

/** Five in a row. */
export const WIN_LENGTH = 5;
/** Pairs a player must capture to win on points. */
export const CAPTURE_TARGET = 5;

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
  return side === BLACK ? WHITE : BLACK;
}

export function sizeOf(cells) {
  return Math.round(Math.sqrt(cells.length));
}

export function at(cells, row, file) {
  const size = sizeOf(cells);
  if (row < 0 || row >= size || file < 0 || file >= size) return -1;
  return row * size + file;
}

export function centreOf(size) {
  const mid = Math.floor(size / 2);
  return mid * size + mid;
}

/** A board with the centre stone already down — black opens with it. */
export function initialBoard(size = DEFAULT_SIZE) {
  const cells = new Array(size * size).fill(EMPTY);
  cells[centreOf(size)] = BLACK;
  return cells;
}

export function cloneCells(cells) {
  return cells.slice();
}

export function isEmpty(cells, idx) {
  return idx >= 0 && idx < cells.length && cells[idx] === EMPTY;
}

/* ---- captures -------------------------------------------------------------- */

/**
 * Walk the 8 rays out from `idx` and report every run of exactly TWO enemy
 * stones bracketed by one of `side`'s own — i.e. the pairs this placement
 * captures. Returns a flat list of the captured squares.
 *
 * A run of 1 or 3 (or more) captures nothing: the rule is "exactly two".
 */
export function capturesAt(cells, idx, side, size = sizeOf(cells)) {
  if (!isEmpty(cells, idx)) return [];
  const foe = other(side);
  const row = Math.floor(idx / size);
  const file = idx % size;
  const taken = [];

  for (const [dr, df] of DIRS) {
    let r = row + dr;
    let f = file + df;
    let run = 0;
    // count the contiguous enemy run
    while (r >= 0 && r < size && f >= 0 && f < size) {
      const square = r * size + f;
      if (cells[square] === foe) {
        run++;
        r += dr;
        f += df;
      } else {
        break;
      }
    }
    if (run !== 2) continue; // one or three is not a capture
    // the run must be closed by one of OUR stones on the far side
    if (r >= 0 && r < size && f >= 0 && f < size && cells[r * size + f] === side) {
      // back-fill the two squares we walked over
      let br = row + dr;
      let bf = file + df;
      for (let i = 0; i < 2; i++) {
        taken.push(br * size + bf);
        br += dr;
        bf += df;
      }
    }
  }
  return taken;
}

/** How many pairs this placement captures (2 squares per pair). */
export function pairsAt(cells, idx, side, size = sizeOf(cells)) {
  return capturesAt(cells, idx, side, size).length / 2;
}

/* ---- five in a row ---------------------------------------------------------- */

/** Does `side` have five (or more) in a row through `idx`? */
export function makesFive(cells, idx, side, size = sizeOf(cells)) {
  if (cells[idx] !== side) return false;
  const row = Math.floor(idx / size);
  const file = idx % size;
  for (const [dr, df] of DIRS) {
    let count = 1;
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let f = file + df * sign;
      while (r >= 0 && r < size && f >= 0 && f < size && cells[r * size + f] === side) {
        count++;
        r += dr * sign;
        f += df * sign;
      }
    }
    if (count >= WIN_LENGTH) return true;
  }
  return false;
}

/** Every empty square where `side` could play — O(n·8) but the board is small. */
export function legalMoves(cells, side, size = sizeOf(cells)) {
  const moves = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] !== EMPTY) continue;
    if (pairsAt(cells, idx, side, size) > 0) moves.push(idx);
  }
  return moves;
}

/* ---- playing ---------------------------------------------------------------- */

/**
 * Play one stone: place it, remove every pair it captured, and hand the turn
 * on. Captures are resolved BEFORE the five-in-a-row check, because a stone
 * that captured can no longer be part of a line it broke.
 *
 * Returns `{ cells, turn, captured, pairs, line, over, winner }` where `line`
 * is true when the placement itself made five.
 */
export function applyMove(cells, side, idx) {
  const size = sizeOf(cells);
  if (!isEmpty(cells, idx)) throw new Error('Illegal Pente move');
  const captured = capturesAt(cells, idx, side, size);
  const next = cloneCells(cells);
  next[idx] = side;
  for (const square of captured) next[square] = EMPTY;

  const line = makesFive(next, idx, side, size);
  return { cells: next, turn: other(side), captured, pairs: captured.length / 2, line, over: false, winner: null };
}

/* ---- counts and outcome ------------------------------------------------------ */

export function stoneCount(cells) {
  let black = 0;
  let white = 0;
  for (const cell of cells) {
    if (cell === BLACK) black++;
    else if (cell === WHITE) white++;
  }
  return { black, white, empty: cells.length - black - white, total: cells.length };
}

/** Has `side` five in a row anywhere? (not just through the last move) */
export function hasLine(cells, side, size = sizeOf(cells)) {
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] === side && makesFive(cells, idx, side, size)) return true;
  }
  return false;
}

/**
 * The result for the side that just moved: it wins on a line, or on having
 * collected `target` pairs. `captures` is [blackPairs, whitePairs].
 * Returns `{ winner, line, points }` or null while the game is live.
 */
export function outcome(cells, side, captures, target = CAPTURE_TARGET, size = sizeOf(cells)) {
  const index = side === BLACK ? 0 : 1;
  const pairs = captures[index] || 0;
  if (hasLine(cells, side, size)) return { winner: side, line: true, points: pairs };
  if (pairs >= target) return { winner: side, line: false, points: pairs };
  return null;
}

/** The board is full and nobody has won — vanishingly rare in Pente, but real. */
export function isFull(cells) {
  return cells.every((cell) => cell !== EMPTY);
}

/* ---- evaluation ---------------------------------------------------------------- */

/**
 * Line potential for `side`: rewards open runs and stones near the centre,
 * which is where play concentrates on a 19×19 board.
 */
export function evaluate(cells, side) {
  const size = sizeOf(cells);
  const mid = (size - 1) / 2;
  let score = 0;
  for (let idx = 0; idx < cells.length; idx++) {
    const cell = cells[idx];
    if (cell === EMPTY) continue;
    const row = Math.floor(idx / size);
    const file = idx % size;
    // distance from the centre, normalised — the further out, the less it counts
    const distance = (Math.abs(row - mid) + Math.abs(file - mid)) / (2 * mid || 1);
    let value = 10 + Math.round(10 * (1 - distance));
    if (cell === side) score += value;
    else score -= value;
  }
  // a capture is worth a lot more than a stone
  const foe = other(side);
  for (let idx = 0; idx < cells.length; idx++) {
    if (!isEmpty(cells, idx)) continue;
    score += pairsAt(cells, idx, side, size) * 45;
    score -= pairsAt(cells, idx, foe, size) * 45;
  }
  return score;
}

/* ---- AI -------------------------------------------------------------------------- */

/** Easy AI — a legal-ish move: centre-out random, never wasting a capture. */
export function easyMove(cells, side, size = sizeOf(cells), rand = Math.random) {
  if (isFull(cells)) return null;
  const mid = (size - 1) / 2;
  // always take a capture if one exists — even easy must not be absurd
  for (let idx = 0; idx < cells.length; idx++) {
    if (isEmpty(cells, idx) && pairsAt(cells, idx, side, size) > 0) return idx;
  }
  // then the nearest empty to the centre, chosen at random among equals
  const empties = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] === EMPTY) empties.push(idx);
  }
  if (empties.length === 0) return null;
  let bestDistance = Infinity;
  for (const idx of empties) {
    const row = Math.floor(idx / size);
    const file = idx % size;
    const d = Math.abs(row - mid) + Math.abs(file - mid);
    if (d < bestDistance) bestDistance = d;
  }
  const nearest = empties.filter((idx) => {
    const row = Math.floor(idx / size);
    const file = idx % size;
    return Math.abs(row - mid) + Math.abs(file - mid) === bestDistance;
  });
  return nearest[Math.floor(rand() * nearest.length)];
}

/**
 * Medium AI — one ply of reasoning: win now, capture, block the opponent's
 * five, block their capture, then take the best-scoring square.
 */
export function mediumMove(cells, side, size = sizeOf(cells)) {
  if (isFull(cells)) return null;
  const foe = other(side);
  const empties = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] === EMPTY) empties.push(idx);
  }
  if (empties.length === 0) return null;

  // 1. complete five of our own
  for (const idx of empties) {
    const next = cloneCells(cells);
    next[idx] = side;
    if (makesFive(next, idx, side, size)) return idx;
  }
  // 2. take a capture
  const captures = empties.filter((idx) => pairsAt(cells, idx, side, size) > 0);
  if (captures.length > 0) {
    let best = captures[0];
    let bestPairs = -1;
    for (const idx of captures) {
      const p = pairsAt(cells, idx, side, size);
      if (p > bestPairs) {
        bestPairs = p;
        best = idx;
      }
    }
    return best;
  }
  // 3. block the opponent's five
  for (const idx of empties) {
    const next = cloneCells(cells);
    next[idx] = foe;
    if (makesFive(next, idx, foe, size)) return idx;
  }
  // 4. block the opponent's capture
  const theirCaptures = empties.filter((idx) => pairsAt(cells, idx, foe, size) > 0);
  if (theirCaptures.length > 0) return theirCaptures[0];
  // 5. otherwise the best square by the static evaluation
  let best = empties[0];
  let bestScore = -Infinity;
  for (const idx of empties) {
    const next = cloneCells(cells);
    next[idx] = side;
    for (const sq of capturesAt(cells, idx, side, size)) next[sq] = EMPTY;
    const score = evaluate(next, side);
    if (score > bestScore) {
      bestScore = score;
      best = idx;
    }
  }
  return best;
}

/**
 * Move ordering for the alpha-beta search: an immediate win first, then a
 * capture, then blocking the opponent, then the static evaluation. Cheap to
 * compute and it matters enormously — on a 19×19 board the node cap is hit
 * within a ply or two, so whatever is searched first is effectively the move
 * that gets played.
 */
function moveHint(cells, idx, mover, size) {
  let hint = 0;
  const foe = other(mover);
  const test = cloneCells(cells);
  test[idx] = mover;
  if (makesFive(test, idx, mover, size)) hint += 1000000;
  hint += pairsAt(cells, idx, mover, size) * 1000;
  const block = cloneCells(cells);
  block[idx] = foe;
  if (makesFive(block, idx, foe, size)) hint += 5000;
  hint += pairsAt(cells, idx, foe, size) * 500;
  return hint;
}

/**
 * Hard AI — alpha-beta over the real tree, with the capture rule applied at
 * every node. `maxNodes` bounds the work; `depth` is derived from the empty
 * count so the search stays inside a click.
 */
export function search(cells, side, captures, options = {}) {
  const maxNodes = options.maxNodes ?? 60000;
  const size = sizeOf(cells);
  let nodes = 0;
  let aborted = false;

  const score = (position, mover, capts) => {
    if (hasLine(position, mover, size)) return 100000;
    if (hasLine(position, other(mover), size)) return -100000;
    const index = mover === BLACK ? 0 : 1;
    return evaluate(position, mover) + (capts[index] || 0) * 30;
  };

  function negamax(position, mover, capts, depth, alpha, beta) {
    nodes++;
    if (nodes > maxNodes) {
      aborted = true;
      return score(position, mover, capts);
    }
    if (depth <= 0) return score(position, mover, capts);
    const empties = [];
    for (let idx = 0; idx < position.length; idx++) {
      if (position[idx] === EMPTY) empties.push(idx);
    }
    if (empties.length === 0) return score(position, mover, capts);
    // near the end, brute-force to the end of the game
    const exact = empties.length <= 6;
    let best = -Infinity;
    // captures and near-centre first: the moves that matter, so alpha bites
    const ordered = empties
      .map((idx) => ({ idx, hint: moveHint(position, idx, mover, size) }))
      .sort((a, b) => b.hint - a.hint)
      .map((e) => e.idx);

    for (const idx of ordered) {
      const taken = capturesAt(position, idx, mover, size);
      const next = cloneCells(position);
      next[idx] = mover;
      for (const square of taken) next[square] = EMPTY;
      if (makesFive(next, idx, mover, size)) return exact ? 100000 - (6 - depth) : 50000;
      const nextCapts = capts.slice();
      const index = mover === BLACK ? 0 : 1;
      nextCapts[index] = (nextCapts[index] || 0) + taken.length / 2;
      const value = -negamax(
        next,
        other(mover),
        nextCapts,
        exact ? depth - 1 : depth - 1,
        -beta,
        -alpha
      );
      if (value > best) best = value;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
      if (aborted) break;
    }
    return best;
  }

  const empties = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] === EMPTY) empties.push(idx);
  }
  if (empties.length === 0) return null;
  const depth = Math.max(1, Math.min(empties.length, 8));

  // The ROOT must be ordered by the same hint as the inner nodes. On a 19x19
  // board the node cap is hit within the first ply or two, so an unordered
  // root returns whichever square sits lowest in the index — it would pass up
  // a free capture and take a corner stone instead.
  const ordered = empties
    .map((idx) => ({ idx, hint: moveHint(cells, idx, side, size) }))
    .sort((a, b) => b.hint - a.hint)
    .map((e) => e.idx);

  let bestMove = ordered[0];
  let bestValue = -Infinity;
  for (const idx of ordered) {
    const taken = capturesAt(cells, idx, side, size);
    const next = cloneCells(cells);
    next[idx] = side;
    for (const square of taken) next[square] = EMPTY;
    if (makesFive(next, idx, side, size)) return { move: idx, value: 100000, nodes, aborted: false };
    const nextCapts = captures.slice();
    const index = side === BLACK ? 0 : 1;
    nextCapts[index] = (nextCapts[index] || 0) + taken.length / 2;
    const value = -negamax(next, other(side), nextCapts, depth - 1, -Infinity, -bestValue);
    if (value > bestValue) {
      bestValue = value;
      bestMove = idx;
    }
    if (aborted) break;
  }
  return { move: bestMove, value: bestValue, nodes, aborted };
}

export function aiMove(cells, side, captures, difficulty, options = {}) {
  if (difficulty === 'hard') {
    const found = search(cells, side, captures, options);
    return found ? found.move : null;
  }
  if (difficulty === 'medium') return mediumMove(cells, side);
  return easyMove(cells, side, sizeOf(cells), options.rand);
}

/* ---- safety ---------------------------------------------------------------------- */

/** Sanitise an untrusted board (the wire) into a legal 0|1|2 array. */
export function fromArray(cells, size = DEFAULT_SIZE) {
  const out = new Array(size * size).fill(EMPTY);
  for (let i = 0; i < out.length; i++) {
    const cell = Number(cells?.[i]) | 0;
    out[i] = cell === BLACK || cell === WHITE ? cell : EMPTY;
  }
  return out;
}
