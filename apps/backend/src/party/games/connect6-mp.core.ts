/**
 * Connect6 MP (T25, 3P — seats up to 4) — PURE core, backend-owned.
 *
 * Six-in-a-row, but everyone drops TWO stones a turn (the very first move
 * is a single stone). Rotating three ways, first six wins.
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const C6_N = 15;
export const C6_WIN = 6;

export interface C6State {
  /** 0 = empty, else seat + 1. */
  cells: number[];
  turn: number;
  seatCount: number;
  /** Stones the current turn still has to place. */
  placing: number;
  lastMove: number | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface C6Placement {
  seat: number;
  rank: number;
}

export function c6InitialState(seatCount: number): C6State {
  return {
    cells: new Array(C6_N * C6_N).fill(0) as number[],
    turn: 0,
    seatCount,
    placing: 1, // the very first move is a single stone
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

function c6At(cells: number[], r: number, c: number): number {
  if (r < 0 || r >= C6_N || c < 0 || c >= C6_N) return -1;
  return cells[r * C6_N + c];
}

export function c6ValidateMove(state: C6State, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { r?: unknown; c?: unknown } | null;
  if (!m || !Number.isInteger(m.r) || !Number.isInteger(m.c)) return 'Send { r, c }.';
  const r = m.r as number;
  const c = m.c as number;
  if (r < 0 || r >= C6_N || c < 0 || c >= C6_N) return 'That cell is off the board.';
  if (state.cells[r * C6_N + c] !== 0) return 'That cell is taken.';
  return null;
}

export function c6ApplyMove(state: C6State, seat: number, move: unknown): C6State {
  const m = move as { r: number; c: number };
  const idx = m.r * C6_N + m.c;
  const me = seat + 1;
  const cells = state.cells.slice();
  cells[idx] = me;
  let phase: 'playing' | 'finished' = state.phase;
  let winnerSeat: number | null = state.winnerSeat;
  let turn = state.turn;
  let placing = state.placing - 1;
  if (c6HasLine(cells, me, idx)) {
    phase = 'finished';
    winnerSeat = seat;
  } else if (placing <= 0) {
    turn = (seat + 1) % state.seatCount;
    placing = 2;
    if (cells.every((v) => v !== 0)) {
      phase = 'finished';
      winnerSeat = null; // a full board with no line is a shared draw
    }
  }
  return {
    ...state,
    cells,
    lastMove: idx,
    moveCount: state.moveCount + 1,
    turn,
    placing,
    phase,
    winnerSeat,
  };
}

function c6HasLine(cells: number[], me: number, idx: number): boolean {
  const r = Math.floor(idx / C6_N);
  const c = idx % C6_N;
  for (const [dr, dc] of [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]) {
    let total = 1;
    for (const sgn of [1, -1]) {
      let k = 1;
      while (c6At(cells, r + dr * k * sgn, c + dc * k * sgn) === me) k++;
      total += k - 1;
    }
    if (total >= C6_WIN) return true;
  }
  return false;
}

export function c6IsOver(state: C6State): boolean {
  return state.phase === 'finished';
}

export function c6Winner(state: C6State): number | null {
  return state.winnerSeat;
}

export function c6Placement(state: C6State): C6Placement[] {
  const stones = new Array(state.seatCount).fill(0) as number[];
  for (const v of state.cells) {
    if (v !== 0) stones[v - 1] += 1;
  }
  const rows = Array.from({ length: state.seatCount }, (_, seat) => ({
    seat,
    stones: stones[seat],
  }));
  const win = state.winnerSeat;
  rows.sort((x, y) => {
    if (win !== null) {
      if (x.seat === win) return -1;
      if (y.seat === win) return 1;
    }
    return y.stones - x.stones || x.seat - y.seat;
  });
  return rows.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

/* ------------------------------- bots ------------------------------- */
/** Multi-threat bonus: this cell powers two strong runs at once. */
function c6MultiThreat(cells: number[], color: number, idx: number): number {
  const r = Math.floor(idx / C6_N);
  const c = idx % C6_N;
  let strong = 0;
  for (const [dr, dc] of [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]) {
    let fwd = 0;
    while (c6At(cells, r + dr * (fwd + 1), c + dc * (fwd + 1)) === color) fwd++;
    let bwd = 0;
    while (c6At(cells, r - dr * (bwd + 1), c - dc * (bwd + 1)) === color) bwd++;
    const len = 1 + fwd + bwd;
    const openF = c6At(cells, r + dr * (fwd + 1), c + dc * (fwd + 1)) === 0 ? 1 : 0;
    const openB = c6At(cells, r - dr * (bwd + 1), c - dc * (bwd + 1)) === 0 ? 1 : 0;
    if (c6PatternValue(len, openF + openB) >= 5e4) strong++;
  }
  return strong >= 2 ? 3e6 : 0;
}

function c6PatternValue(len: number, open: number): number {
  if (len >= C6_WIN) return 1e9;
  if (len === 5) return open === 2 ? 1e7 : open === 1 ? 5e5 : 0;
  if (len === 4) return open === 2 ? 1e6 : open === 1 ? 8e4 : 0;
  if (len === 3) return open === 2 ? 5e4 : open === 1 ? 6e3 : 0;
  if (len === 2) return open === 2 ? 800 : open === 1 ? 150 : 0;
  return open === 2 ? 18 : open === 1 ? 8 : 0;
}

function c6PatternScore(cells: number[], color: number, idx: number): number {
  const r = Math.floor(idx / C6_N);
  const c = idx % C6_N;
  let score = 0;
  for (const [dr, dc] of [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]) {
    let fwd = 0;
    while (c6At(cells, r + dr * (fwd + 1), c + dc * (fwd + 1)) === color) fwd++;
    let bwd = 0;
    while (c6At(cells, r - dr * (bwd + 1), c - dc * (bwd + 1)) === color) bwd++;
    const len = 1 + fwd + bwd;
    const openF = c6At(cells, r + dr * (fwd + 1), c + dc * (fwd + 1)) === 0 ? 1 : 0;
    const openB = c6At(cells, r - dr * (bwd + 1), c - dc * (bwd + 1)) === 0 ? 1 : 0;
    score += c6PatternValue(len, openF + openB);
  }
  return score;
}

export function c6BotMove(state: C6State, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const me = seat + 1;
  if (state.moveCount === 0) return { r: 7, c: 7 };
  const cands: number[] = [];
  for (let idx = 0; idx < C6_N * C6_N; idx++) {
    if (state.cells[idx] !== 0) continue;
    const r = Math.floor(idx / C6_N);
    const c = idx % C6_N;
    let near = false;
    for (let dr = -2; dr <= 2 && !near; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (c6At(state.cells, r + dr, c + dc) > 0) {
          near = true;
          break;
        }
      }
    }
    if (near) cands.push(idx);
  }
  if (cands.length === 0) {
    for (let idx = 0; idx < C6_N * C6_N; idx++) {
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
    const sim = state.cells.slice();
    sim[idx] = me;
    let score = 0;
    if (c6HasLine(sim, me, idx)) score += 5e8;
    score += c6PatternScore(sim, me, idx) + c6MultiThreat(sim, me, idx);
    if (tier === 'medium' || tier === 'hard') {
      let def = 0;
      for (let other = 1; other <= state.seatCount; other++) {
        if (other === me) continue;
        def = Math.max(def, c6PatternScore(sim, other, idx));
      }
      score += def * (tier === 'hard' ? 0.4 : 0.25);
    } else {
      score = score * 0.3;
    }
    score += Math.random() * (tier === 'easy' ? 900 : tier === 'medium' ? 800000 : 120000);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  }
  return { r: Math.floor(bestIdx / C6_N), c: bestIdx % C6_N };
}
