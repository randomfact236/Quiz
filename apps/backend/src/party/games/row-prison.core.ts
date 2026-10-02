/**
 * Row Prison MP (T3 3P + F19 4P, ONE core) — PURE core, backend-owned.
 * (Original party design.)
 *
 * One row at a time: after a stone lands, the NEXT player is imprisoned in
 * that same row — if it has an open cell they must take it; if it is full,
 * the prison breaks and they may open any fresh row. First to line up FOUR
 * of their colour wins. Winner 1st, the rest by stones placed.
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const RP_N = 10;
const RP_DIRS: number[][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export interface RpState {
  /** 0 empty, else seat + 1. */
  cells: number[];
  /** Row the next player must use, or -1 for a free choice. */
  prisonRow: number;
  turn: number;
  seatCount: number;
  lastMove: number | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface RpPlacement {
  seat: number;
  rank: number;
}

export function rpInitialState(seatCount: number): RpState {
  return {
    cells: new Array(RP_N * RP_N).fill(0) as number[],
    prisonRow: -1,
    turn: 0,
    seatCount,
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

function rpRowOpen(cells: number[], row: number): boolean {
  for (let c = 0; c < RP_N; c++) {
    if (cells[row * RP_N + c] === 0) return true;
  }
  return false;
}

export function rpValidateMove(state: RpState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { cell?: unknown } | null;
  if (!m || !Number.isInteger(m.cell)) return 'Send { cell }.';
  const idx = m.cell as number;
  if (idx < 0 || idx >= RP_N * RP_N) return 'That square is off the board.';
  if (state.cells[idx] !== 0) return 'That square is taken.';
  const row = Math.floor(idx / RP_N);
  if (state.prisonRow >= 0 && row !== state.prisonRow) {
    return 'The prison row holds you \u2014 row ' + (state.prisonRow + 1) + ' only.';
  }
  return null;
}

function rpHasLine(cells: number[], me: number, idx: number): boolean {
  const r = Math.floor(idx / RP_N);
  const c = idx % RP_N;
  for (const [dr, dc] of RP_DIRS) {
    let total = 1;
    for (const sgn of [1, -1]) {
      let k = 1;
      for (;;) {
        const nr = r + dr * k * sgn;
        const nc = c + dc * k * sgn;
        if (nr < 0 || nr >= RP_N || nc < 0 || nc >= RP_N) break;
        if (cells[nr * RP_N + nc] !== me) break;
        k += 1;
      }
      total += k - 1;
    }
    if (total >= 4) return true;
  }
  return false;
}

export function rpApplyMove(state: RpState, seat: number, move: unknown): RpState {
  const m = move as { cell: number };
  const idx = m.cell;
  const row = Math.floor(idx / RP_N);
  const cells = state.cells.slice();
  cells[idx] = seat + 1;
  const next: RpState = {
    ...state,
    cells,
    lastMove: idx,
    moveCount: state.moveCount + 1,
  };
  if (rpHasLine(cells, seat + 1, idx)) {
    next.phase = 'finished';
    next.winnerSeat = seat;
    return next;
  }
  // the prison: next player is pinned to this row unless it is full
  next.prisonRow = rpRowOpen(cells, row) ? row : -1;
  let nxt = (seat + 1) % state.seatCount;
  // don't pin a player into a row they... (row full handled above)
  if (cells.every((v) => v !== 0)) {
    next.phase = 'finished';
    next.winnerSeat = null; // a full board with no four — shared
    next.turn = seat;
    return next;
  }
  next.turn = nxt;
  return next;
}

export function rpIsOver(state: RpState): boolean {
  return state.phase === 'finished';
}

export function rpWinner(state: RpState): number | null {
  return state.winnerSeat;
}

export function rpPlacement(state: RpState): RpPlacement[] {
  const counts = new Array(state.seatCount).fill(0) as number[];
  for (const v of state.cells) {
    if (v !== 0) counts[v - 1] += 1;
  }
  const rows = Array.from({ length: state.seatCount }, (_, seat) => ({ seat, n: counts[seat] }));
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

export function rpBotMove(state: RpState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const me = seat + 1;
  const cells = state.cells;
  const legal: number[] = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] !== 0) continue;
    if (state.prisonRow >= 0 && Math.floor(idx / RP_N) !== state.prisonRow) continue;
    legal.push(idx);
  }
  if (!legal.length) {
    for (let idx = 0; idx < cells.length; idx++) {
      if (cells[idx] === 0) {
        legal.push(idx);
        break;
      }
    }
  }
  if (!legal.length) return { cell: 0 };
  if (tier === 'easy') {
    return { cell: legal[Math.floor(Math.random() * legal.length)] };
  }
  let best = legal[0];
  let bestScore = -Infinity;
  for (const idx of legal) {
    const sim = cells.slice();
    sim[idx] = me;
    if (rpHasLine(sim, me, idx)) return { cell: idx };
    let score = 0;
    // own potential: count neighbours of mine around this cell
    const r = Math.floor(idx / RP_N);
    const c = idx % RP_N;
    for (const [dr, dc] of RP_DIRS) {
      for (const sgn of [1, -1]) {
        const nr = r + dr * sgn;
        const nc = c + dc * sgn;
        if (nr < 0 || nr >= RP_N || nc < 0 || nc >= RP_N) continue;
        if (sim[nr * RP_N + nc] === me) score += 6;
      }
    }
    // defence: would an opponent win here?
    for (let s = 0; s < state.seatCount; s++) {
      if (s === seat) continue;
      const sim2 = cells.slice();
      sim2[idx] = s + 1;
      if (rpHasLine(sim2, s + 1, idx)) score += 40;
    }
    // keep the prison awkward for the next player: placing so the row stays OPEN pins them here
    score += Math.random() * (tier === 'medium' ? 4 : 1.5);
    if (score > bestScore) {
      bestScore = score;
      best = idx;
    }
  }
  return { cell: best };
}
