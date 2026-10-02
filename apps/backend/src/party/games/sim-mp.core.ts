/**
 * Sim MP (T8 3P + F13 4P, ONE core) — PURE core, backend-owned.
 *
 * The much-loved avoidance classic: dots on a table, players draw edges in
 * their own colour. Close a triangle of YOUR colour and you are OUT.
 * Last one standing wins (placement = elimination order, run backwards).
 * 3 seats play on six dots, 4 seats on seven (per the plan's 21 lines).
 *
 * EMPTY-BOARD: pure geometry — no words, no served content. All public.
 */

const SIM_DOTS: Record<number, number> = { 3: 6, 4: 7 };

export interface SimEdgePair {
  u: number;
  v: number;
  /** Indexes (into the full edge list) of the two other edges of every
   *  triangle containing this edge (pairs). */
  tris: number[][];
}
export interface SimState {
  /** -1 = undrawn, else seat index. */
  edgeColor: number[];
  turn: number;
  seatCount: number;
  /** Seats in the order they closed a triangle (first out first). */
  out: number[];
  lastMove: { seat: number; edge: number } | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface SimPlacement {
  seat: number;
  rank: number;
}

export interface SimLayout {
  dots: number;
  edges: number[][];
  tris: number[][][]; // per edge: list of [otherEdge1, otherEdge2]
}

export function simLayout(seatCount: number): SimLayout {
  const n = SIM_DOTS[seatCount >= 4 ? 4 : 3] ?? 6;
  const edges: number[][] = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) edges.push([u, v]);
  }
  const idxOf = (u: number, v: number): number => {
    const a = Math.min(u, v);
    const b = Math.max(u, v);
    for (let i = 0; i < edges.length; i++) {
      if (edges[i][0] === a && edges[i][1] === b) return i;
    }
    return -1;
  };
  const tris: number[][][] = edges.map(() => []);
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      for (let w = v + 1; w < n; w++) {
        const e1 = idxOf(u, v);
        const e2 = idxOf(u, w);
        const e3 = idxOf(v, w);
        tris[e1].push([e2, e3]);
        tris[e2].push([e1, e3]);
        tris[e3].push([e1, e2]);
      }
    }
  }
  return { dots: n, edges, tris };
}

export function simInitialState(seatCount: number): SimState {
  const layout = simLayout(seatCount);
  return {
    edgeColor: new Array(layout.edges.length).fill(-1) as number[],
    turn: 0,
    seatCount,
    out: [],
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

export function simCompletes(state: SimState, seat: number, edge: number): boolean {
  const layout = simLayout(state.seatCount);
  for (const [o1, o2] of layout.tris[edge]) {
    if (state.edgeColor[o1] === seat && state.edgeColor[o2] === seat) return true;
  }
  return false;
}

export function simValidateMove(state: SimState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { edge?: unknown } | null;
  if (!m || !Number.isInteger(m.edge)) return 'Send { edge }.';
  const e = m.edge as number;
  const layout = simLayout(state.seatCount);
  if (e < 0 || e >= layout.edges.length) return 'There is no line there.';
  if (state.edgeColor[e] !== -1) return 'That line is already drawn.';
  return null;
}

export function simApplyMove(state: SimState, seat: number, move: unknown): SimState {
  const m = move as { edge: number };
  const edgeColor = state.edgeColor.slice();
  edgeColor[m.edge] = seat;
  const out = state.out.slice();
  if (simCompletes(state, seat, m.edge)) out.push(seat);
  const next: SimState = {
    ...state,
    edgeColor,
    out,
    lastMove: { seat, edge: m.edge },
    moveCount: state.moveCount + 1,
  };
  const alive = Array.from({ length: state.seatCount }, (_, s) => s).filter(
    (s) => !out.includes(s)
  );
  if (alive.length <= 1) {
    next.phase = 'finished';
    next.winnerSeat = alive.length === 1 ? alive[0] : null;
    next.turn = state.turn;
    return next;
  }
  if (edgeColor.every((c) => c !== -1)) {
    next.phase = 'finished';
    next.winnerSeat = null; // nobody was ever forced — shared survival
    next.turn = state.turn;
    return next;
  }
  // Next seat that is not out.
  let nxt = (seat + 1) % state.seatCount;
  for (let i = 0; i < state.seatCount; i++) {
    if (!out.includes(nxt)) break;
    nxt = (nxt + 1) % state.seatCount;
  }
  next.turn = nxt;
  return next;
}

export function simIsOver(state: SimState): boolean {
  return state.phase === 'finished';
}

export function simWinner(state: SimState): number | null {
  return state.winnerSeat;
}

export function simPlacement(state: SimState): SimPlacement[] {
  const alive = Array.from({ length: state.seatCount }, (_, s) => s).filter(
    (s) => !state.out.includes(s)
  );
  const order = alive.concat(state.out.slice().reverse());
  return order.map((seat, i) => ({ seat, rank: i + 1 }));
}

export function simBotMove(
  state: SimState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): unknown {
  const layout = simLayout(state.seatCount);
  const free: number[] = [];
  for (let e = 0; e < layout.edges.length; e++) {
    if (state.edgeColor[e] === -1) free.push(e);
  }
  if (!free.length) return { edge: 0 }; // defensive
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  if (tier === 'easy') return { edge: pick(free) };
  const safe = free.filter((e) => !simCompletes(state, seat, e));
  const pool = safe.length ? safe : free;
  if (tier === 'medium') return { edge: pick(pool) };
  // hard: among safe edges, minimize your own near-triangles (2 of yours + 1 gap).
  let best = pool[0];
  let bestRisk = Infinity;
  for (const e of pool) {
    const sim = state.edgeColor.slice();
    sim[e] = seat;
    let risk = 0;
    for (const [o1, o2] of layout.tris[e]) {
      const a = sim[o1];
      const b = sim[o2];
      const mine = (a === seat ? 1 : 0) + (b === seat ? 1 : 0);
      const open = (a === -1 ? 1 : 0) + (b === -1 ? 1 : 0);
      if (mine === 2 && open === 0) risk += 1000; // completed — shouldn't happen (safe filter)
      if (mine === 1 && open === 1) risk += 1; // one more of yours + a gap = future danger
    }
    if (risk < bestRisk) {
      bestRisk = risk;
      best = e;
    }
  }
  return { edge: best };
}
