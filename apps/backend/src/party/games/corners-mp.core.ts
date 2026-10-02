/**
 * Corners MP (T9 3P + F14 4P, ONE core) — PURE core, backend-owned.
 *
 * Ataxx-flavoured corner war on 7x7: from a piece you either CLONE one
 * step (a new piece appears) or JUMP exactly two (the piece moves). Either
 * way, every enemy piece touching your landing square converts to your
 * colour. When the board fills (or nobody can move), the biggest army
 * wins — majority takes it.
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const AT_N = 7;

const AT_CORNERS: Record<number, number[][][]> = {
  3: [
    [
      [0, 0],
      [1, 1],
    ], // TL
    [
      [0, AT_N - 1],
      [1, AT_N - 2],
    ], // TR
    [
      [AT_N - 1, 0],
      [AT_N - 2, 1],
    ], // BL
  ],
  4: [
    [
      [0, 0],
      [1, 1],
    ],
    [
      [0, AT_N - 1],
      [1, AT_N - 2],
    ],
    [
      [AT_N - 1, 0],
      [AT_N - 2, 1],
    ],
    [
      [AT_N - 1, AT_N - 1],
      [AT_N - 2, AT_N - 2],
    ], // BR
  ],
};

export interface AtState {
  /** 0 empty, else seat + 1. */
  cells: number[];
  turn: number;
  seatCount: number;
  lastMove: { seat: number; from: number; to: number; cloned: boolean; flipped: number[] } | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface AtPlacement {
  seat: number;
  rank: number;
}

export function atInitialState(seatCount: number): AtState {
  const cells = new Array(AT_N * AT_N).fill(0) as number[];
  const corners = AT_CORNERS[seatCount >= 4 ? 4 : 3] ?? AT_CORNERS[4];
  corners.forEach((pair, seat) => {
    for (const [r, c] of pair.slice(0, seatCount)) {
      cells[r * AT_N + c] = seat + 1;
    }
  });
  return {
    cells,
    turn: 0,
    seatCount,
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

function atNeighborhood(idx: number, dist: number): number[] {
  const r = Math.floor(idx / AT_N);
  const c = idx % AT_N;
  const out: number[] = [];
  for (let dr = -dist; dr <= dist; dr++) {
    for (let dc = -dist; dc <= dist; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= AT_N || nc < 0 || nc >= AT_N) continue;
      out.push(nr * AT_N + nc);
    }
  }
  return out;
}

/** Legal destinations from a piece: 1-step clones and 2-step jumps. */
export function atDests(state: AtState, seat: number, from: number): number[] {
  if (state.cells[from] !== seat + 1) return [];
  const out: number[] = [];
  for (const to of atNeighborhood(from, 1)) {
    if (state.cells[to] === 0) out.push(to);
  }
  for (const to of atNeighborhood(from, 2)) {
    const r = Math.floor(to / AT_N);
    const c = to % AT_N;
    const fr = Math.floor(from / AT_N);
    const fc = from % AT_N;
    if (Math.max(Math.abs(r - fr), Math.abs(c - fc)) !== 2) continue; // exactly two — straight or diagonal
    if (state.cells[to] === 0) out.push(to);
  }
  return out;
}

export function atHasMove(state: AtState, seat: number): boolean {
  for (let from = 0; from < state.cells.length; from++) {
    if (state.cells[from] !== seat + 1) continue;
    if (atDests(state, seat, from).length) return true;
  }
  return false;
}

export function atValidateMove(state: AtState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { from?: unknown; to?: unknown } | null;
  if (!m || !Number.isInteger(m.from) || !Number.isInteger(m.to)) return 'Send { from, to }.';
  const from = m.from as number;
  const to = m.to as number;
  if (from < 0 || from >= AT_N * AT_N || to < 0 || to >= AT_N * AT_N)
    return 'That square is off the board.';
  if (state.cells[from] !== seat + 1) return 'Pick one of your own pieces.';
  if (state.cells[to] !== 0)
    return 'Land on an empty square (your landing converts the neighbours).';
  if (!atDests(state, seat, from).includes(to)) return 'That move is neither a clone nor a jump.';
  return null;
}

export function atApplyMove(state: AtState, seat: number, move: unknown): AtState {
  const m = move as { from: number; to: number };
  const me = seat + 1;
  const fr = Math.floor(m.from / AT_N);
  const fc = m.from % AT_N;
  const tr = Math.floor(m.to / AT_N);
  const tc = m.to % AT_N;
  const cloned = Math.max(Math.abs(tr - fr), Math.abs(tc - fc)) === 1;
  const cells = state.cells.slice();
  if (!cloned) cells[m.from] = 0;
  cells[m.to] = me;
  const flipped: number[] = [];
  for (const n of atNeighborhood(m.to, 1)) {
    const v = cells[n];
    if (v !== 0 && v !== me) {
      cells[n] = me;
      flipped.push(n);
    }
  }
  const next: AtState = {
    ...state,
    cells,
    lastMove: { seat, from: m.from, to: m.to, cloned, flipped },
    moveCount: state.moveCount + 1,
  };
  const full = cells.every((v) => v !== 0);
  if (full) {
    return atFinish(next, seat);
  }
  // next seat that can actually move
  let nxt = (seat + 1) % state.seatCount;
  let found = false;
  for (let i = 0; i < state.seatCount; i++) {
    if (atHasMove(next, nxt)) {
      found = true;
      break;
    }
    nxt = (nxt + 1) % state.seatCount;
  }
  if (!found) {
    return atFinish(next, seat);
  }
  next.turn = nxt;
  return next;
}

function atFinish(state: AtState, mover: number): AtState {
  const counts = Array.from({ length: state.seatCount }, (_, s) => atCount(state, s));
  let best = -1;
  let bestSeat: number | null = null;
  let tie = false;
  for (let s = 0; s < state.seatCount; s++) {
    const c = counts[s];
    if (c > best) {
      best = c;
      bestSeat = s;
      tie = false;
    } else if (c === best) {
      tie = true;
    }
  }
  return {
    ...state,
    phase: 'finished',
    winnerSeat: tie ? null : bestSeat,
    turn: mover,
  };
}

function atCount(state: AtState, seat: number): number {
  let n = 0;
  for (const v of state.cells) if (v === seat + 1) n += 1;
  return n;
}

export function atIsOver(state: AtState): boolean {
  return state.phase === 'finished';
}

export function atWinner(state: AtState): number | null {
  return state.winnerSeat;
}

export function atPlacement(state: AtState): AtPlacement[] {
  const rows = Array.from({ length: state.seatCount }, (_, s) => ({
    seat: s,
    n: atCount(state, s),
  }));
  const win = state.winnerSeat;
  rows.sort((x, y) => {
    if (win !== null) {
      if (x.seat === win) return -1;
      if (y.seat === win) return 1;
    }
    return y.n - x.n || x.seat - y.seat;
  });
  return rows.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

export function atBotMove(state: AtState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const cands: Array<{ from: number; to: number; score: number }> = [];
  for (let from = 0; from < state.cells.length; from++) {
    if (state.cells[from] !== seat + 1) continue;
    for (const to of atDests(state, seat, from)) {
      const tr = Math.floor(to / AT_N);
      const tc = to % AT_N;
      const fr = Math.floor(from / AT_N);
      const fc = from % AT_N;
      const cloned = Math.max(Math.abs(tr - fr), Math.abs(tc - fc)) === 1;
      const flips = atNeighborhood(to, 1).filter((n) => {
        const v = state.cells[n];
        return v !== 0 && v !== seat + 1;
      }).length;
      let score = flips * 35 + (cloned ? 10 : 3);
      score += 4 - (Math.abs(tr - 3) + Math.abs(tc - 3)) / 2; // centre is comfy
      score += Math.random() * (tier === 'easy' ? 120 : tier === 'medium' ? 25 : 8);
      cands.push({ from, to, score });
    }
  }
  if (!cands.length) return { from: 0, to: 0 }; // defensive; turn skipping prevents it
  cands.sort((a, b) => b.score - a.score);
  const top = cands.slice(0, tier === 'easy' ? Math.max(1, Math.ceil(cands.length / 3)) : 2);
  const pick = top[Math.floor(Math.random() * top.length)];
  return { from: pick.from, to: pick.to };
}
