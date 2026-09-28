/**
 * ============================================================================
 * core.js — Checkers (Draughts) — pure model, no DOM (the test surface)
 * ============================================================================
 * plan/games/06-checkers.md. The most intricate model in the empty-board
 * family: forced captures, multi-jump chains, crowning, and the quiet-move
 * draw guard. game.js is the UI shell; this file is what the jest suite
 * (src/__tests__/games-checkers-core.test.ts) and the backend service's TS
 * mirror exercise.
 *
 * BOARD — the classic 32 playable (dark) squares of an 8×8 board, so square
 * `sq` maps to row `sq / 4` and to a board FILE 0–7. Even rows take the odd
 * files (1,3,5,7), odd rows the even files (0,2,4,6):
 *
 *     row 0   .  0  1  2  3  .      sq  0..3
 *     row 1   4  .  5  6  .  7      sq  4..7
 *     row 2   .  8  9 10 11  .      sq  8..11
 *     ...
 *     row 7  28 . 29 30 31  .      sq 28..31
 *
 * PIECES — Uint8Array(32): 0 empty · 1 red man · 2 red king · 3 black man ·
 * 4 black king. RED (1) opens and moves UP the board, crowning on row 0;
 * BLACK (2) moves DOWN, crowning on row 7.
 *
 * A MOVE is one STEP, not a whole turn: a simple slide, or a single jump
 * {from, to, over}. That granularity is what lets the server validate a
 * multi-jump cell by cell — a client cannot silently skip or shorten a chain
 * (plan §5).
 *
 * RULE CHOICE (English draughts): a man that reaches the crown row DURING a
 * jump is crowned and its move ENDS there — it does not keep jumping as a
 * fresh king in the same turn.
 * ============================================================================
 */

export const BOARD_ROWS = 8;
export const SQUARES = 32;

export const EMPTY = 0;
export const RED_MAN = 1;
export const RED_KING = 2;
export const BLACK_MAN = 3;
export const BLACK_KING = 4;

export const RED = 1;
export const BLACK = 2;

/** The row a side crowns on, and the row its men start on. */
export const CROWN_ROW = { 1: 0, 2: 7 };
export const START_ROW = { 1: 5, 2: 0 };

/** Quiet plies (a capture, or a man advancing, resets it) before a draw. */
export const DRAW_QUIET_PLIES = 80; // 40 full moves

/* ---- geometry ------------------------------------------------------------- */

export function rowOf(sq) {
  return (sq / 4) | 0;
}

/** Board file (column) 0–7 for a square index. */
export function fileOf(sq) {
  return 2 * (sq % 4) + (rowOf(sq) % 2 === 0 ? 1 : 0);
}

/** Square index at (row, file), or -1 when off-board or a light square. */
export function squareAt(row, file) {
  if (row < 0 || row >= BOARD_ROWS || file < 0 || file >= BOARD_ROWS) return -1;
  // dark squares only: even rows sit on odd files, odd rows on even files
  if (file % 2 !== (row % 2 === 0 ? 1 : 0)) return -1;
  return row * 4 + (file >> 1);
}

/** "c3" style label for a square (file letter + row number, 1-based). */
export function squareLabel(sq) {
  return String.fromCharCode(97 + fileOf(sq)) + (rowOf(sq) + 1);
}

export function other(side) {
  return side === RED ? BLACK : RED;
}

export function sideOf(piece) {
  if (piece === RED_MAN || piece === RED_KING) return RED;
  if (piece === BLACK_MAN || piece === BLACK_KING) return BLACK;
  return 0;
}

export function isKing(piece) {
  return piece === RED_KING || piece === BLACK_KING;
}

export function manOf(side) {
  return side === RED ? RED_MAN : BLACK_MAN;
}

export function kingOf(side) {
  return side === RED ? RED_KING : BLACK_KING;
}

/** Row delta a MAN of `side` moves by (−1 for red/up, +1 for black/down). */
export function forwardOf(side) {
  return side === RED ? -1 : 1;
}

export function countPieces(board, side) {
  let men = 0;
  let kings = 0;
  for (let sq = 0; sq < SQUARES; sq++) {
    const piece = board[sq];
    if (sideOf(piece) !== side) continue;
    if (isKing(piece)) kings++;
    else men++;
  }
  return { men, kings, total: men + kings };
}

/** A fresh board: 12 men a side, red on the bottom three rows. */
export function initialBoard() {
  const board = new Uint8Array(SQUARES);
  for (let sq = 0; sq < SQUARES; sq++) {
    const row = rowOf(sq);
    if (row <= 2) board[sq] = BLACK_MAN;
    else if (row >= 5) board[sq] = RED_MAN;
  }
  return board;
}

/** JSON-safe copy for the wire (a Uint8Array does not survive JSON.parse). */
export function toArray(board) {
  return Array.from(board);
}

export function fromArray(cells) {
  const board = new Uint8Array(SQUARES);
  for (let sq = 0; sq < SQUARES; sq++) {
    const piece = Number(cells?.[sq]) | 0;
    board[sq] = piece >= EMPTY && piece <= BLACK_KING ? piece : EMPTY;
  }
  return board;
}

export function cloneBoard(board) {
  return Uint8Array.from(board);
}

/* ---- moves ---------------------------------------------------------------- */

/** Diagonal step vectors: all four for a king, forward pair for a man. */
function directionsFor(piece) {
  if (isKing(piece)) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }
  const f = forwardOf(sideOf(piece));
  return [
    [f, -1],
    [f, 1],
  ];
}

/** Every jump landing square available to the piece on `sq`, for `side`. */
export function jumpTargetsFrom(board, sq, side) {
  const piece = board[sq];
  if (sideOf(piece) !== side) return [];
  const row = rowOf(sq);
  const file = fileOf(sq);
  const targets = [];
  for (const [dr, df] of directionsFor(piece)) {
    const over = squareAt(row + dr, file + df);
    const to = squareAt(row + 2 * dr, file + 2 * df);
    if (over < 0 || to < 0) continue;
    const victim = board[over];
    if (victim === EMPTY || sideOf(victim) === side) continue; // empty or own
    if (board[to] !== EMPTY) continue; // blocked landing
    targets.push({ from: sq, to, over });
  }
  return targets;
}

/** Every simple slide available to the piece on `sq`, for `side`. */
export function slideTargetsFrom(board, sq, side) {
  const piece = board[sq];
  if (sideOf(piece) !== side) return [];
  const row = rowOf(sq);
  const file = fileOf(sq);
  const targets = [];
  for (const [dr, df] of directionsFor(piece)) {
    const to = squareAt(row + dr, file + df);
    if (to < 0 || board[to] !== EMPTY) continue;
    targets.push({ from: sq, to });
  }
  return targets;
}

/** Does ANY of `side`'s pieces have a jump? (drives the forced-capture rule) */
export function hasAnyJump(board, side) {
  for (let sq = 0; sq < SQUARES; sq++) {
    if (sideOf(board[sq]) !== side) continue;
    if (jumpTargetsFrom(board, sq, side).length > 0) return true;
  }
  return false;
}

/**
 * The legal moves for `side`.
 *
 *  - `from` given → only jumps for THAT piece (a multi-jump continuation:
 *    the chain must carry on with the piece that is mid-jump, and may not
 *    be swapped for another piece or cut short).
 *  - `from` null  → the classic forced-capture rule: if any jump exists the
 *    ONLY legal moves are jumps, otherwise any slide.
 */
export function legalMoves(board, side, from = null) {
  if (from !== null && from !== undefined) {
    return jumpTargetsFrom(board, from, side);
  }
  const jumps = [];
  for (let sq = 0; sq < SQUARES; sq++) {
    if (sideOf(board[sq]) !== side) continue;
    jumps.push(...jumpTargetsFrom(board, sq, side));
  }
  if (jumps.length > 0) return jumps;
  const slides = [];
  for (let sq = 0; sq < SQUARES; sq++) {
    if (sideOf(board[sq]) !== side) continue;
    slides.push(...slideTargetsFrom(board, sq, side));
  }
  return slides;
}

export function isLegalMove(board, side, move) {
  if (!move) return false;
  const legal = legalMoves(board, side);
  return legal.some((m) => m.from === move.from && m.to === move.to);
}

/**
 * Play one step.
 *
 * Returns `{ board, move, captured, crowned, chain, turn }`:
 *  - `captured` — the square whose man was taken (null for a slide)
 *  - `crowned`  — the mover reached the crown row as a MAN and is now a king
 *  - `chain`    — the same side moves again (more jumps remain for that piece)
 *  - `turn`     — who moves next
 * Throws when the step is not legal — the server relies on this to reject
 * illegal steps rather than silently repairing them.
 */
export function applyMove(board, side, move) {
  // Resolve the CANONICAL move rather than trusting the caller's object: a
  // jump posted as {from, to} with no `over` would otherwise teleport the
  // piece two squares and skip the capture entirely (found by the spec
  // suite). The server depends on this — the capture is derived, not claimed.
  const legal = legalMoves(board, side).find((m) => m.from === move?.from && m.to === move?.to);
  if (!legal) throw new Error('Illegal checkers move');
  const step = legal;
  const next = cloneBoard(board);
  const piece = next[step.from];
  const capture = step.over !== undefined && step.over !== null;
  next[step.from] = EMPTY;
  if (capture) next[step.over] = EMPTY;
  next[step.to] = piece;

  const crowned = !isKing(piece) && rowOf(step.to) === CROWN_ROW[side];
  if (crowned) next[step.to] = kingOf(side);

  // A man crowns at the END of its chain (English draughts) — so crowning
  // always hands the turn over, even if the new king could jump again.
  const chain = capture && !crowned && jumpTargetsFrom(next, step.to, side).length > 0;

  return {
    board: next,
    move: { from: step.from, to: step.to, ...(capture ? { over: step.over } : {}) },
    captured: capture ? step.over : null,
    crowned,
    chain,
    turn: chain ? side : other(side),
  };
}

/** Play a whole forced-capture chain, following `picks[1..]` as continuations. */
export function playChain(board, side, first, picks = []) {
  const steps = [];
  let result = applyMove(board, side, first);
  steps.push(result.move);
  let current = side;
  for (const pick of picks) {
    if (!result.chain) break;
    result = applyMove(result.board, current, pick);
    steps.push(result.move);
  }
  return { steps, board: result.board, turn: result.turn, side };
}

/* ---- outcome -------------------------------------------------------------- */

/** `side` is out of moves when it has no pieces, or none that can move. */
export function isStalemated(board, side) {
  return countPieces(board, side).total === 0 || legalMoves(board, side).length === 0;
}

/**
 * Round result for the side that just moved, or null while it is playing.
 * `quietPlies` — plies since the last capture or man advancement — decides
 * the draw (plan §2: 40 quiet moves).
 */
export function outcome(board, side, quietPlies = 0) {
  if (isStalemated(board, other(side))) return side;
  if (quietPlies >= DRAW_QUIET_PLIES) return 'draw';
  return null;
}

/** Did this step reset the quiet-move clock? (a capture, or a man advancing) */
export function advancesClock(board, side, move) {
  if (move && move.over !== undefined && move.over !== null) return true; // capture
  const piece = board[move ? move.from : -1];
  if (isKing(piece)) return false;
  const before = rowOf(move.from);
  const after = rowOf(move.to);
  return side === RED ? after < before : after > before;
}

/* ---- evaluation ------------------------------------------------------------ */

const MAN_VALUE = 100;
const KING_VALUE = 178;
const ADVANCE_BONUS = 5; // per row closer to crowning
const EDGE_BONUS = 3; // centre columns are harder to corner
const BACK_ROW_BONUS = 4; // a man parked on its own back row is awkward to kill

/** Score for `side` from `side`'s point of view (positive = good for it). */
export function evaluate(board, side) {
  const foe = other(side);
  let score = 0;
  for (let sq = 0; sq < SQUARES; sq++) {
    const piece = board[sq];
    const who = sideOf(piece);
    if (!who) continue;
    const row = rowOf(sq);
    const file = fileOf(sq);
    let value = isKing(piece) ? KING_VALUE : MAN_VALUE;
    if (!isKing(piece)) {
      // men are worth more the closer they are to crowning
      const progress = side === RED ? START_ROW[RED] - row : row - START_ROW[BLACK];
      value += progress * ADVANCE_BONUS;
      if (row === START_ROW[who]) value += BACK_ROW_BONUS;
    }
    // the middle files (2..5) are the contested ones
    if (file >= 2 && file <= 5) value += EDGE_BONUS;
    score += who === side ? value : -value;
  }
  // running short of material is worse than the raw count says
  const mine = countPieces(board, side).total;
  const theirs = countPieces(board, foe).total;
  score += (mine - theirs) * 12;
  return score;
}

/* ---- AI -------------------------------------------------------------------- */

/** Longest jump chain reachable from `sq` — used to order and value moves. */
export function chainLength(board, sq, side) {
  const piece = board[sq];
  if (!piece) return 0;
  const next = cloneBoard(board);
  next[sq] = EMPTY;
  let best = 0;
  for (const jump of jumpTargetsFrom(board, sq, side)) {
    const after = cloneBoard(next);
    after[jump.over] = EMPTY;
    after[jump.to] = piece;
    const crowned = !isKing(piece) && rowOf(jump.to) === CROWN_ROW[side];
    // crowning ends the chain (English draughts)
    if (crowned) return Math.max(best, 1);
    best = Math.max(best, 1 + chainLength(after, jump.to, side));
  }
  return best;
}

/** Capture-first ordering so alpha-beta prunes early. */
function orderedMoves(board, side) {
  const moves = legalMoves(board, side);
  return moves
    .map((move) => {
      const isCapture = move.over !== undefined;
      return {
        move,
        score: isCapture ? 1000 + chainLength(board, move.from, side) : evaluate(board, side),
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.move);
}

/**
 * Negamax with alpha-beta. Terminal scores are depth-shaped so the AI takes a
 * quick win over a slow one and drags a lost game out.
 *
 * `maxNodes` caps the work so a hard search can never hang the tab; hitting
 * the cap returns the best move found so far (still a legal one).
 */
export function search(board, side, depth, options = {}) {
  const maxNodes = options.maxNodes ?? 120000;
  const quietPlies = options.quietPlies ?? 0;
  let nodes = 0;
  let aborted = false;

  function quietAfter(step, capture) {
    if (capture) return 0;
    const piece = board[step.from];
    if (isKing(piece)) return quietPlies + 1;
    const forward = forwardOf(side);
    return rowOf(step.to) === rowOf(step.from) + forward ? 0 : quietPlies + 1;
  }

  function negamax(position, mover, remaining, alpha, beta, quiet) {
    nodes++;
    if (nodes > maxNodes) {
      aborted = true;
      return evaluate(position, mover);
    }
    if (remaining === 0) return evaluate(position, mover);
    const foe = other(mover);
    if (isStalemated(position, foe)) return 100000 - (depth - remaining) * 10;
    if (isStalemated(position, mover)) return -100000 + (depth - remaining) * 10;
    if (quiet >= DRAW_QUIET_PLIES) return evaluate(position, mover) - 40; // a draw is a poor win

    const moves = orderedMoves(position, mover);
    let best = -Infinity;
    for (const move of moves) {
      const capture = move.over !== undefined;
      const next = cloneBoard(position);
      const piece = next[move.from];
      next[move.from] = EMPTY;
      if (capture) next[move.over] = EMPTY;
      next[move.to] = piece;
      if (!isKing(piece) && rowOf(move.to) === CROWN_ROW[mover]) next[move.to] = kingOf(mover);
      const value = -negamax(next, foe, remaining - 1, -beta, -alpha, quietAfter(move, capture));
      if (value > best) best = value;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break; // cutoff
    }
    return best;
  }

  const root = orderedMoves(board, side);
  if (root.length === 0) return null;
  let bestMove = root[0];
  let bestValue = -Infinity;
  let alpha = -Infinity;
  for (const move of root) {
    const capture = move.over !== undefined;
    const next = cloneBoard(board);
    const piece = next[move.from];
    next[move.from] = EMPTY;
    if (capture) next[move.over] = EMPTY;
    next[move.to] = piece;
    if (!isKing(piece) && rowOf(move.to) === CROWN_ROW[side]) next[move.to] = kingOf(side);
    const value = -negamax(
      next,
      other(side),
      depth - 1,
      -Infinity,
      -alpha,
      quietAfter(move, capture)
    );
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
      alpha = value;
    }
    if (aborted) break;
  }
  return { move: bestMove, value: bestValue, nodes, aborted };
}

/** Easy AI — a uniformly random legal step. */
export function easyMove(board, side) {
  const moves = legalMoves(board, side);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Medium AI — one ply of reasoning: take the longest chain available, else
 * shuffle the man furthest up the board while staying off squares the enemy
 * can jump into.
 */
export function mediumMove(board, side) {
  const moves = legalMoves(board, side);
  if (moves.length === 0) return null;
  const foe = other(side);

  const captures = moves.filter((move) => move.over !== undefined);
  if (captures.length > 0) {
    let best = captures[0];
    let bestLen = -1;
    for (const move of captures) {
      const len = chainLength(board, move.from, side);
      if (len > bestLen) {
        bestLen = len;
        best = move;
      }
    }
    return best;
  }

  // no capture for us — do we risk walking into one?
  const safe = [];
  const risky = [];
  for (const move of moves) {
    const after = cloneBoard(board);
    const piece = after[move.from];
    after[move.from] = EMPTY;
    after[move.to] = piece;
    if (!isKing(piece) && rowOf(move.to) === CROWN_ROW[side]) after[move.to] = kingOf(side);
    if (hasAnyJump(after, foe)) risky.push(move);
    else safe.push(move);
  }
  const pool = safe.length > 0 ? safe : risky;
  // among the safe ones push the most advanced man forward
  let best = pool[0];
  let bestScore = -Infinity;
  for (const move of pool) {
    const piece = board[move.from];
    const score = isKing(piece)
      ? 0
      : side === RED
        ? START_ROW[RED] - rowOf(move.to)
        : rowOf(move.to) - START_ROW[BLACK];
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

/** How deep the hard AI looks — shallower as the position gets more settled. */
export function hardDepth(board, side) {
  const mine = countPieces(board, side).total;
  const theirs = countPieces(board, other(side)).total;
  if (mine <= 2 || theirs <= 2) return 10; // race the finish
  if (mine + theirs <= 8) return 9;
  if (mine + theirs <= 14) return 8;
  return 6;
}

export function aiMove(board, side, difficulty, options = {}) {
  if (difficulty === 'hard') {
    const found = search(board, side, hardDepth(board, side), options);
    return found ? found.move : null;
  }
  if (difficulty === 'medium') return mediumMove(board, side);
  return easyMove(board, side);
}

/** Captures available anywhere for `side` — the UI's "must capture" banner. */
export function captureMoves(board, side) {
  return legalMoves(board, side).filter((move) => move.over !== undefined);
}
