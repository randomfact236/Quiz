/**
 * Pentago MP (T46 3P + F48 4P, ONE core) — PURE core, backend-owned.
 *
 * The famous twist-and-win: place a marble on the 6x6 board, then rotate
 * one of the four 3x3 quadrants a quarter turn. First player to line up
 * FIVE of their colour (after their full turn) wins.
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const PG_N = 6;
const PG_DIRS: number[][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export interface PgState {
  /** 0 empty, else seat + 1. */
  cells: number[];
  turn: number;
  seatCount: number;
  lastMove: { seat: number; place: number; quad: number; dir: 'cw' | 'ccw' } | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface PgPlacement {
  seat: number;
  rank: number;
}

export function pgInitialState(seatCount: number): PgState {
  return {
    cells: new Array(PG_N * PG_N).fill(0) as number[],
    turn: 0,
    seatCount,
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

/** Rotate quadrant 0..3 (TL, TR, BL, BR) 90 degrees. */
export function pgRotateQuad(cells: number[], quad: number, dir: 'cw' | 'ccw'): number[] {
  const r0 = quad >= 2 ? 3 : 0;
  const c0 = quad % 2 === 1 ? 3 : 0;
  const out = cells.slice();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let ni: number;
      let nj: number;
      if (dir === 'cw') {
        ni = j;
        nj = 2 - i;
      } else {
        ni = 2 - j;
        nj = i;
      }
      out[(r0 + ni) * PG_N + (c0 + nj)] = cells[(r0 + i) * PG_N + (c0 + j)];
    }
  }
  return out;
}

export function pgHasFive(cells: number[], color: number): boolean {
  for (let r = 0; r < PG_N; r++) {
    for (let c = 0; c < PG_N; c++) {
      if (cells[r * PG_N + c] !== color) continue;
      for (const [dr, dc] of PG_DIRS) {
        let len = 1;
        for (let k = 1; k < 5; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= PG_N || nc < 0 || nc >= PG_N) break;
          if (cells[nr * PG_N + nc] !== color) break;
          len += 1;
        }
        if (len >= 5) return true;
      }
    }
  }
  return false;
}

export function pgValidateMove(state: PgState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { place?: unknown; quad?: unknown; dir?: unknown } | null;
  if (!m || !Number.isInteger(m.place)) return 'Send { place, quad, dir }.';
  const idx = m.place as number;
  if (idx < 0 || idx >= PG_N * PG_N) return 'That square is off the board.';
  if (state.cells[idx] !== 0) return 'That square is taken.';
  if (!Number.isInteger(m.quad) || (m.quad as number) < 0 || (m.quad as number) > 3)
    return 'Pick a quadrant (0-3).';
  if (m.dir !== 'cw' && m.dir !== 'ccw') return 'Send dir as cw or ccw.';
  return null;
}

export function pgApplyMove(state: PgState, seat: number, move: unknown): PgState {
  const m = move as { place: number; quad: number; dir: 'cw' | 'ccw' };
  const me = seat + 1;
  let cells = state.cells.slice();
  cells[m.place] = me;
  cells = pgRotateQuad(cells, m.quad, m.dir);
  const next: PgState = {
    ...state,
    cells,
    lastMove: { seat, place: m.place, quad: m.quad, dir: m.dir },
    moveCount: state.moveCount + 1,
    turn: (seat + 1) % state.seatCount,
  };
  if (pgHasFive(cells, me)) {
    next.phase = 'finished';
    next.winnerSeat = seat;
  } else if (cells.every((v) => v !== 0)) {
    next.phase = 'finished';
    next.winnerSeat = null; // a full board with no five — shared
  }
  return next;
}

export function pgIsOver(state: PgState): boolean {
  return state.phase === 'finished';
}

export function pgWinner(state: PgState): number | null {
  return state.winnerSeat;
}

function pgCount(cells: number[], color: number): number {
  let n = 0;
  for (const v of cells) if (v === color) n += 1;
  return n;
}

export function pgPlacement(state: PgState): PgPlacement[] {
  const rows = Array.from({ length: state.seatCount }, (_, seat) => ({
    seat,
    n: pgCount(state.cells, seat + 1),
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

/* ------------------------------- bots ------------------------------- */

function pgPatternScore(cells: number[], color: number): number {
  let score = 0;
  for (let r = 0; r < PG_N; r++) {
    for (let c = 0; c < PG_N; c++) {
      for (const [dr, dc] of PG_DIRS) {
        // window of 5 starting here
        let mine = 0;
        let other = 0;
        for (let k = 0; k < 5; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= PG_N || nc < 0 || nc >= PG_N) {
            mine = -1;
            break;
          }
          const v = cells[nr * PG_N + nc];
          if (v === color) mine += 1;
          else if (v !== 0) other += 1;
        }
        if (mine <= 0 || other > 0) continue;
        score += mine === 4 ? 400 : mine === 3 ? 60 : mine === 2 ? 10 : 0;
      }
    }
  }
  return score;
}

export function pgBotMove(state: PgState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const me = seat + 1;
  const empties: number[] = [];
  for (let i = 0; i < state.cells.length; i++) {
    if (state.cells[i] === 0) empties.push(i);
  }
  if (!empties.length) return { place: 0, quad: 0, dir: 'cw' };
  const cands: Array<{ place: number; quad: number; dir: 'cw' | 'ccw'; score: number }> = [];
  for (const place of empties) {
    for (let quad = 0; quad < 4; quad++) {
      for (const dir of ['cw', 'ccw'] as const) {
        const cells = state.cells.slice();
        cells[place] = me;
        const rotated = pgRotateQuad(cells, quad, dir);
        if (pgHasFive(rotated, me)) return { place, quad, dir };
        let score =
          pgPatternScore(rotated, me) +
          Math.random() * (tier === 'easy' ? 60 : tier === 'medium' ? 20 : 6);
        if (tier !== 'easy') {
          let oppBest = 0;
          for (let s = 0; s < state.seatCount; s++) {
            if (s === seat) continue;
            oppBest = Math.max(oppBest, pgPatternScore(rotated, s + 1));
          }
          score -= oppBest * (tier === 'hard' ? 0.9 : 0.6);
        }
        cands.push({ place, quad, dir, score });
      }
    }
  }
  if (!cands.length) return { place: empties[0], quad: 0, dir: 'cw' };
  cands.sort((a, b) => b.score - a.score);
  const top = cands.slice(0, tier === 'easy' ? Math.max(1, Math.ceil(cands.length / 5)) : 2);
  const pick = top[Math.floor(Math.random() * top.length)];
  return { place: pick.place, quad: pick.quad, dir: pick.dir };
}
