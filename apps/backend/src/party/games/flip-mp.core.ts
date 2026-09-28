/**
 * Flip MP (T18 Othello-3 + F15 QuadFlip, ONE core serving both) — PURE core.
 *
 * Multi-colour flipping: place a stone that flanks ≥1 straight line of enemy
 * stones between the new stone and another own stone (8 directions); all
 * flanked stones convert to the mover's colour. Geometry: 10×10 at 3 seats,
 * 14×14 at 4 seats. Opening: each seat owns a 2×2 cluster (rules constant,
 * the MP analogue of Othello's centre start — every stone AFTER that is a
 * player decision). Stuck seats auto-pass; when every active seat passes in
 * a row the game ends. Majority of stones wins; ties share rank.
 */

export type FlipSeat = number; // 0-based

export interface FlipState {
  size: number;
  seatCount: number;
  /** grid[r][c] = seat index + 1, or 0 for empty. */
  grid: number[][];
  scores: number[];
  /** Consecutive seats (in rotation) that had to pass. */
  passStreak: number;
}

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [-1, 1],
];

export function flipGeometry(seatCount: number): { size: number } {
  return seatCount >= 4 ? { size: 14 } : { size: 10 };
}

/** Opening clusters: 2×2 per seat, arranged so every seat has legal moves. */
function openingGrid(seatCount: number, size: number): number[][] {
  const grid = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const mid = Math.floor(size / 2);
  // Two interleaved centred rows: every seat flanks a rival on the opening,
  // so nobody is stuck at move one (the MP analogue of Othello’s centre start).
  if (seatCount === 3) {
    const rA = mid - 1;
    const rB = mid;
    const rowA = [1, 2, 3, 1, 2, 3];
    const rowB = [3, 2, 1, 3, 2, 1];
    rowA.forEach((v, i) => {
      grid[rA][mid - 3 + i] = v;
      grid[rB][mid - 3 + i] = rowB[i];
    });
  } else {
    const rA = mid - 1;
    const rB = mid;
    const rowA = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
    const rowB = [4, 3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1];
    rowA.forEach((v, i) => {
      grid[rA][mid - 6 + i] = v;
      grid[rB][mid - 6 + i] = rowB[i];
    });
  }
  return grid;
}
export function flipInitialState(seatCount: number): FlipState {
  const { size } = flipGeometry(seatCount);
  const grid = openingGrid(seatCount, size);
  const scores = Array<number>(seatCount).fill(0);
  for (const row of grid) for (const v of row) if (v > 0) scores[v - 1] += 1;
  return { size, seatCount, grid, scores, passStreak: 0 };
}

function flipLinesFor(
  state: FlipState,
  seat: number,
  r: number,
  c: number
): Array<Array<[number, number]>> {
  const sym = seat + 1;
  const out: Array<Array<[number, number]>> = [];
  for (const [dr, dc] of DIRS) {
    const line: Array<[number, number]> = [];
    let rr = r + dr;
    let cc = c + dc;
    while (
      rr >= 0 &&
      cc >= 0 &&
      rr < state.size &&
      cc < state.size &&
      state.grid[rr][cc] !== 0 &&
      state.grid[rr][cc] !== sym
    ) {
      line.push([rr, cc]);
      rr += dr;
      cc += dc;
    }
    if (
      line.length > 0 &&
      rr >= 0 &&
      cc >= 0 &&
      rr < state.size &&
      cc < state.size &&
      state.grid[rr][cc] === sym
    ) {
      out.push(line);
    }
  }
  return out;
}

export function flipLegalMoves(state: FlipState, seat: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (state.grid[r][c] !== 0) continue;
      if (flipLinesFor(state, seat, r, c).length > 0) out.push(r * state.size + c);
    }
  }
  return out;
}

export function flipValidateMove(state: FlipState, seat: number, cell: number): string | null {
  if (!Number.isInteger(cell) || cell < 0 || cell >= state.size * state.size)
    return 'Cell out of range.';
  if (state.grid[Math.floor(cell / state.size)][cell % state.size] !== 0)
    return 'That cell is taken.';
  const r = Math.floor(cell / state.size);
  const c = cell % state.size;
  if (flipLinesFor(state, seat, r, c).length === 0)
    return 'That move flips nothing — pick a flanking cell.';
  return null;
}

/** Apply + auto-pass stuck seats. Sets state.turn and state.passStreak. */
export function flipApplyMove(state: FlipState, seat: number, cell: number): FlipState {
  const grid = state.grid.map((row) => row.slice());
  const scores = state.scores.slice();
  const r = Math.floor(cell / state.size);
  const c = cell % state.size;
  const lines = flipLinesFor(state, seat, r, c);
  grid[r][c] = seat + 1;
  scores[seat] += 1;
  for (const line of lines) {
    for (const [lr, lc] of line) {
      const victim = grid[lr][lc] - 1;
      scores[victim] -= 1;
      grid[lr][lc] = seat + 1;
      scores[seat] += 1;
    }
  }
  // Pass-chain tracking: how many ACTIVE seats in a row cannot move after
  // this placement (the adapter converts this into turn order + game end).
  let skip = 0;
  let probe = (seat + 1) % state.seatCount;
  while (skip < state.seatCount && flipLegalMoves({ ...state, grid, scores }, probe).length === 0) {
    skip += 1;
    probe = (probe + 1) % state.seatCount;
  }
  const full = grid.every((row) => row.every((v) => v !== 0));
  return {
    size: state.size,
    seatCount: state.seatCount,
    grid,
    scores,
    passStreak: full ? state.seatCount : skip,
  };
}

export function flipIsOver(state: FlipState): boolean {
  return state.passStreak >= state.seatCount;
}

/** Placement: most stones 1st; ties share rank. */
export function flipPlacement(scores: number[]): { seat: number; rank: number }[] {
  const order = scores.map((s, seat) => ({ seat, s })).sort((a, b) => b.s - a.s || a.seat - b.seat);
  const ranks: number[] = [];
  let lastScore = NaN;
  let lastRank = 0;
  order.forEach((row, i) => {
    if (row.s === lastScore) ranks[row.seat] = lastRank;
    else {
      ranks[row.seat] = i + 1;
      lastRank = i + 1;
      lastScore = row.s;
    }
  });
  return order.map((row) => ({ seat: row.seat, rank: ranks[row.seat] }));
}

/** AI: maximize immediate flips; hard weights corners/edges; easy random-ish. */
export function flipAiMove(
  state: FlipState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): number {
  const legal = flipLegalMoves(state, seat);
  if (legal.length === 0) return -1;
  if (tier === 'easy') return legal[(legal.length * 7 + seat) % legal.length];
  const size = state.size;
  let best = legal[0];
  let bestScore = -1;
  for (const cell of legal) {
    const r = Math.floor(cell / size);
    const c = cell % size;
    const lines = flipLinesFor(state, seat, r, c);
    let score = 0;
    for (const line of lines) score += line.length;
    if (tier === 'hard') {
      if ((r === 0 || r === size - 1) && (c === 0 || c === size - 1)) score += 25;
      else if (r === 0 || r === size - 1 || c === 0 || c === size - 1) score += 8;
      else if (r === 1 || r === size - 2 || c === 1 || c === size - 2) score -= 3;
    }
    if (score > bestScore) {
      bestScore = score;
      best = cell;
    }
  }
  return best;
}
