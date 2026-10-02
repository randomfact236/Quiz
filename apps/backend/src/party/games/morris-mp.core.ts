/**
 * Nine Men's Morris MP (T47 3P) — PURE core, backend-owned.
 *
 * Three colours on the classic twenty-four-point board: place your eight
 * stones, then slide them; three in a line is a MILL and pulls an enemy
 * stone off the board. Reduced below three stones (or frozen stuck) and
 * you are out — the last colour standing wins.
 *
 * Board: 3 concentric rings x 8 points (0..7 clockwise from the top).
 * Points: ring*8 + i. 20 mill lines (4 per ring, 4 spokes, 4 diagonals).
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const ML_RINGS = 4; // the widened board: four concentric squares
export const ML_POINTS = ML_RINGS * 8;
const ML_PIECES: Record<number, number> = { 3: 9, 4: 7 };

export interface MlState {
  /** 0 empty, else seat + 1. */
  points: number[];
  /** Stones still in hand per seat. */
  hand: number[];
  phaseTurn: 'place' | 'move';
  /** Seats eliminated, in order. */
  out: number[];
  /** Removals the mover still owes (from mills). */
  pending: number;
  turn: number;
  seatCount: number;
  lastMove: { seat: number; kind: 'place' | 'move' | 'remove'; idx: number; from?: number } | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface MlPlacement {
  seat: number;
  rank: number;
}

/* ring adjacency: point p = ring*8 + i; ring neighbours i+/-1 mod 8 */
const ML_RING_EDGES: number[][] = (() => {
  const out: number[][] = [];
  for (let ring = 0; ring < ML_RINGS; ring++) {
    for (let i = 0; i < 8; i++) {
      out.push([ring * 8 + i, ring * 8 + ((i + 1) % 8)]);
    }
  }
  return out;
})();
/* spokes at N(0) E(2) S(4) W(6) and diagonals at NE(1) SE(3) SW(5) NW(7):
   connect the same index across all three rings */
const ML_RADIAL_EDGES: number[][] = (() => {
  const out: number[][] = [];
  for (const i of [0, 1, 2, 3, 4, 5, 6, 7]) {
    for (let k = 0; k + 1 < ML_RINGS; k++) {
      out.push([k * 8 + i, (k + 1) * 8 + i]);
    }
  }
  return out;
})();
const ML_LINES: number[][] = (() => {
  const lines: number[][] = [];
  for (let ring = 0; ring < ML_RINGS; ring++) {
    for (const start of [0, 2, 4, 6]) {
      lines.push([ring * 8 + start, ring * 8 + ((start + 1) % 8), ring * 8 + ((start + 2) % 8)]);
    }
  }
  for (const i of [0, 1, 2, 3, 4, 5, 6, 7]) {
    for (let k = 0; k + 2 < ML_RINGS; k++) {
      lines.push([k * 8 + i, (k + 1) * 8 + i, (k + 2) * 8 + i]);
    }
  }
  return lines;
})();
const ML_POINT_LINES: number[][] = (() => {
  const out: number[][] = Array.from({ length: ML_POINTS }, () => []);
  ML_LINES.forEach((line, li) => {
    for (const p of line) out[p].push(li);
  });
  return out;
})();
const ML_ADJ: number[][] = (() => {
  const out: number[][] = Array.from({ length: ML_POINTS }, () => []);
  for (const [a, b] of ML_RING_EDGES.concat(ML_RADIAL_EDGES)) {
    out[a].push(b);
    out[b].push(a);
  }
  return out;
})();

export function mlInitialState(seatCount: number): MlState {
  const n = seatCount >= 4 ? 4 : 3;
  const per = ML_PIECES[n] ?? 6;
  return {
    points: new Array(ML_POINTS).fill(0) as number[],
    hand: new Array(seatCount).fill(per) as number[],
    phaseTurn: 'place',
    out: [],
    pending: 0,
    turn: 0,
    seatCount,
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

export function mlOnBoard(state: MlState, seat: number): number {
  let n = 0;
  for (const v of state.points) if (v === seat + 1) n += 1;
  return n;
}

function mlMills(state: MlState, seat: number, idx: number): number {
  let count = 0;
  for (const li of ML_POINT_LINES[idx]) {
    if (ML_LINES[li].every((p) => state.points[p] === seat + 1)) count += 1;
  }
  return count;
}

function mlInMill(state: MlState, piece: number): boolean {
  for (const li of ML_POINT_LINES[piece]) {
    if (ML_LINES[li].every((p) => state.points[p] !== 0)) {
      const c = state.points[ML_LINES[li][0]];
      if (ML_LINES[li].every((p) => state.points[p] === c)) return true;
    }
  }
  return false;
}

export function mlHasMove(state: MlState, seat: number): boolean {
  if (state.hand[seat] > 0) {
    return state.points.some((v) => v === 0);
  }
  for (let p = 0; p < ML_POINTS; p++) {
    if (state.points[p] !== seat + 1) continue;
    for (const q of ML_ADJ[p]) {
      if (state.points[q] === 0) return true;
    }
  }
  return false;
}

export function mlValidateMove(state: MlState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { place?: unknown; from?: unknown; to?: unknown; remove?: unknown } | null;
  if (!m || typeof m !== 'object') return 'Send { place } / { from, to } / { remove }.';
  if (state.pending > 0) {
    if (!Number.isInteger(m.remove)) return 'A mill pulls a stone: send { remove }.';
    const p = m.remove as number;
    if (p < 0 || p >= ML_POINTS) return 'That spot is off the board.';
    const v = state.points[p];
    if (v === 0 || v === seat + 1) return 'Remove an ENEMY stone.';
    if (mlInMill(state, p)) {
      // allowed only if that opponent has nothing outside a mill
      let outside = 0;
      for (let q = 0; q < ML_POINTS; q++) {
        if (state.points[q] === v && !mlInMill(state, q)) outside += 1;
      }
      if (outside > 0) return 'That stone sits in a mill — pick one outside a mill.';
    }
    return null;
  }
  if (Number.isInteger(m.place)) {
    if (state.phaseTurn !== 'place') return 'Placing is over — slide a stone.';
    if (state.hand[seat] <= 0) return 'Your hand is empty.';
    const p = m.place as number;
    if (p < 0 || p >= ML_POINTS) return 'That spot is off the board.';
    if (state.points[p] !== 0) return 'That spot is taken.';
    return null;
  }
  if (Number.isInteger(m.from) && Number.isInteger(m.to)) {
    if (state.phaseTurn !== 'move') return 'Still placing — send { place }.';
    const from = m.from as number;
    const to = m.to as number;
    if (from < 0 || from >= ML_POINTS || to < 0 || to >= ML_POINTS)
      return 'That spot is off the board.';
    if (state.points[from] !== seat + 1) return 'Pick one of your own stones.';
    if (state.points[to] !== 0) return 'Slide onto an empty spot.';
    if (!ML_ADJ[from].includes(to)) return 'Stones slide along the lines only.';
    return null;
  }
  return 'Send { place } / { from, to } / { remove }.';
}

function mlSweepEliminations(state: MlState): void {
  for (let s = 0; s < state.seatCount; s++) {
    if (!state.out.includes(s) && state.hand[s] === 0 && mlOnBoard(state, s) < 3) {
      state.out.push(s);
    }
  }
}

export function mlApplyMove(state: MlState, seat: number, move: unknown): MlState {
  const m = move as { place?: number; from?: number; to?: number; remove?: number };
  const next: MlState = {
    ...state,
    points: state.points.slice(),
    hand: state.hand.slice(),
    out: state.out.slice(),
    moveCount: state.moveCount + 1,
  };
  if (state.pending > 0) {
    const p = m.remove as number;
    next.points[p] = 0;
    next.pending = state.pending - 1;
    next.lastMove = { seat, kind: 'remove', idx: p };
    if (next.pending === 0) {
      mlSweepEliminations(next);
      next.turn = mlAdvance(next, seat);
    }
    return mlFinishIfOver(next);
  }
  if (Number.isInteger(m.place)) {
    const p = m.place as number;
    next.points[p] = seat + 1;
    next.hand[seat] -= 1;
    next.lastMove = { seat, kind: 'place', idx: p };
    next.pending = mlMills(next, seat, p);
    if (next.hand.every((h) => h === 0)) next.phaseTurn = 'move';
    if (next.pending === 0) {
      mlSweepEliminations(next);
      next.turn = mlAdvance(next, seat);
    }
    return mlFinishIfOver(next);
  }
  const from = m.from as number;
  const to = m.to as number;
  next.points[from] = 0;
  next.points[to] = seat + 1;
  next.lastMove = { seat, kind: 'move', idx: to, from };
  next.pending = mlMills(next, seat, to);
  if (next.pending === 0) {
    mlSweepEliminations(next);
    next.turn = mlAdvance(next, seat);
  }
  return mlFinishIfOver(next);
}

/** advance past eliminated/stuck seats (move phase: stuck = eliminated) */
function mlAdvance(state: MlState, from: number): number {
  let nxt = (from + 1) % state.seatCount;
  for (let i = 0; i < state.seatCount; i++) {
    if (state.out.includes(nxt)) {
      nxt = (nxt + 1) % state.seatCount;
      continue;
    }
    if (!mlHasMove(state, nxt)) {
      state.out.push(nxt);
      nxt = (nxt + 1) % state.seatCount;
      continue;
    }
    return nxt;
  }
  return from;
}

function mlFinishIfOver(state: MlState): MlState {
  const alive = Array.from({ length: state.seatCount }, (_, s) => s).filter(
    (s) => !state.out.includes(s)
  );
  if (alive.length <= 1) {
    state.phase = 'finished';
    state.winnerSeat = alive.length === 1 ? alive[0] : null;
    state.turn = alive.length === 1 ? alive[0] : state.turn;
    return state;
  }
  if (state.moveCount > 400) {
    // safety valve: nobody gives — most stones standing takes it
    let best = alive[0];
    for (const s of alive) {
      if (mlOnBoard(state, s) > mlOnBoard(state, best)) best = s;
    }
    state.phase = 'finished';
    state.winnerSeat = best;
    state.turn = best;
  }
  return state;
}

export function mlIsOver(state: MlState): boolean {
  return state.phase === 'finished';
}

export function mlWinner(state: MlState): number | null {
  return state.winnerSeat;
}

export function mlPlacement(state: MlState): MlPlacement[] {
  const alive = Array.from({ length: state.seatCount }, (_, s) => s).filter(
    (s) => !state.out.includes(s)
  );
  const win = state.winnerSeat;
  const aliveSorted = alive.slice().sort((a, b) => {
    if (win !== null) {
      if (a === win) return -1;
      if (b === win) return 1;
    }
    return mlOnBoard(state, b) - mlOnBoard(state, a) || a - b;
  });
  const order = aliveSorted.concat(state.out.slice().reverse());
  return order.map((seat, i) => ({ seat, rank: i + 1 }));
}

/* ------------------------------- bots ------------------------------- */

function mlPlacementScore(state: MlState, seat: number, p: number): number {
  const me = seat + 1;
  let score = 0;
  for (const li of ML_POINT_LINES[p]) {
    const line = ML_LINES[li];
    let mine = 0;
    let theirs = 0;
    for (const q of line) {
      if (q === p) continue;
      if (state.points[q] === me) mine += 1;
      else if (state.points[q] !== 0) theirs += 1;
    }
    if (mine === 2 && theirs === 0)
      score += 120; // mill now
    else if (mine === 2) score += 12;
    else if (mine === 1 && theirs === 0) score += 8;
    if (theirs === 2 && mine === 0) score += 25; // block their mill
  }
  const r = Math.floor(p / 8);
  if (r !== 2) score += 1;
  return score;
}

export function mlBotMove(state: MlState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const me = seat + 1;
  const rand = (n: number): number => Math.random() * n;
  if (state.pending > 0) {
    // remove: prefer breaking near-mills of the strongest opponent
    const cands: number[] = [];
    for (let p = 0; p < ML_POINTS; p++) {
      if (state.points[p] === 0 || state.points[p] === me) continue;
      if (mlInMill(state, p)) continue;
      cands.push(p);
    }
    if (!cands.length) {
      for (let p = 0; p < ML_POINTS; p++) {
        if (state.points[p] !== 0 && state.points[p] !== me) cands.push(p);
      }
    }
    if (!cands.length) return { remove: 0 }; // defensive
    let best = cands[0];
    let bestScore = -Infinity;
    for (const p of cands) {
      let score = 0;
      for (const li of ML_POINT_LINES[p]) {
        const line = ML_LINES[li];
        const v = state.points[p];
        const others = line.filter((q) => q !== p).map((q) => state.points[q]);
        if (others.every((o) => o === v || o === 0) && others.some((o) => o === v)) score += 20; // break a near-mill
      }
      score += rand(6);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    return { remove: best };
  }
  if (state.phaseTurn === 'place' && state.hand[seat] > 0) {
    const empty: number[] = [];
    for (let p = 0; p < ML_POINTS; p++) if (state.points[p] === 0) empty.push(p);
    if (!empty.length) return { place: 0 };
    if (tier === 'easy') return { place: empty[Math.floor(rand(empty.length))] };
    let best = empty[0];
    let bestScore = -Infinity;
    for (const p of empty) {
      const score = mlPlacementScore(state, seat, p) + rand(tier === 'medium' ? 20 : 6);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    return { place: best };
  }
  // movement
  const moves: number[][] = [];
  for (let p = 0; p < ML_POINTS; p++) {
    if (state.points[p] !== me) continue;
    for (const q of ML_ADJ[p]) {
      if (state.points[q] === 0) moves.push([p, q]);
    }
  }
  if (!moves.length) return { from: 0, to: 0 }; // defensive; stuck = eliminated upstream
  if (tier === 'easy') {
    const mv = moves[Math.floor(rand(moves.length))];
    return { from: mv[0], to: mv[1] };
  }
  let best = moves[0];
  let bestScore = -Infinity;
  for (const [p, q] of moves) {
    const sim: MlState = { ...state, points: state.points.slice() };
    sim.points[p] = 0;
    sim.points[q] = me;
    let score = mlMills(sim, seat, q) * 100;
    for (const li of ML_POINT_LINES[q]) {
      const line = ML_LINES[li];
      const mine = line.filter((x) => sim.points[x] === me).length;
      const free = line.filter((x) => sim.points[x] === 0).length;
      if (mine === 2 && free === 1) score += 10;
    }
    score += rand(tier === 'medium' ? 8 : 3);
    if (score > bestScore) {
      bestScore = score;
      best = [p, q];
    }
  }
  return { from: best[0], to: best[1] };
}
