/**
 * ============================================================================
 * core.js — Go 9×9 (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/39-go-9x9.md. The deepest game in the family, on a board small
 * enough to finish in a sitting.
 *
 * BOARD — a 0|1|2[] row-major 9×9 array: 0 empty, 1 black, 2 white. There is
 * no pre-filled anything; the first stone is the first player's decision.
 *
 * RULES IMPLEMENTED (and nothing else):
 *  - a group's liberties are its adjacent empty points; a group at zero
 *    liberties is removed the instant the last liberty is filled
 *  - suicide is illegal UNLESS the move captures (a snapback)
 *  - the simple ko rule: a move may not recreate the immediately previous
 *    position
 *  - two consecutive passes end the game; area scoring, komi to white
 *
 * Deliberately NOT here: handicap, superko, life-and-death reading, or any
 * endgame judgement. The hard tier is a strong-amateur search, not a
 * championship engine — plan §1 says so out loud so expectations stay sane.
 * ============================================================================
 */

export const SIZE = 9;
export const CELLS = SIZE * SIZE;

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export const DEFAULT_KOMI = 5.5;

export const centre = 40; // the middle of the 9x9 (row 4, file 4)

export function other(side) {
  return side === BLACK ? WHITE : BLACK;
}

export function rowOf(idx) {
  return Math.floor(idx / SIZE);
}

export function fileOf(idx) {
  return idx % SIZE;
}

export function idxAt(row, file) {
  if (row < 0 || row >= SIZE || file < 0 || file >= SIZE) return -1;
  return row * SIZE + file;
}

/** The four orthogonal neighbours of `idx`, as indices (-1 off-board). */
export function neighbours(idx) {
  const row = rowOf(idx);
  const file = fileOf(idx);
  return [
    idxAt(row - 1, file),
    idxAt(row + 1, file),
    idxAt(row, file - 1),
    idxAt(row, file + 1),
  ].filter((n) => n >= 0);
}

export function initialBoard() {
  return new Array(CELLS).fill(EMPTY);
}

export function cloneBoard(cells) {
  return cells.slice();
}

/* ---- groups and liberties -------------------------------------------------- */

/** The index of the group `idx` belongs to (its own index when empty). */
export function groupAt(cells, idx) {
  const colour = cells[idx];
  if (colour === EMPTY) return idx;
  const seen = new Set([idx]);
  const stack = [idx];
  const group = [];
  while (stack.length) {
    const at = stack.pop();
    group.push(at);
    for (const n of neighbours(at)) {
      if (!seen.has(n) && cells[n] === colour) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return Math.min(...group);
}

/** Every group of `colour` on the board, as arrays of indices. */
export function groupsOf(cells, colour) {
  const seen = new Set();
  const out = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] !== colour || seen.has(idx)) continue;
    const stack = [idx];
    const group = [];
    seen.add(idx);
    while (stack.length) {
      const at = stack.pop();
      group.push(at);
      for (const n of neighbours(at)) {
        if (!seen.has(n) && cells[n] === colour) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    out.push(group);
  }
  return out;
}

/** How many liberties the group containing `idx` has. */
export function libertiesAt(cells, idx) {
  if (cells[idx] === EMPTY) return 0;
  const colour = cells[idx];
  const seen = new Set([idx]);
  const stack = [idx];
  let libs = 0;
  const libSeen = new Set();
  while (stack.length) {
    const at = stack.pop();
    for (const n of neighbours(at)) {
      if (cells[n] === EMPTY) {
        if (!libSeen.has(n)) {
          libSeen.add(n);
          libs++;
        }
      } else if (cells[n] === colour && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return libs;
}

/**
 * Play a stone and resolve everything it causes: opponent groups at zero
 * liberties come off FIRST, then suicide is checked against what remains.
 *
 * Returns `{ cells, captured: number[], suicided }` or null when the move is
 * illegal. `captured` are the indices removed; `suicided` is the placed stone
 * itself (only legal when it captured).
 */
export function playOn(cells, side, idx) {
  if (idx < 0 || idx >= cells.length || cells[idx] !== EMPTY) return null;
  const next = cells.slice();
  next[idx] = side;
  const foe = other(side);

  // 1. capture adjacent enemy groups that have run out of liberties
  const captured = [];
  for (const n of neighbours(idx)) {
    if (next[n] !== foe) continue;
    if (libertiesAt(next, n) === 0) {
      for (const stone of stonesOfGroup(next, n)) captured.push(stone);
    }
  }
  for (const stone of captured) next[stone] = EMPTY;

  // 2. suicide — legal only if it captured something
  const suicided = libertiesAt(next, idx) === 0;
  if (suicided && captured.length === 0) return null;
  if (suicided) next[idx] = EMPTY;

  return { cells: next, captured, suicided };
}

/** The stones of the group containing `idx`. */
function stonesOfGroup(cells, idx) {
  const colour = cells[idx];
  const seen = new Set([idx]);
  const stack = [idx];
  const out = [];
  while (stack.length) {
    const at = stack.pop();
    out.push(at);
    for (const n of neighbours(at)) {
      if (!seen.has(n) && cells[n] === colour) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return out;
}

/* ---- legality -------------------------------------------------------------- */

/**
 * Is `side` allowed to play at `idx`? Checks occupancy, self-capture, and the
 * simple ko rule against `previous` (the position before the last move).
 */
export function isLegal(cells, side, idx, previous = null) {
  const result = playOn(cells, side, idx);
  if (!result) return false;
  if (previous && samePosition(result.cells, previous)) return false; // ko
  return true;
}

export function samePosition(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Every legal placement for `side` (passing is always legal and is separate). */
export function legalMoves(cells, side, previous = null) {
  const moves = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (isLegal(cells, side, idx, previous)) moves.push(idx);
  }
  return moves;
}

/* ---- the game --------------------------------------------------------------- */

/**
 * Apply a move or a pass, and decide whether the game is over.
 *
 * `state` is `{ cells, turn, captures: [black, white], passes, previous }`.
 * Two consecutive passes end it. `result` carries the new state plus the
 * captured indices and a `resumed` flag (a capture in a snapback removes the
 * ko restriction, so the same point is legal again immediately).
 */
export function applyMove(state, side, idx) {
  if (side !== state.turn) return null;
  if (idx === null || idx === undefined) {
    // a pass
    const passes = state.passes + 1;
    const next = {
      ...state,
      cells: state.cells.slice(),
      turn: other(side),
      passes,
      previous: state.cells.slice(),
    };
    return { state: next, captured: [], over: passes >= 2, resumed: false, passed: true };
  }
  const result = playOn(state.cells, side, idx);
  if (!result) return null;
  if (state.previous && samePosition(result.cells, state.previous)) return null; // ko

  const captures = [state.captures[0] || 0, state.captures[1] || 0];
  captures[side === BLACK ? 0 : 1] += result.captured.length;

  const next = {
    cells: result.cells,
    turn: other(side),
    captures,
    passes: 0,
    // the ko ban lifts when the capturing stone was itself taken (a snapback)
    previous: result.suicided ? null : state.cells.slice(),
  };
  return { state: next, captured: result.captured, over: false, resumed: result.suicided, passed: false };
}

export function createGame(komi = DEFAULT_KOMI) {
  return {
    cells: initialBoard(),
    turn: BLACK,
    captures: [0, 0],
    passes: 0,
    previous: null,
    komi,
  };
}

/* ---- scoring ---------------------------------------------------------------- */

/**
 * Area scoring (Chinese rules), which is what the plan calls for: a point
 * counts for you if it holds your stone OR is empty and touches only your
 * colour. Komi goes to white.
 */
export function score(state) {
  const { cells } = state;
  const blackArea = [];
  const whiteArea = [];
  const blackStones = [];
  const whiteStones = [];

  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] === BLACK) blackStones.push(idx);
    else if (cells[idx] === WHITE) whiteStones.push(idx);
  }

  // empty points: claim for a colour only if EVERY neighbour touching it is
  // that colour (so a dame between the two counts for neither)
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] !== EMPTY) continue;
    const around = neighbours(idx).map((n) => cells[n]);
    if (around.every((c) => c === BLACK)) blackArea.push(idx);
    else if (around.every((c) => c === WHITE)) whiteArea.push(idx);
  }

  const black = blackStones.length + blackArea.length;
  const white = whiteStones.length + whiteArea.length + state.komi;

  return {
    blackArea: blackStones.length + blackArea.length,
    whiteArea: whiteStones.length + whiteArea.length,
    blackCaptures: state.captures[0] || 0,
    whiteCaptures: state.captures[1] || 0,
    komi: state.komi,
    // reported to a tenth, since komi is usually a half point
    total: { black, white: Math.round(white * 10) / 10 },
    winner: Math.abs(black - white) < 0.05 ? null : black > white ? BLACK : WHITE,
    margin: Math.round(Math.abs(black - white) * 10) / 10,
    dame: cells.length - blackStones.length - whiteStones.length - blackArea.length - whiteArea.length,
  };
}

/* ---- evaluation --------------------------------------------------------------- */

/**
 * A static read for the search: liberties are life, so reward the number of
 * liberties a stone has, punish groups in atari, and value the centre and the
 * edges differently (the first line is worth far more on a 9×9 than open
 * space). Deliberately simple — the strength comes from search, not from a
 * clever formula.
 */
export function evaluate(cells, side) {
  const foe = other(side);
  let score = 0;
  for (const group of groupsOf(cells, side)) {
    let libs = 0;
    for (const stone of group) {
      for (const n of neighbours(stone)) if (cells[n] === EMPTY) libs++;
    }
    const distinct = new Set();
    for (const stone of group) {
      for (const n of neighbours(stone)) if (cells[n] === EMPTY) distinct.add(n);
    }
    libs = distinct.size;
    if (libs <= 1) score -= 60; // in atari or dead
    else if (libs === 2) score -= 15; // tight
    else score += Math.min(libs, 6) * 6;
    for (const stone of group) {
      const edge = (rowOf(stone) === 0 || rowOf(stone) === SIZE - 1 ? 1 : 0) +
        (fileOf(stone) === 0 || fileOf(stone) === SIZE - 1 ? 1 : 0);
      const centre = 4 - (Math.abs(rowOf(stone) - 4) + Math.abs(fileOf(stone) - 4));
      score += edge >= 2 ? 2 : 4 + centre; // corners/edges are sturdier
    }
  }
  for (const group of groupsOf(cells, foe)) {
    const distinct = new Set();
    for (const stone of group) {
      for (const n of neighbours(stone)) if (cells[n] === EMPTY) distinct.add(n);
    }
    if (distinct.size === 1) score += 70; // we can take it next turn
    else if (distinct.size === 2) score += 18;
  }
  return score;
}

/* ---- AI -------------------------------------------------------------------------- */

/** Easy AI — a legal move, preferring a capture, avoiding obvious self-atari. */
export function easyMove(state, side) {
  const moves = legalMoves(state.cells, side, state.previous);
  if (moves.length === 0) return null;
  // a capture if there is one
  for (const idx of moves) {
    const result = playOn(state.cells, side, idx);
    if (result && result.captured.length > 0) return idx;
  }
  // otherwise the point nearest the centre, chosen at random among equals
  const mid = (SIZE - 1) / 2;
  let best = Infinity;
  for (const idx of moves) {
    const d = Math.abs(rowOf(idx) - mid) + Math.abs(fileOf(idx) - mid);
    if (d < best) best = d;
  }
  const near = moves.filter((idx) => {
    const d = Math.abs(rowOf(idx) - mid) + Math.abs(fileOf(idx) - mid);
    return d === best;
  });
  return near[Math.floor(Math.random() * near.length)];
}

/**
 * Medium AI — one ply: win material now, save a group in atari, stop an
 * opponent group in atari, block extensions, else the best static point.
 */
export function mediumMove(state, side) {
  const moves = legalMoves(state.cells, side, state.previous);
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestScore = -Infinity;
  const foe = other(side);
  for (const idx of moves) {
    const result = playOn(state.cells, side, idx);
    if (!result) continue;
    const next = { ...state, cells: result.cells };
    let s = evaluate(result.cells, side) + result.captured.length * 30;
    // do not fill our own last liberty unless it captured
    if (result.suicided) s -= 200;
    if (s > bestScore) {
      bestScore = s;
      best = idx;
    }
  }
  return best;
}

/**
 * Hard AI — negamax with alpha-beta over a capped depth, ordered by the
 * static evaluation so the cutoffs bite. `maxNodes` keeps it inside a click.
 *
 * Stated plainly: a strong amateur, not a championship engine. It sees a few
 * moves ahead and reads liberties well; it does not read life and death.
 */
export function search(state, side, options = {}) {
  const maxNodes = options.maxNodes ?? 24000;
  const depth = options.depth ?? (state.captures[0] + state.captures[1] > 12 ? 2 : 3);
  let nodes = 0;
  let aborted = false;

  function negamax(st, mover, remaining, alpha, beta) {
    nodes++;
    if (nodes > maxNodes) {
      aborted = true;
      return evaluate(st.cells, mover);
    }
    if (remaining === 0) return evaluate(st.cells, mover);
    const moves = legalMoves(st.cells, mover, st.previous);
    if (moves.length === 0) return evaluate(st.cells, mover);
    // captures first, then the most valuable point — ordering is what makes
    // the node cap survivable
    const ordered = moves
      .map((idx) => {
        const r = playOn(st.cells, mover, idx);
        return { idx, hint: (r ? r.captured.length * 400 : 0) + evaluate(st.cells, mover) };
      })
      .sort((a, b) => b.hint - a.hint)
      .map((e) => e.idx);
    let best = -Infinity;
    for (const idx of ordered) {
      const r = applyMove({ ...st, turn: mover }, mover, idx);
      if (!r) continue;
      const value = -negamax(r.state, other(mover), remaining - 1, -beta, -alpha);
      if (value > best) best = value;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
      if (aborted) break;
    }
    return best;
  }

  const root = legalMoves(state.cells, side, state.previous);
  if (root.length === 0) return null;
  let bestMove = root[0];
  let bestValue = -Infinity;
  for (const idx of root) {
    const r = applyMove({ ...state, turn: side }, side, idx);
    if (!r) continue;
    const value = -negamax(r.state, other(side), depth - 1, -Infinity, -bestValue);
    if (value > bestValue) {
      bestValue = value;
      bestMove = idx;
    }
    if (aborted) break;
  }
  return { move: bestMove, value: bestValue, nodes, aborted };
}

export function aiMove(state, side, difficulty, options = {}) {
  if (difficulty === 'hard') {
    const found = search(state, side, options);
    return found ? found.move : null;
  }
  if (difficulty === 'medium') return mediumMove(state, side);
  return easyMove(state, side);
}

/* ---- safety -------------------------------------------------------------------- */

/** Sanitise an untrusted board (the wire) into a legal 0|1|2 array. */
export function fromArray(cells) {
  const out = new Array(CELLS).fill(EMPTY);
  for (let i = 0; i < CELLS; i++) {
    const cell = Number(cells?.[i]) | 0;
    out[i] = cell === BLACK || cell === WHITE ? cell : EMPTY;
  }
  return out;
}
