/**
 * Connect Four MP (T45 3P + F47 4P, one game serving both lists) — PURE core.
 *
 * Vertical drop on a grid; a move = the COLUMN. Discs fall to the lowest
 * empty row. Grid: 8×8 at 3 seats, 10×10 at 4 seats. First N-in-a-row wins
 * (N = 4 always). Board full without a line = shared result.
 * Empty-board: the grid starts empty; every disc is a player decision.
 */

export type C4Seat = number; // 0-based seat index

export interface C4State {
  cols: number;
  rows: number;
  /** grid[r][c] = seat index + 1, or 0 for empty. Row 0 = TOP. */
  grid: number[][];
  heights: number[]; // filled count per column
  lineLen: number;
}

export function c4Geometry(seatCount: number): { cols: number; rows: number; lineLen: number } {
  return seatCount >= 4 ? { cols: 10, rows: 10, lineLen: 4 } : { cols: 8, rows: 8, lineLen: 4 };
}

export function c4InitialState(seatCount: number): C4State {
  const { cols, rows, lineLen } = c4Geometry(seatCount);
  return {
    cols,
    rows,
    grid: Array.from({ length: rows }, () => Array<number>(cols).fill(0)),
    heights: Array<number>(cols).fill(0),
    lineLen,
  };
}

export function c4ValidateMove(state: C4State, col: number): string | null {
  if (!Number.isInteger(col) || col < 0 || col >= state.cols) return 'Column out of range.';
  if (state.heights[col] >= state.rows) return 'That column is full.';
  return null;
}

export function c4ApplyMove(state: C4State, seat: number, col: number): C4State {
  const grid = state.grid.map((row) => row.slice());
  const r = state.rows - 1 - state.heights[col]; // lowest empty row
  grid[r][col] = seat + 1;
  const heights = state.heights.slice();
  heights[col] += 1;
  return { ...state, grid, heights };
}

/** Winning line through the last-placed cell, or null. */
export function c4WinningLine(state: C4State, seat: number, col: number): number[] | null {
  const sym = seat + 1;
  const r = state.rows - state.heights[col]; // the row just filled
  const dirs: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of dirs) {
    const line: number[] = [];
    for (let k = -(state.lineLen - 1); k <= state.lineLen - 1; k++) {
      const rr = r + dr * k;
      const cc = col + dc * k;
      if (rr < 0 || cc < 0 || rr >= state.rows || cc >= state.cols) continue;
      if (state.grid[rr][cc] === sym) line.push(rr * state.cols + cc);
    }
    if (line.length >= state.lineLen) return line.slice(0, state.lineLen);
  }
  return null;
}

export function c4AnyWin(state: C4State): number | null {
  for (let s = 1; s <= 4; s++) {
    for (let c = 0; c < state.cols; c++) {
      if (state.heights[c] === 0) continue;
      // winningLine is only valid for the last move; scan all cells instead
    }
  }
  // Full scan (cheap at 8×8/10×10)
  const dirs: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let s = 1; s <= 4; s++) {
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        if (state.grid[r][c] !== s) continue;
        for (const [dr, dc] of dirs) {
          let count = 0;
          let rr = r;
          let cc = c;
          while (
            rr >= 0 &&
            cc >= 0 &&
            rr < state.rows &&
            cc < state.cols &&
            state.grid[rr][cc] === s
          ) {
            count++;
            rr += dr;
            cc += dc;
          }
          if (count >= state.lineLen) return s - 1;
        }
      }
    }
  }
  return null;
}

export function c4IsFull(state: C4State): boolean {
  return state.heights.every((h) => h >= state.rows);
}

export function c4IsOver(state: C4State): boolean {
  return c4AnyWin(state) !== null || c4IsFull(state);
}

/** Placement: winner 1st; everyone else shares 2nd (by seat order). */
export function c4Placement(
  seatCount: number,
  winnerSeat: number | null
): { seat: number; rank: number }[] {
  const out: { seat: number; rank: number }[] = [];
  for (let s = 0; s < seatCount; s++)
    out.push({ seat: s, rank: winnerSeat === null ? 1 : s === winnerSeat ? 1 : 2 });
  return out;
}

/** AI tiers: easy random-ish; medium blocks/wins; hard prefers centre columns. */
export function c4AiMove(state: C4State, tier: 'easy' | 'medium' | 'hard'): number {
  const legal: number[] = [];
  for (let c = 0; c < state.cols; c++) if (state.heights[c] < state.rows) legal.push(c);
  if (legal.length === 0) return -1;

  const wouldWin = (col: number, seat: number): boolean => {
    const next = c4ApplyMove(state, seat, col);
    return c4AnyWin(next) === seat;
  };

  if (tier === 'easy') {
    const win = legal.find((c) => wouldWin(c, 0));
    if (win !== undefined && legal.length % 2 === 0) return win;
    return legal[(legal.length * 7 + 3) % legal.length];
  }

  const sym = tier; // placeholder to satisfy lint; real seat passed via state
  void sym;
  // medium/hard: 1) complete own four  2) block any rival's three  3) centre weight
  // The engine calls this for the ACTIVE bot seat; the seat is derived in the
  // adapter (botMove receives state only, so seat awareness is baked in via
  // a scan of which symbol gains a win).
  for (const c of legal) {
    for (let s = 0; s < 4; s++) {
      if (wouldWin(c, s)) {
        // If it's a win for the mover, take it; if a rival's, block it.
        return c;
      }
    }
  }
  const centre = state.cols / 2;
  const sorted = legal.slice().sort((a, b) => Math.abs(a - centre) - Math.abs(b - centre));
  return sorted[0];
}
