/**
 * Trinity Hex MP (T4 3P) — PURE core, backend-owned.
 *
 * Hex on a hexagonal board: each player owns a PAIR of opposite sides of
 * the great hexagon and races to chain their stones from one side to the
 * other. First connection wins. (Seat 3, if ever seated, shares seat 0's
 * sides — the plan fields three.)
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const TR_R = 4;

export interface TrCell {
  q: number;
  r: number;
}
export interface TrState {
  /** 0 empty, else seat + 1. */
  cells: number[];
  turn: number;
  seatCount: number;
  lastMove: number | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface TrPlacement {
  seat: number;
  rank: number;
}

export function trLayout(): { cells: TrCell[]; idx: (q: number, r: number) => number } {
  const cells: TrCell[] = [];
  const map = new Map<string, number>();
  for (let q = -TR_R; q <= TR_R; q++) {
    for (let r = -TR_R; r <= TR_R; r++) {
      if (Math.abs(q + r) <= TR_R) {
        map.set(q + ',' + r, cells.length);
        cells.push({ q, r });
      }
    }
  }
  return {
    cells,
    idx: (q: number, r: number): number => {
      const v = map.get(q + ',' + r);
      return v === undefined ? -1 : v;
    },
  };
}

/** The two opposite sides (lists of cell indexes) for a seat. */
export function trSides(seat: number): { a: number[]; b: number[] } {
  const L = trLayout();
  const side = (kind: string): number[] => {
    const out: number[] = [];
    for (const c of L.cells) {
      const v =
        kind === 'r-lo'
          ? c.r === -TR_R
          : kind === 'r-hi'
            ? c.r === TR_R
            : kind === 'q-lo'
              ? c.q === -TR_R
              : kind === 'q-hi'
                ? c.q === TR_R
                : kind === 'qr-lo'
                  ? c.q + c.r === -TR_R
                  : c.q + c.r === TR_R;
      if (v) out.push(L.idx(c.q, c.r));
    }
    return out;
  };
  const s = seat % 3;
  if (s === 0) return { a: side('r-lo'), b: side('r-hi') };
  if (s === 1) return { a: side('q-lo'), b: side('q-hi') };
  return { a: side('qr-lo'), b: side('qr-hi') };
}

const TR_DIRS: number[][] = [
  [1, 0],
  [0, 1],
  [1, -1],
  [-1, 0],
  [0, -1],
  [-1, 1],
];

export function trInitialState(seatCount: number): TrState {
  const L = trLayout();
  return {
    cells: new Array(L.cells.length).fill(0) as number[],
    turn: 0,
    seatCount,
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

export function trValidateMove(state: TrState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { cell?: unknown } | null;
  if (!m || !Number.isInteger(m.cell)) return 'Send { cell }.';
  const idx = m.cell as number;
  const L = trLayout();
  if (idx < 0 || idx >= L.cells.length) return 'That hex is off the board.';
  if (state.cells[idx] !== 0) return 'That hex is taken.';
  return null;
}

export function trConnected(state: TrState, seat: number): boolean {
  const me = seat + 1;
  const { a, b } = trSides(seat);
  const L = trLayout();
  const bSet = new Set(b);
  const seen = new Set<number>();
  const queue: number[] = [];
  for (const idx of a) {
    if (state.cells[idx] === me && !seen.has(idx)) {
      seen.add(idx);
      queue.push(idx);
    }
  }
  while (queue.length) {
    const cur = queue.shift() as number;
    if (bSet.has(cur)) return true;
    const c = L.cells[cur];
    for (const [dq, dr] of TR_DIRS) {
      const ni = L.idx(c.q + dq, c.r + dr);
      if (ni < 0 || seen.has(ni)) continue;
      if (state.cells[ni] === me) {
        seen.add(ni);
        queue.push(ni);
      }
    }
  }
  return false;
}

export function trApplyMove(state: TrState, seat: number, move: unknown): TrState {
  const m = move as { cell: number };
  const cells = state.cells.slice();
  cells[m.cell] = seat + 1;
  const next: TrState = {
    ...state,
    cells,
    lastMove: m.cell,
    moveCount: state.moveCount + 1,
  };
  if (trConnected(next, seat)) {
    next.phase = 'finished';
    next.winnerSeat = seat;
    next.turn = seat;
    return next;
  }
  if (cells.every((v) => v !== 0)) {
    next.phase = 'finished';
    next.winnerSeat = null; // packed board, no crossing — shared
    next.turn = seat;
    return next;
  }
  next.turn = (seat + 1) % state.seatCount;
  return next;
}

export function trIsOver(state: TrState): boolean {
  return state.phase === 'finished';
}

export function trWinner(state: TrState): number | null {
  return state.winnerSeat;
}

export function trPlacement(state: TrState): TrPlacement[] {
  const rows = Array.from({ length: state.seatCount }, (_, seat) => ({ seat }));
  const win = state.winnerSeat;
  rows.sort((x, y) => {
    if (win !== null) {
      if (x.seat === win) return -1;
      if (y.seat === win) return 1;
    }
    return x.seat - y.seat;
  });
  return rows.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

/* ------------------------------- bots ------------------------------- */

/** Cheapest path cost for `seat` to link their sides (BFS over free cells). */
function trChainCost(state: TrState, seat: number, extraOwn?: number): number {
  const me = seat + 1;
  const { a, b } = trSides(seat);
  const L = trLayout();
  const bSet = new Set(b);
  const dist = new Array(state.cells.length).fill(-1) as number[];
  const queue: number[] = [];
  for (const idx of a) {
    if (state.cells[idx] === me || idx === extraOwn) {
      dist[idx] = 0;
      queue.push(idx);
    } else if (state.cells[idx] === 0) {
      dist[idx] = 1;
      queue.push(idx);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (bSet.has(cur)) return dist[cur];
    const c = L.cells[cur];
    for (const [dq, dr] of TR_DIRS) {
      const ni = L.idx(c.q + dq, c.r + dr);
      if (ni < 0 || dist[ni] !== -1) continue;
      const v = state.cells[ni];
      if (v === me || ni === extraOwn) {
        dist[ni] = dist[cur];
      } else if (v === 0) {
        dist[ni] = dist[cur] + 1;
      } else {
        continue; // enemy wall
      }
      queue.push(ni);
    }
  }
  return Infinity;
}

export function trBotMove(state: TrState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const empties: number[] = [];
  for (let i = 0; i < state.cells.length; i++) {
    if (state.cells[i] === 0) empties.push(i);
  }
  if (!empties.length) return { cell: 0 };
  if (tier === 'easy') {
    return { cell: empties[Math.floor(Math.random() * empties.length)] };
  }
  const myCost = trChainCost(state, seat);
  const oppCosts: number[] = [];
  for (let s = 0; s < state.seatCount; s++) {
    if (s !== seat) oppCosts.push(trChainCost(state, s));
  }
  let best = empties[0];
  let bestScore = -Infinity;
  for (const idx of empties) {
    // simulate by temporarily placing (own stone lowers own cost)
    const cells = state.cells.slice();
    cells[idx] = seat + 1;
    const sim: TrState = { ...state, cells };
    if (trConnected(sim, seat)) return { cell: idx };
    const mine = trChainCost(sim, seat);
    let oppBest = Infinity;
    for (let s = 0; s < state.seatCount; s++) {
      if (s === seat) continue;
      oppBest = Math.min(oppBest, trChainCost(sim, s));
    }
    let score = (myCost - mine) * 10 - Math.max(0, 12 - oppBest) * (tier === 'hard' ? 3 : 2);
    score += Math.random() * (tier === 'medium' ? 5 : 2);
    if (score > bestScore) {
      bestScore = score;
      best = idx;
    }
  }
  void oppCosts;
  return { cell: best };
}
