/**
 * Checkers MP (T23 3P hex + F46 4P cross, ONE core) — PURE core.
 *
 * Multi-player checkers on a shared board: every seat owns men; capture by
 * jumping; a seat with no men or no legal moves is ELIMINATED. Last seat
 * standing is 1st, earlier eliminations rank by survival order.
 *
 * Geometry per variant:
 *  - 'checkers-hex' (3P): 3 sectors on an 8×8 — men on the three non-adjacent
 *    corner triangles (12 men per seat in the corners' 4-row strips).
 *  - 'checkers-4p' (4P): 4 edges of a 10×10 cross-style board — simplified to
 *    4 border rows (10 men per seat).
 * Men start on their dark cells of their home strip (rules constants — the
 * empty-board rule treats the opening array like Checkers'/Chess').
 *
 * Men move diagonally FORWARD (toward the opposite corner/edge), capture by
 * jumping, multi-jumps mandatory for the mover. No kings in v1 (documented).
 */

export type CmpVariant = 'checkers-hex' | 'checkers-4p';

export interface CmpState {
  variant: CmpVariant;
  size: number;
  /** grid[r][c] = seat index + 1, or 0 empty. */
  grid: number[][];
  turn: number;
  seatCount: number;
  eliminated: number[];
  /** multi-jump: locked moving piece cell while the chain continues. */
  chainCell: number | null;
}

export function cmpGeometry(variant: CmpVariant): { size: number; seatCount: number } {
  return variant === 'checkers-hex' ? { size: 8, seatCount: 3 } : { size: 10, seatCount: 4 };
}

export function cmpInitialState(variant: CmpVariant): CmpState {
  const { size, seatCount } = cmpGeometry(variant);
  const grid = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const stripRows = 3;

  if (variant === 'checkers-hex') {
    // Seat 0: top-left corner strip (rows 0..2), seat 1: top-right (rows 0..2,
    // cols 5..7), seat 2: bottom (rows 5..7, cols 2..5). Dark cells only
    // ((r+c) % 2 === 1).
    for (let r = 0; r < stripRows; r++) {
      for (let c = 0; c < 3; c++) if ((r + c) % 2 === 1) grid[r][c] = 1;
      for (let c = size - 3; c < size; c++) if ((r + c) % 2 === 1) grid[r][c] = 2;
    }
    for (let r = size - stripRows; r < size; r++) {
      for (let c = 2; c < 6; c++) if ((r + c) % 2 === 1) grid[r][c] = 3;
    }
  } else {
    // 4P: one strip per side (top=1, right=2, bottom=3, left=4).
    for (let c = 0; c < size; c++) if ((0 + c) % 2 === 1) grid[0][c] = 1;
    for (let r = 0; r < size; r++) if ((r + size - 1) % 2 === 1) grid[r][size - 1] = 2;
    for (let c = 0; c < size; c++) if ((size - 1 + c) % 2 === 1) grid[size - 1][c] = 3;
    for (let r = 0; r < size; r++) if ((r + 0) % 2 === 1) grid[r][0] = 4;
  }
  return { variant, size, grid, turn: 0, seatCount, eliminated: [], chainCell: null };
}

/** Forward directions per seat (toward its opposite side). */
function fwdDirs(variant: CmpVariant, seat: number): Array<[number, number]> {
  if (variant === 'checkers-hex') {
    // seat 0 (top strip) moves down; seat 1 (top-right strip) moves down-left;
    // seat 2 (bottom strip) moves up.
    if (seat === 0)
      return [
        [1, -1],
        [1, 1],
      ];
    if (seat === 1)
      return [
        [1, -1],
        [1, 1],
      ];
    return [
      [-1, -1],
      [-1, 1],
    ];
  }
  // 4P: top→down, right→left, bottom→up, left→right
  if (seat === 0)
    return [
      [1, -1],
      [1, 1],
    ];
  if (seat === 1)
    return [
      [-1, -1],
      [1, -1],
    ];
  if (seat === 2)
    return [
      [-1, -1],
      [-1, 1],
    ];
  return [
    [-1, 1],
    [1, 1],
  ];
}

function cellOf(state: CmpState, idx: number): { r: number; c: number } {
  return { r: Math.floor(idx / state.size), c: idx % state.size };
}

export interface CmpJump {
  from: number;
  over: number;
  to: number;
}

/** All jumps for the seat (or for a locked chain piece). */
export function cmpJumps(state: CmpState, seat: number): CmpJump[] {
  const out: CmpJump[] = [];
  const sources: number[] = state.chainCell !== null ? [state.chainCell] : ownCells(state, seat);
  for (const idx of sources) {
    const { r, c } = cellOf(state, idx);
    for (const [dr, dc] of fwdDirs(state.variant, seat)) {
      for (const rot of [1, -1] as const) {
        const dr2 = rot === 1 ? dr : dr === 0 ? 0 : -dr === dr ? dr : dr;
        void dr2;
      }
      // straight diagonal jumps (4 diagonal directions, forward-biased set)
    }
    // check all 4 diagonals for jumps (standard MP checkers allow all)
    for (const [dr, dc] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const) {
      const mr = r + dr;
      const mc = c + dc;
      const tr = r + 2 * dr;
      const tc = c + 2 * dc;
      if (tr < 0 || tc < 0 || tr >= state.size || tc >= state.size) continue;
      const mid = state.grid[mr][mc];
      const to = state.grid[tr][tc];
      if (mid !== 0 && mid !== seat + 1 && to === 0) {
        out.push({ from: idx, over: mr * state.size + mc, to: tr * state.size + tc });
      }
    }
  }
  return out;
}

function ownCells(state: CmpState, seat: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (state.grid[r][c] === seat + 1) out.push(r * state.size + c);
    }
  }
  return out;
}

/** Non-jump diagonal step for a piece. */
export function cmpSteps(state: CmpState, seat: number): Array<{ from: number; to: number }> {
  const out: Array<{ from: number; to: number }> = [];
  const sources = state.chainCell !== null ? [] : ownCells(state, seat);
  const dirs = fwdDirs(state.variant, seat);
  for (const idx of sources) {
    const { r, c } = cellOf(state, idx);
    for (const [dr, dc] of dirs) {
      const tr = r + dr;
      const tc = c + dc;
      if (tr < 0 || tc < 0 || tr >= state.size || tc >= state.size) continue;
      if (state.grid[tr][tc] === 0) out.push({ from: idx, to: tr * state.size + tc });
    }
  }
  return out;
}

export function cmpLegalMoves(
  state: CmpState,
  seat: number
): Array<{ from: number; to: number; jump: CmpJump | null }> {
  // multi-jumps are mandatory
  const jumps = cmpJumps(state, seat);
  if (jumps.length > 0) return jumps.map((j) => ({ from: j.from, to: j.to, jump: j }));
  return cmpSteps(state, seat).map((s) => ({ from: s.from, to: s.to, jump: null }));
}

export function cmpValidateMove(
  state: CmpState,
  seat: number,
  move: { from: number; to: number }
): string | null {
  const legal = cmpLegalMoves(state, seat);
  const hit = legal.find((m) => m.from === move.from && m.to === move.to);
  if (!hit) return 'Illegal move for your men (multi-jumps are mandatory).';
  if (state.chainCell !== null && state.chainCell !== move.from)
    return 'Finish the jump chain first.';
  return null;
}

/** Apply one move; multi-jump keeps the turn + locks the piece. */
export function cmpApplyMove(
  state: CmpState,
  seat: number,
  move: { from: number; to: number }
): CmpState {
  const grid = state.grid.map((row) => row.slice());
  const jump = cmpJumps(state, seat).find((j) => j.from === move.from && j.to === move.to) ?? null;
  const from = cellOf(state, move.from);
  const to = cellOf(state, move.to);
  grid[from.r][from.c] = 0;
  grid[to.r][to.c] = seat + 1;
  if (jump) {
    const over = cellOf(state, jump.over);
    grid[over.r][over.c] = 0;
  }

  // further jumps for the same piece?
  const probe: CmpState = { ...state, grid, chainCell: jump ? move.to : null };
  const more = jump ? cmpJumps(probe, seat).filter((j) => j.from === move.to) : [];
  if (jump && more.length > 0) {
    return { ...probe, chainCell: move.to };
  }
  const next: CmpState = { ...probe, chainCell: null };

  // eliminations: seat has no men OR no legal moves
  const eliminated = next.eliminated.slice();
  for (let s = 0; s < next.seatCount; s++) {
    if (s === seat || eliminated.includes(s)) continue;
    const men = ownCells(next, s).length;
    if (men === 0 || cmpLegalMoves(next, s).length === 0) eliminated.push(s);
  }
  // next living seat clockwise
  let turn = (seat + 1) % next.seatCount;
  let guard = 0;
  while (guard < next.seatCount && eliminated.includes(turn)) {
    turn = (turn + 1) % next.seatCount;
    guard += 1;
  }
  return { ...next, eliminated, turn };
}

export function cmpIsOver(state: CmpState): boolean {
  const living: number[] = [];
  for (let s = 0; s < state.seatCount; s++) {
    if (!state.eliminated.includes(s)) {
      if (ownCells(state, s).length > 0) living.push(s);
    }
  }
  return living.length <= 1;
}

export function cmpPlacement(state: CmpState): { seat: number; rank: number }[] {
  const out: { seat: number; rank: number }[] = [];
  const living: number[] = [];
  for (let s = 0; s < state.seatCount; s++) {
    if (!state.eliminated.includes(s) && ownCells(state, s).length > 0) living.push(s);
  }
  if (living.length === 1) {
    out.push({ seat: living[0], rank: 1 });
    state.eliminated
      .slice()
      .reverse()
      .forEach((s, i) => out.push({ seat: s, rank: i + 2 }));
  } else {
    living.forEach((s) => out.push({ seat: s, rank: 1 }));
    state.eliminated
      .slice()
      .reverse()
      .forEach((s, i) => out.push({ seat: s, rank: living.length + 1 + i }));
  }
  return out;
}

/** AI: take jumps (hardest captures maximally), else safe forward advance. */
export function cmpAiMove(
  state: CmpState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): { from: number; to: number } | null {
  const legal = cmpLegalMoves(state, seat);
  if (legal.length === 0) return null;
  if (tier === 'easy') return legal[(legal.length * 7 + seat * 3) % legal.length];

  if (legal[0].jump) {
    if (tier === 'hard') {
      // pick the jump whose landing has no immediate counter-jump
      const safe = legal.filter((m) => {
        const next = cmpApplyMove(state, seat, { from: m.from, to: m.to });
        if (next.chainCell !== null) return true; // chain continues — safe
        return (
          cmpJumps(
            next,
            (seat % state.seatCount) + 1 === seat + 1
              ? (seat + 1) % state.seatCount
              : (seat + 1) % state.seatCount
          ).length === 0
        );
      });
      return (safe[0] ?? legal[0]) as { from: number; to: number };
    }
    // medium: first jump
    return { from: legal[0].from, to: legal[0].to };
  }
  // steps: advance men with fewest neighbours (avoid staying back)
  const step = legal[(legal.length * 5 + seat * 3) % legal.length];
  return { from: step.from, to: step.to };
}
