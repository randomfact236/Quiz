/**
 * Tri-Nim (T2, TP1 Wave A) — PURE core, backend-owned.
 *
 * 3-player misère nim: rows of 3-4-5 sticks; take 1-3 from ONE row per turn;
 * the taker of the LAST stick is 3rd (worst), the seat that moved IMMEDIATELY
 * BEFORE the taker is 1st, the remaining seat is 2nd. Alliances form and
 * shatter by themselves. No RNG, nothing pre-filled (row counts are rules
 * constants, like Mancala's seeds).
 */

export const TRI_SEATS = 3;
export const TRI_ROWS: readonly number[] = [3, 4, 5];

export interface TriState {
  rows: number[];
  turn: number;
  /** The mover before lastMover — becomes rank 1 when the game ends. */
  prevMover: number | null;
  lastMover: number | null;
}

export function triInitialState(): TriState {
  return { rows: [...TRI_ROWS], turn: 0, prevMover: null, lastMover: null };
}

export function triValidateMove(
  state: TriState,
  move: { row: number; count: number }
): string | null {
  const { row, count } = move;
  if (!Number.isInteger(row) || row < 0 || row >= state.rows.length) return 'Row out of range.';
  if (!Number.isInteger(count) || count < 1 || count > 3) return 'Take 1 to 3 sticks.';
  if (count > state.rows[row]) return 'Not enough sticks in that row.';
  return null;
}

export function triApplyMove(
  state: TriState,
  seat: number,
  move: { row: number; count: number }
): TriState {
  const rows = state.rows.slice();
  rows[move.row] -= move.count;
  return {
    rows,
    turn: (seat + 1) % TRI_SEATS,
    prevMover: state.lastMover,
    lastMover: seat,
  };
}

export function triIsOver(state: TriState): boolean {
  return state.rows.every((r) => r === 0);
}

/** Rank 1 goes to the seat that moved right before the last taker. */
export function triWinner(state: TriState): number | null {
  if (!triIsOver(state)) return null;
  return state.prevMover;
}

/** Placement: prevMover 1st · remaining seat 2nd · last-taker 3rd. */
export function triPlacement(state: TriState): { seat: number; rank: number }[] {
  const last = state.lastMover;
  const first = state.prevMover;
  const second = [0, 1, 2].find((s) => s !== last && s !== first);
  return [
    { seat: first ?? -1, rank: 1 },
    { seat: second ?? -1, rank: 2 },
    { seat: last ?? -1, rank: 3 },
  ].filter((p) => p.seat >= 0);
}

/** AI: easy random; medium/hard avoid taking the last stick when they can. */
export function triAiMove(
  state: TriState,
  tier: 'easy' | 'medium' | 'hard'
): { row: number; count: number } {
  const legal: { row: number; count: number }[] = [];
  state.rows.forEach((n, row) => {
    for (let count = 1; count <= Math.min(3, n); count++) legal.push({ row, count });
  });
  if (legal.length === 0) return { row: 0, count: 0 };

  const total = state.rows.reduce((a, b) => a + b, 0);
  // Key trick: never take the final stick unless forced; hand the next seat
  // a position where taking the last stick becomes their best/only option.
  const leavesOne = legal.filter((m) => total - m.count === 1);
  if (tier === 'easy') {
    // Sometimes grabs the trick, often blunders.
    if (leavesOne.length > 0 && (total + legal.length) % 3 === 0) {
      return leavesOne[(legal.length * 5) % leavesOne.length];
    }
    return legal[(total * 7 + legal.length) % legal.length];
  }
  if (leavesOne.length > 0) return leavesOne[(legal.length + total) % leavesOne.length];
  // Medium/hard: take from the biggest row to stretch the endgame.
  const big = legal.filter((m) => m.row === state.rows.indexOf(Math.max(...state.rows)));
  const pool = big.length > 0 && tier === 'hard' ? big : legal;
  return pool[(total * 3 + pool.length) % pool.length];
}
