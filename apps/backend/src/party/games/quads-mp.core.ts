/**
 * Quads & Trips MP (T49 3P + F49 4P, ONE core) — PURE core, backend-owned.
 *
 * The Yavalath twist: four in a row WINS — but making exactly THREE in a
 * row loses you the game on the spot (unless the same move also makes
 * four). Dots on a hex board; last player standing (or the first to line
 * up four) takes it.
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const QT_R: Record<number, number> = { 3: 3, 4: 3 };

export interface QtCell {
  q: number;
  r: number;
}
export interface QtState {
  /** 0 empty, else seat + 1. */
  cells: number[];
  turn: number;
  seatCount: number;
  out: number[];
  lastMove: { seat: number; idx: number } | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface QtPlacement {
  seat: number;
  rank: number;
}

export function qtLayout(seatCount: number): {
  cells: QtCell[];
  idx: (q: number, r: number) => number;
} {
  const R = QT_R[seatCount >= 4 ? 4 : 3] ?? 3;
  const cells: QtCell[] = [];
  const map = new Map<string, number>();
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      if (Math.abs(q + r) <= R) {
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

const QT_DIRS: number[][] = [
  [1, 0],
  [0, 1],
  [1, -1],
  [-1, 0],
  [0, -1],
  [-1, 1],
];

export function qtInitialState(seatCount: number): QtState {
  const layout = qtLayout(seatCount);
  return {
    cells: new Array(layout.cells.length).fill(0) as number[],
    turn: 0,
    seatCount,
    out: [],
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

/** Length of the run of `color` through idx in one direction. */
function qtRun(
  cells: number[],
  layout: { cells: QtCell[]; idx: (q: number, r: number) => number },
  idx: number,
  color: number,
  dir: number[]
): number {
  const c = layout.cells[idx];
  let total = 1;
  for (const sgn of [1, -1]) {
    let k = 1;
    for (;;) {
      const ni = layout.idx(c.q + dir[0] * k * sgn, c.r + dir[1] * k * sgn);
      if (ni < 0 || cells[ni] !== color) break;
      k += 1;
    }
    total += k - 1;
  }
  return total;
}

export function qtValidateMove(state: QtState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { cell?: unknown } | null;
  if (!m || !Number.isInteger(m.cell)) return 'Send { cell }.';
  const idx = m.cell as number;
  const layout = qtLayout(state.seatCount);
  if (idx < 0 || idx >= layout.cells.length) return 'That hex is off the board.';
  if (state.cells[idx] !== 0) return 'That hex is taken.';
  return null;
}

export function qtApplyMove(state: QtState, seat: number, move: unknown): QtState {
  const m = move as { cell: number };
  const layout = qtLayout(state.seatCount);
  const cells = state.cells.slice();
  const me = seat + 1;
  cells[m.cell] = me;
  const out = state.out.slice();
  let phase: 'playing' | 'finished' = state.phase;
  let winnerSeat: number | null = state.winnerSeat;
  let won = false;
  let tripped = false;
  for (const dir of QT_DIRS) {
    const len = qtRun(cells, layout, m.cell, me, dir);
    if (len >= 4) won = true;
    else if (len === 3) tripped = true;
  }
  const next: QtState = {
    ...state,
    cells,
    out,
    lastMove: { seat, idx: m.cell },
    moveCount: state.moveCount + 1,
  };
  if (won) {
    next.phase = 'finished';
    next.winnerSeat = seat;
    next.turn = seat;
    return next;
  }
  if (tripped) out.push(seat);
  const alive = Array.from({ length: state.seatCount }, (_, s) => s).filter(
    (s) => !out.includes(s)
  );
  if (alive.length <= 1) {
    next.phase = 'finished';
    next.winnerSeat = alive.length === 1 ? alive[0] : null;
    next.turn = alive.length === 1 ? alive[0] : seat;
    return next;
  }
  if (cells.every((v) => v !== 0)) {
    next.phase = 'finished';
    next.winnerSeat = null; // full board, nobody lined up four — shared
    next.turn = seat;
    return next;
  }
  let nxt = (seat + 1) % state.seatCount;
  for (let i = 0; i < state.seatCount; i++) {
    if (!out.includes(nxt)) break;
    nxt = (nxt + 1) % state.seatCount;
  }
  next.turn = nxt;
  return next;
}

export function qtIsOver(state: QtState): boolean {
  return state.phase === 'finished';
}

export function qtWinner(state: QtState): number | null {
  return state.winnerSeat;
}

export function qtPlacement(state: QtState): QtPlacement[] {
  const alive = Array.from({ length: state.seatCount }, (_, s) => s).filter(
    (s) => !state.out.includes(s)
  );
  const win = state.winnerSeat;
  const aliveSorted = alive.slice().sort((a, b) => {
    if (win !== null) {
      if (a === win) return -1;
      if (b === win) return 1;
    }
    return a - b;
  });
  const order = aliveSorted.concat(state.out.slice().reverse());
  return order.map((seat, i) => ({ seat, rank: i + 1 }));
}

/* ------------------------------- bots ------------------------------- */

export function qtBotMove(state: QtState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const layout = qtLayout(state.seatCount);
  const me = seat + 1;
  const safe: Array<{ idx: number; score: number }> = [];
  let fallback: number | null = null;
  for (let idx = 0; idx < state.cells.length; idx++) {
    if (state.cells[idx] !== 0) continue;
    const sim = state.cells.slice();
    sim[idx] = me;
    let win = false;
    let lose = false;
    let ownScore = 0;
    for (const dir of QT_DIRS) {
      const len = qtRun(sim, layout, idx, me, dir);
      if (len >= 4) win = true;
      else if (len === 3) lose = true;
      else if (len === 2) ownScore += 40;
      else ownScore += 6;
    }
    if (win) return { cell: idx };
    if (lose) {
      if (fallback === null) fallback = idx;
      continue;
    }
    let score = ownScore;
    if (tier !== 'easy') {
      // block opponents: a cell where THEIR run would hit 4 is a must-block
      for (let s = 0; s < state.seatCount; s++) {
        if (s === seat || state.out.includes(s)) continue;
        for (const dir of QT_DIRS) {
          const len = qtRun(sim, layout, idx, s + 1, dir);
          if (len >= 4) score += 9000;
          else if (len === 2) score += 30;
        }
      }
      // seek bridges: how many single stones away is my FOUR?
      let nextWins = 0;
      for (let e2 = 0; e2 < sim.length && nextWins < 4; e2++) {
        if (sim[e2] !== 0) continue;
        const sim2 = sim.slice();
        sim2[e2] = me;
        for (const dir of QT_DIRS) {
          if (qtRun(sim2, layout, e2, me, dir) >= 4) {
            nextWins += 1;
            break;
          }
        }
      }
      score += nextWins * 800;
    }
    score += Math.random() * (tier === 'easy' ? 500 : tier === 'medium' ? 80 : 20);
    safe.push({ idx, score });
  }
  if (!safe.length) {
    return { cell: fallback ?? 0 }; // boxed in — doomed anyway
  }
  safe.sort((a, b) => b.score - a.score);
  const top = safe.slice(0, tier === 'easy' ? Math.max(1, Math.ceil(safe.length / 3)) : 2);
  return { cell: top[Math.floor(Math.random() * top.length)].idx };
}
