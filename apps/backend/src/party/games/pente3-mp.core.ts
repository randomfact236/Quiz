/**
 * Pente-3 MP (T19, 3P — seats up to 4) — PURE core, backend-owned.
 *
 * Three-colour Pente on 13x13: line up five of your colour, or capture five
 * pairs by sandwiching exactly two enemy stones between two of yours. Each
 * capture steals the sandwiched pair (they leave the board). First player
 * to a five-in-a-row OR five captured pairs wins.
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const P3_N = 13;
const N2 = P3_N * P3_N;
const P3_DIRS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export interface P3State {
  /** 0 = empty, else seat + 1 (the stone colour). */
  cells: number[];
  turn: number;
  seatCount: number;
  /** Captured PAIRS per seat (5 pairs = win). */
  captured: number[];
  lastMove: number | null;
  lastCaptured: number[];
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}

export interface P3Placement {
  seat: number;
  rank: number;
}

export function p3InitialState(seatCount: number): P3State {
  return {
    cells: new Array(N2).fill(0) as number[],
    turn: 0,
    seatCount,
    captured: new Array(seatCount).fill(0) as number[],
    lastMove: null,
    lastCaptured: [],
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

function p3CellAt(cells: number[], r: number, c: number): number {
  if (r < 0 || r >= P3_N || c < 0 || c >= P3_N) return -1;
  return cells[r * P3_N + c];
}

/** Cells captured if `me` (colour value) places at idx. */
export function p3CapturesAt(cells: number[], me: number, idx: number): number[] {
  const r = Math.floor(idx / P3_N);
  const c = idx % P3_N;
  const out: number[] = [];
  for (const [dr, dc] of P3_DIRS) {
    for (const sgn of [1, -1]) {
      const v1 = p3CellAt(cells, r + dr * sgn, c + dc * sgn);
      const v2 = p3CellAt(cells, r + dr * 2 * sgn, c + dc * 2 * sgn);
      const v3 = p3CellAt(cells, r + dr * 3 * sgn, c + dc * 3 * sgn);
      if (v3 === -1) continue; // needs the full X-O-O-X window
      if (v1 !== 0 && v1 === v2 && v1 !== me && v3 === me) {
        out.push(
          (r + dr * sgn) * P3_N + (c + dc * sgn),
          (r + dr * 2 * sgn) * P3_N + (c + dc * 2 * sgn)
        );
      }
    }
  }
  return out;
}

function p3HasFive(cells: number[], me: number, idx: number): boolean {
  const r = Math.floor(idx / P3_N);
  const c = idx % P3_N;
  for (const [dr, dc] of P3_DIRS) {
    let total = 1;
    for (const sgn of [1, -1]) {
      let k = 1;
      while (p3CellAt(cells, r + dr * k * sgn, c + dc * k * sgn) === me) k++;
      total += k - 1;
    }
    if (total >= 5) return true;
  }
  return false;
}

export function p3ValidateMove(state: P3State, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { r?: unknown; c?: unknown } | null;
  if (!m || !Number.isInteger(m.r) || !Number.isInteger(m.c)) return 'Send { r, c }.';
  const r = m.r as number;
  const c = m.c as number;
  if (r < 0 || r >= P3_N || c < 0 || c >= P3_N) return 'That cell is off the board.';
  if (state.cells[r * P3_N + c] !== 0) return 'That cell is taken.';
  return null;
}

export function p3ApplyMove(state: P3State, seat: number, move: unknown): P3State {
  const m = move as { r: number; c: number };
  const idx = m.r * P3_N + m.c;
  const me = seat + 1;
  const cells = state.cells.slice();
  cells[idx] = me;
  const caps = p3CapturesAt(state.cells, me, idx);
  for (const ci of caps) cells[ci] = 0;
  const captured = state.captured.slice();
  captured[seat] += caps.length / 2;
  const moveCount = state.moveCount + 1;
  let phase: 'playing' | 'finished' = state.phase;
  let winnerSeat: number | null = state.winnerSeat;
  if (p3HasFive(cells, me, idx) || captured[seat] >= 5) {
    phase = 'finished';
    winnerSeat = seat;
  } else if (cells.every((v) => v !== 0)) {
    phase = 'finished';
    winnerSeat = null; // a full board with no winner is a shared draw
  }
  return {
    ...state,
    cells,
    captured,
    lastMove: idx,
    lastCaptured: caps,
    moveCount,
    turn: (seat + 1) % state.seatCount,
    phase,
    winnerSeat,
  };
}

export function p3IsOver(state: P3State): boolean {
  return state.phase === 'finished';
}

export function p3Winner(state: P3State): number | null {
  return state.winnerSeat;
}

export function p3Placement(state: P3State): P3Placement[] {
  const stones = new Array(state.seatCount).fill(0);
  for (const v of state.cells) {
    if (v !== 0) stones[v - 1]++;
  }
  const rows = Array.from({ length: state.seatCount }, (_, seat) => ({
    seat,
    pairs: state.captured[seat] as number,
    stones: stones[seat] as number,
  }));
  const win = state.winnerSeat;
  rows.sort((x, y) => {
    if (win !== null) {
      if (x.seat === win) return -1;
      if (y.seat === win) return 1;
    }
    return y.pairs - x.pairs || y.stones - x.stones || x.seat - y.seat;
  });
  return rows.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

/* ------------------------------- bots ------------------------------- */

function p3PatternValue(len: number, open: number): number {
  if (len >= 5) return 1e8;
  if (len === 4) return open === 2 ? 2.5e6 : open === 1 ? 4e5 : 0;
  if (len === 3) return open === 2 ? 6e4 : open === 1 ? 3e3 : 0;
  if (len === 2) return open === 2 ? 600 : open === 1 ? 120 : 0;
  return open === 2 ? 14 : open === 1 ? 6 : 0;
}

function p3PatternScore(cells: number[], color: number, idx: number): number {
  const r = Math.floor(idx / P3_N);
  const c = idx % P3_N;
  let score = 0;
  for (const [dr, dc] of P3_DIRS) {
    let fwd = 0;
    while (p3CellAt(cells, r + dr * (fwd + 1), c + dc * (fwd + 1)) === color) fwd++;
    let bwd = 0;
    while (p3CellAt(cells, r - dr * (bwd + 1), c - dc * (bwd + 1)) === color) bwd++;
    const len = 1 + fwd + bwd;
    const openF = p3CellAt(cells, r + dr * (fwd + 1), c + dc * (fwd + 1)) === 0 ? 1 : 0;
    const openB = p3CellAt(cells, r - dr * (bwd + 1), c - dc * (bwd + 1)) === 0 ? 1 : 0;
    score += p3PatternValue(len, openF + openB);
  }
  return score;
}

function p3HasNeighbor(cells: number[], idx: number, dist: number): boolean {
  const r = Math.floor(idx / P3_N);
  const c = idx % P3_N;
  for (let dr = -dist; dr <= dist; dr++) {
    for (let dc = -dist; dc <= dist; dc++) {
      if (dr === 0 && dc === 0) continue;
      if (p3CellAt(cells, r + dr, c + dc) > 0) return true;
    }
  }
  return false;
}

export function p3BotMove(state: P3State, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const me = seat + 1;
  if (state.moveCount === 0) return { r: (P3_N - 1) / 2, c: (P3_N - 1) / 2 };
  const cands: number[] = [];
  for (let idx = 0; idx < N2; idx++) {
    if (state.cells[idx] !== 0) continue;
    if (!p3HasNeighbor(state.cells, idx, 2)) continue;
    cands.push(idx);
  }
  if (cands.length === 0) {
    for (let idx = 0; idx < N2; idx++) {
      if (state.cells[idx] === 0) {
        cands.push(idx);
        break;
      }
    }
  }
  if (cands.length === 0) return { r: 0, c: 0 };
  let bestIdx = cands[0];
  let bestScore = -Infinity;
  for (const idx of cands) {
    const caps = p3CapturesAt(state.cells, me, idx);
    const pairs = caps.length / 2;
    const sim = state.cells.slice();
    sim[idx] = me;
    for (const ci of caps) sim[ci] = 0;
    let score = 0;
    if (state.captured[seat] + pairs >= 5) score += 2e8;
    if (p3HasFive(sim, me, idx)) score += 1.5e8;
    score += p3PatternScore(sim, me, idx);
    if (tier === 'medium' || tier === 'hard') {
      let def = 0;
      for (let other = 1; other <= state.seatCount; other++) {
        if (other === me) continue;
        def = Math.max(def, p3PatternScore(sim, other, idx));
      }
      score += def * (tier === 'hard' ? 0.9 : 0.6);
      score += pairs * (tier === 'hard' ? 5e4 : 3e4);
    } else {
      score = score * 0.35 + pairs * 2e3;
    }
    score += Math.random() * (tier === 'easy' ? 900 : tier === 'medium' ? 300 : 60);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  }
  return { r: Math.floor(bestIdx / P3_N), c: bestIdx % P3_N };
}
