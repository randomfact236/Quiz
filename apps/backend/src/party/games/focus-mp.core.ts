/**
 * Focus MP (T32 3P + F32 4P, ONE core) — PURE core, backend-owned.
 *
 * The stacking classic: enter pieces from your hand onto any open square,
 * move the top piece OR a whole stack one square orthogonally. Land on an
 * enemy stack with an equal-or-taller group and it is captured for good.
 * Pieces stack up to five. Lose every piece (hand + board) and you are
 * out — the last player with pieces left wins.
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const FC_N = 6;
export const FC_MAX_STACK = 5;
const FC_HAND: Record<number, number> = { 3: 12, 4: 10 };

export interface FcState {
  /** cells[idx] = stack bottom -> top (seat indexes). Empty = []. */
  cells: number[][];
  /** Pieces still in each seat's hand. */
  hand: number[];
  turn: number;
  seatCount: number;
  /** Seats eliminated, in order (first out first). */
  out: number[];
  lastMove:
    | { kind: 'place'; seat: number; idx: number }
    | { kind: 'move'; seat: number; from: number; to: number; all: boolean }
    | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface FcPlacement {
  seat: number;
  rank: number;
}

export function fcInitialState(seatCount: number): FcState {
  const n = seatCount >= 4 ? 4 : 3;
  const hand = FC_HAND[n] ?? 10;
  return {
    cells: Array.from({ length: FC_N * FC_N }, () => [] as number[]),
    hand: new Array(seatCount).fill(hand) as number[],
    turn: 0,
    seatCount,
    out: [],
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

export function fcBoardCount(state: FcState, seat: number): number {
  let count = 0;
  for (const stack of state.cells) {
    for (const s of stack) if (s === seat) count++;
  }
  return count;
}

export function fcPiecesLeft(state: FcState, seat: number): number {
  return state.hand[seat] + fcBoardCount(state, seat);
}

function fcNeighbors(idx: number): number[] {
  const r = Math.floor(idx / FC_N);
  const c = idx % FC_N;
  const out: number[] = [];
  if (r > 0) out.push(idx - FC_N);
  if (r < FC_N - 1) out.push(idx + FC_N);
  if (c > 0) out.push(idx - 1);
  if (c < FC_N - 1) out.push(idx + 1);
  return out;
}

/** Can this single move land from `from` onto `to`? Returns reason or null. */
function fcMoveLegal(
  state: FcState,
  seat: number,
  from: number,
  to: number,
  all: boolean
): string | null {
  if (from === to || !fcNeighbors(from).includes(to)) return 'Stacks move exactly one square.';
  const src = state.cells[from];
  const dst = state.cells[to];
  if (!src.length || src[0] !== seat) return 'Pick one of your own stacks.';
  const moving = all ? src.length : 1;
  const top = src[src.length - 1];
  if (top !== seat) return 'Only your own pieces can move.';
  if (!dst.length) return null;
  const dstSeat = dst[0];
  if (dstSeat === seat) {
    if (dst.length + moving > FC_MAX_STACK) return 'The combined stack would top five.';
    return null;
  }
  if (dst.length > moving) return 'Your group is shorter than theirs — it cannot capture.';
  return null;
}

export function fcHasMove(state: FcState, seat: number): boolean {
  if (state.hand[seat] > 0) {
    for (const stack of state.cells) {
      if (stack.length === 0) return true;
    }
  }
  for (let from = 0; from < state.cells.length; from++) {
    const src = state.cells[from];
    if (!src.length || src[0] !== seat) continue;
    for (const to of fcNeighbors(from)) {
      if (fcMoveLegal(state, seat, from, to, false) === null) return true;
      if (src.length > 1 && fcMoveLegal(state, seat, from, to, true) === null) return true;
    }
  }
  return false;
}

export function fcValidateMove(state: FcState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { place?: unknown; from?: unknown; to?: unknown; stack?: unknown } | null;
  if (!m || typeof m !== 'object') return 'Send { place } or { from, to }.';
  if (Number.isInteger(m.place)) {
    const idx = m.place as number;
    if (idx < 0 || idx >= FC_N * FC_N) return 'That square is off the board.';
    if (state.hand[seat] <= 0) return 'Your hand is empty.';
    if (state.cells[idx].length !== 0) return 'You can only enter on an open square.';
    return null;
  }
  if (Number.isInteger(m.from) && Number.isInteger(m.to)) {
    return fcMoveLegal(state, seat, m.from as number, m.to as number, m.stack === true);
  }
  return 'Send { place } or { from, to }.';
}

export function fcApplyMove(state: FcState, seat: number, move: unknown): FcState {
  const m = move as { place?: number; from?: number; to?: number; stack?: boolean };
  const cells = state.cells.map((s) => s.slice());
  const hand = state.hand.slice();
  const out = state.out.slice();
  let lastMove: FcState['lastMove'] = null;
  if (Number.isInteger(m.place)) {
    const idx = m.place as number;
    cells[idx] = [seat];
    hand[seat] -= 1;
    lastMove = { kind: 'place', seat, idx };
  } else {
    const from = m.from as number;
    const to = m.to as number;
    const all = m.stack === true;
    const src = cells[from];
    const dst = cells[to];
    const moved = all ? src.slice() : [seat];
    const rest = all ? [] : src.slice(0, -1);
    if (!dst.length) {
      cells[from] = rest;
      cells[to] = moved;
    } else if (dst[0] === seat) {
      cells[from] = rest;
      cells[to] = dst.concat(moved);
    } else {
      // capture: the equal-or-taller group removes theirs for good
      cells[from] = rest;
      cells[to] = moved;
    }
    lastMove = { kind: 'move', seat, from, to, all };
  }
  const next: FcState = {
    ...state,
    cells,
    hand,
    out,
    lastMove,
    moveCount: state.moveCount + 1,
  };
  // elimination check (the seat that just lost pieces, typically)
  for (let s = 0; s < state.seatCount; s++) {
    if (!out.includes(s) && hand[s] === 0 && fcBoardCount(next, s) === 0) out.push(s);
  }
  next.out = out;
  const alive = Array.from({ length: state.seatCount }, (_, s) => s).filter(
    (s) => !out.includes(s)
  );
  if (alive.length <= 1) {
    next.phase = 'finished';
    next.winnerSeat = alive.length === 1 ? alive[0] : null;
    next.turn = (seat + 1) % state.seatCount;
    return next;
  }
  // advance to the next alive seat that actually has a move
  let nxt = (seat + 1) % state.seatCount;
  let found = false;
  for (let i = 0; i < state.seatCount; i++) {
    if (!out.includes(nxt) && fcHasMove(next, nxt)) {
      found = true;
      break;
    }
    nxt = (nxt + 1) % state.seatCount;
  }
  if (!found) {
    // nothing can move anywhere: most pieces left wins
    let bestSeat = alive[0];
    let best = -1;
    for (const s of alive) {
      const v = fcPiecesLeft(next, s);
      if (v > best) {
        best = v;
        bestSeat = s;
      }
    }
    next.phase = 'finished';
    next.winnerSeat = bestSeat;
    next.turn = bestSeat;
    return next;
  }
  next.turn = nxt;
  return next;
}

export function fcIsOver(state: FcState): boolean {
  return state.phase === 'finished';
}

export function fcWinner(state: FcState): number | null {
  return state.winnerSeat;
}

export function fcPlacement(state: FcState): FcPlacement[] {
  const alive = Array.from({ length: state.seatCount }, (_, s) => s).filter(
    (s) => !state.out.includes(s)
  );
  const win = state.winnerSeat;
  const aliveSorted = alive.slice().sort((a, b) => {
    if (win !== null) {
      if (a === win) return -1;
      if (b === win) return 1;
    }
    return fcPiecesLeft(state, b) - fcPiecesLeft(state, a) || a - b;
  });
  const order = aliveSorted.concat(state.out.slice().reverse());
  return order.map((seat, i) => ({ seat, rank: i + 1 }));
}

/* ------------------------------- bots ------------------------------- */

interface FcAction {
  move: unknown;
  score: number;
}

export function fcBotMove(state: FcState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const actions: FcAction[] = [];
  const noise = tier === 'easy' ? 40 : tier === 'medium' ? 12 : 4;
  // placements
  if (state.hand[seat] > 0) {
    for (let idx = 0; idx < state.cells.length; idx++) {
      if (state.cells[idx].length !== 0) continue;
      let score = 12;
      for (const n of fcNeighbors(idx)) {
        const st2 = state.cells[n];
        if (!st2.length) continue;
        if (st2[0] === seat) score += 2;
        else score += st2.length === 1 ? 3 : -6; // pressure on singles, steer clear of big stacks
      }
      const r = Math.floor(idx / FC_N);
      const c = idx % FC_N;
      score += 2.5 - Math.abs(r - 2.5) + (2.5 - Math.abs(c - 2.5)) > 2 ? 1 : 0;
      actions.push({ move: { place: idx }, score: score + Math.random() * noise });
    }
  }
  // moves
  for (let from = 0; from < state.cells.length; from++) {
    const src = state.cells[from];
    if (!src.length || src[0] !== seat) continue;
    for (const to of fcNeighbors(from)) {
      for (const all of src.length > 1 ? [false, true] : [false]) {
        const err = fcMoveLegal(state, seat, from, to, all);
        if (err) continue;
        const dst = state.cells[to];
        const moving = all ? src.length : 1;
        let score = 0;
        if (dst.length) {
          if (dst[0] === seat) {
            score += 18 + (dst.length + moving >= 3 ? 8 : 0);
          } else {
            const captured = dst.length;
            score += 90 + captured * 30;
            // elimination bonus
            let victimBoard = 0;
            for (const st2 of state.cells) for (const s of st2) if (s === dst[0]) victimBoard++;
            if (victimBoard === captured && state.hand[dst[0]] === 0) score += 600;
          }
        } else {
          score += 10;
        }
        if (tier !== 'easy') {
          // approach / threat evaluation on the destination
          const tr = Math.floor(to / FC_N);
          const tc = to % FC_N;
          let nearestBefore = Infinity;
          let nearestAfter = Infinity;
          for (let i = 0; i < state.cells.length; i++) {
            const st2 = state.cells[i];
            if (!st2.length || st2[0] === seat) continue;
            const d = Math.abs(Math.floor(i / FC_N) - tr) + Math.abs((i % FC_N) - tc);
            nearestAfter = Math.min(nearestAfter, d);
            const dBefore =
              Math.abs(Math.floor(i / FC_N) - Math.floor(from / FC_N)) +
              Math.abs((i % FC_N) - (from % FC_N));
            nearestBefore = Math.min(nearestBefore, dBefore);
          }
          if (nearestAfter < Infinity) score += (nearestBefore - nearestAfter) * 4;
          let threat = 0;
          for (const n of fcNeighbors(to)) {
            const st2 = state.cells[n];
            if (st2.length && st2[0] !== seat && st2.length >= moving) threat++;
          }
          score -= threat * (tier === 'hard' ? 14 : 8);
        }
        actions.push({ move: { from, to, stack: all }, score: score + Math.random() * noise });
      }
    }
  }
  if (!actions.length) return { place: 0 }; // defensive; skip logic prevents this
  actions.sort((a, b) => b.score - a.score);
  const top = actions.slice(0, tier === 'easy' ? Math.max(1, Math.ceil(actions.length / 4)) : 2);
  return top[Math.floor(Math.random() * top.length)].move;
}
