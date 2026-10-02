/**
 * Breakthrough MP (T24 3P + F25 4P, ONE core) — PURE core, backend-owned.
 *
 * Corner armies race through each other: each pawn steps one square in any
 * direction toward its goal block (diagonal or straight), landing on an
 * enemy captures it. First pawn (of any player) to enter its goal block
 * wins. Three corners use three armies, four corners use four.
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const BT_N = 8;

/** Home blocks (2 rows x 4 cols): [r0, r1, c0, c1]. */
const BT_HOMES: Record<number, number[][]> = {
  3: [
    [6, 7, 0, 3], // seat 0: bottom-left
    [0, 1, 4, 7], // seat 1: top-right
    [6, 7, 4, 7], // seat 2: bottom-right
  ],
  4: [
    [6, 7, 0, 3],
    [0, 1, 4, 7],
    [6, 7, 4, 7],
    [0, 1, 0, 3], // seat 3: top-left
  ],
};

/** Goal for each seat = the opposite block. */
const BT_GOALS: Record<number, number[][]> = {
  3: [
    [0, 1, 4, 7], // 0 -> top-right
    [6, 7, 0, 3], // 1 -> bottom-left
    [0, 1, 0, 3], // 2 -> top-left
  ],
  4: [
    [0, 1, 4, 7],
    [6, 7, 0, 3],
    [0, 1, 0, 3],
    [6, 7, 4, 7],
  ],
};

/** Forward step vectors per seat (toward their goal corner). */
const BT_FWD: Record<number, number[][][]> = {
  3: [
    [
      [-1, 0],
      [-1, 1],
      [0, 1],
    ], // bottom-left -> top-right: up, up-right, right
    [
      [1, 0],
      [1, -1],
      [0, -1],
    ], // top-right -> bottom-left
    [
      [-1, 0],
      [-1, -1],
      [0, -1],
    ], // bottom-right -> top-left
  ],
  4: [
    [
      [-1, 0],
      [-1, 1],
      [0, 1],
    ],
    [
      [1, 0],
      [1, -1],
      [0, -1],
    ],
    [
      [-1, 0],
      [-1, -1],
      [0, -1],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 1],
    ], // top-left -> bottom-right
  ],
};

export interface BtState {
  /** 0 empty, else seat + 1. */
  cells: number[];
  turn: number;
  seatCount: number;
  lastMove: { seat: number; from: number; to: number } | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface BtPlacement {
  seat: number;
  rank: number;
}

function btHome(seatCount: number, seat: number): number[] {
  const row = (seatCount >= 4 ? BT_HOMES[4] : BT_HOMES[3])[seat] ?? BT_HOMES[4][3];
  return row;
}
function btGoal(seatCount: number, seat: number): number[] {
  const row = (seatCount >= 4 ? BT_GOALS[4] : BT_GOALS[3])[seat] ?? BT_GOALS[4][3];
  return row;
}
function btFwd(seatCount: number, seat: number): number[][] {
  const row = (seatCount >= 4 ? BT_FWD[4] : BT_FWD[3])[seat] ?? BT_FWD[4][3];
  return row;
}

export function btInitialState(seatCount: number): BtState {
  const cells = new Array(BT_N * BT_N).fill(0) as number[];
  for (let s = 0; s < seatCount; s++) {
    const [r0, r1, c0, c1] = btHome(seatCount, s);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        cells[r * BT_N + c] = s + 1;
      }
    }
  }
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

export function btInGoal(seatCount: number, seat: number, idx: number): boolean {
  const [r0, r1, c0, c1] = btGoal(seatCount, seat);
  const r = Math.floor(idx / BT_N);
  const c = idx % BT_N;
  return r >= r0 && r <= r1 && c >= c0 && c <= c1;
}

export function btMovesFrom(state: BtState, seat: number, from: number): number[] {
  const me = seat + 1;
  if (state.cells[from] !== me) return [];
  const r = Math.floor(from / BT_N);
  const c = from % BT_N;
  const out: number[] = [];
  for (const [dr, dc] of btFwd(state.seatCount, seat)) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= BT_N || nc < 0 || nc >= BT_N) continue;
    const to = nr * BT_N + nc;
    const v = state.cells[to];
    if (v === me) continue; // no own stacking
    out.push(to);
  }
  return out;
}

export function btValidateMove(state: BtState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { from?: unknown; to?: unknown } | null;
  if (!m || !Number.isInteger(m.from) || !Number.isInteger(m.to)) return 'Send { from, to }.';
  const from = m.from as number;
  const to = m.to as number;
  if (from < 0 || from >= BT_N * BT_N || to < 0 || to >= BT_N * BT_N)
    return 'That square is off the board.';
  if (state.cells[from] !== seat + 1) return 'Pick one of your own pawns.';
  if (!btMovesFrom(state, seat, from).includes(to)) return 'Your pawn cannot go there.';
  return null;
}

export function btApplyMove(state: BtState, seat: number, move: unknown): BtState {
  const m = move as { from: number; to: number };
  const cells = state.cells.slice();
  cells[m.to] = seat + 1; // capture replaces the occupant, if any
  cells[m.from] = 0;
  const next: BtState = {
    ...state,
    cells,
    lastMove: { seat, from: m.from, to: m.to },
    moveCount: state.moveCount + 1,
    turn: (seat + 1) % state.seatCount,
  };
  if (btInGoal(state.seatCount, seat, m.to)) {
    next.phase = 'finished';
    next.winnerSeat = seat;
  }
  // a wiped-out army cannot move � skip it like an eliminated seat
  let nxt = (seat + 1) % state.seatCount;
  let guard = 0;
  while (guard < state.seatCount && !cells.some((v) => v === nxt + 1)) {
    nxt = (nxt + 1) % state.seatCount;
    guard += 1;
  }
  next.turn = nxt;
  return next;
}

export function btIsOver(state: BtState): boolean {
  return state.phase === 'finished';
}

export function btWinner(state: BtState): number | null {
  return state.winnerSeat;
}

function btDistToGoal(seatCount: number, seat: number, idx: number): number {
  const [r0, r1, c0, c1] = btGoal(seatCount, seat);
  const r = Math.floor(idx / BT_N);
  const c = idx % BT_N;
  const dr = r < r0 ? r0 - r : r > r1 ? r - r1 : 0;
  const dc = c < c0 ? c0 - c : c > c1 ? c - c1 : 0;
  return dr + dc;
}

export function btPlacement(state: BtState): BtPlacement[] {
  const progress = Array.from({ length: state.seatCount }, (_, seat) => {
    let best = Infinity;
    for (let idx = 0; idx < state.cells.length; idx++) {
      if (state.cells[idx] === seat + 1) {
        best = Math.min(best, btDistToGoal(state.seatCount, seat, idx));
      }
    }
    return { seat, dist: best === Infinity ? 999 : best };
  });
  const win = state.winnerSeat;
  progress.sort((x, y) => {
    if (win !== null) {
      if (x.seat === win) return -1;
      if (y.seat === win) return 1;
    }
    return x.dist - y.dist || x.seat - y.seat;
  });
  return progress.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

export function btBotMove(state: BtState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const me = seat + 1;
  const cands: Array<{ from: number; to: number; score: number }> = [];
  for (let from = 0; from < state.cells.length; from++) {
    if (state.cells[from] !== me) continue;
    for (const to of btMovesFrom(state, seat, from)) {
      if (btInGoal(state.seatCount, seat, to)) return { from, to }; // instant win
      const capture = state.cells[to] !== 0 && state.cells[to] !== me;
      const adv =
        btDistToGoal(state.seatCount, seat, from) - btDistToGoal(state.seatCount, seat, to);
      let score =
        adv * 25 +
        (capture ? 120 : 0) +
        Math.random() * (tier === 'easy' ? 300 : tier === 'medium' ? 60 : 15);
      if (tier !== 'easy' && capture) {
        // prefer big eliminations: capturing that seat's last pawn ends them
        let victimCount = 0;
        for (let idx = 0; idx < state.cells.length; idx++)
          if (state.cells[idx] === state.cells[to]) victimCount++;
        if (victimCount === 1) score += 500;
      }
      if (tier === 'hard') {
        // don't stroll next to a bigger enemy that can take us back
        const tr = Math.floor(to / BT_N);
        const tc = to % BT_N;
        for (let s2 = 0; s2 < state.seatCount; s2++) {
          if (s2 === seat) continue;
          for (const [dr, dc] of btFwd(state.seatCount, s2)) {
            const sr = tr - dr; // an enemy at (sr,sc) moving [dr,dc] lands on `to`
            const sc = tc - dc;
            if (sr < 0 || sr >= BT_N || sc < 0 || sc >= BT_N) continue;
            if (state.cells[sr * BT_N + sc] === s2 + 1) score -= 60;
          }
        }
      }
      cands.push({ from, to, score });
    }
  }
  if (!cands.length) return { from: 0, to: 0 }; // defensive; must-move means this never fires
  cands.sort((a, b) => b.score - a.score);
  const top = cands.slice(0, tier === 'easy' ? Math.max(1, Math.ceil(cands.length / 3)) : 3);
  const pick = top[Math.floor(Math.random() * top.length)];
  return { from: pick.from, to: pick.to };
}
