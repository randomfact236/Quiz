/**
 * Notakto MP (T14 3P + F4 4P, ONE core) — PURE core, backend-owned.
 *
 * The misère tic-tac-toe nobody can draw: THREE boards, every player places
 * the same X. Completing THREE-in-a-row on any board ELIMINATES you. Last
 * player standing is 1st; earlier eliminations rank by reverse order (the
 * longer you survived, the better).
 *
 * House rule (MP adaptation, documented in plan/games): if all 27 cells fill
 * with nobody eliminated-by-line possible, the game ends and all surviving
 * players share rank 1 (the board ran out — nobody was forced out). This
 * avoids the 2-player parity endgame failing at N players.
 *
 * Empty-board: all 27 cells start empty; every X is a player decision.
 */

export const NK_BOARDS = 3;
export const NK_CELLS = NK_BOARDS * 9;

export const NK_LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export interface NkState {
  /** 27 cells: null | 'X'. */
  cells: (string | null)[];
  seats: number;
  /** Eliminated seat indexes in order (first eliminated first). */
  eliminated: number[];
  turn: number;
}

export function nkInitialState(seatCount: number): NkState {
  return {
    cells: Array<string | null>(NK_CELLS).fill(null),
    seats: seatCount,
    eliminated: [],
    turn: 0,
  };
}

export function nkLiving(state: NkState): number[] {
  const out: number[] = [];
  for (let s = 0; s < state.seats; s++) {
    if (!state.eliminated.includes(s)) out.push(s);
  }
  return out;
}

export function nkValidateMove(state: NkState, cell: number): string | null {
  if (!Number.isInteger(cell) || cell < 0 || cell >= NK_CELLS) return 'Cell out of range.';
  if (state.cells[cell] !== null) return 'That cell is taken.';
  return null;
}

function boardHasLine(cells: (string | null)[], board: number): boolean {
  const base = board * 9;
  return NK_LINES.some((line) => line.every((i) => cells[base + i] !== null));
}

function allFull(cells: (string | null)[]): boolean {
  return cells.every((c) => c !== null);
}

/** Apply a placement; handles elimination + turn skipping dead seats. */
export function nkApplyMove(state: NkState, seat: number, cell: number): NkState {
  const cells = state.cells.slice();
  cells[cell] = 'X';
  const board = Math.floor(cell / 9);
  const lostByLine = boardHasLine(cells, board);
  const filled = allFull(cells);
  const eliminated = lostByLine || filled ? [...state.eliminated, seat] : state.eliminated;

  // Next living seat clockwise (skip eliminated).
  let next = (seat + 1) % state.seats;
  let guard = 0;
  while (guard < state.seats && eliminated.includes(next)) {
    next = (next + 1) % state.seats;
    guard += 1;
  }
  return { cells, seats: state.seats, eliminated, turn: next };
}

export function nkIsOver(state: NkState): boolean {
  return nkLiving(state).length <= 1 || allFull(state.cells);
}

/**
 * Placement:
 *  - survivor end: last standing rank 1, then eliminated in REVERSE order.
 *  - board-full end: all living share rank 1; eliminated follow in reverse.
 */
export function nkPlacement(state: NkState): { seat: number; rank: number }[] {
  const living = nkLiving(state);
  const out: { seat: number; rank: number }[] = [];
  if (living.length === 1) {
    out.push({ seat: living[0], rank: 1 });
    const rest = state.eliminated.slice().reverse();
    rest.forEach((s, i) => out.push({ seat: s, rank: i + 2 }));
  } else {
    living.forEach((s) => out.push({ seat: s, rank: 1 }));
    const rest = state.eliminated.slice().reverse();
    rest.forEach((s, i) => out.push({ seat: s, rank: living.length + 1 + i }));
  }
  return out;
}

/** AI: never self-eliminate if avoidable; easy blunders a third of the time. */
export function nkAiMove(state: NkState, seat: number, tier: 'easy' | 'medium' | 'hard'): number {
  const legal: number[] = [];
  for (let i = 0; i < NK_CELLS; i++) if (state.cells[i] === null) legal.push(i);
  if (legal.length === 0) return -1;

  const loses = (cell: number): boolean => {
    const after = state.cells.slice();
    after[cell] = 'X';
    return boardHasLine(after, Math.floor(cell / 9));
  };

  if (tier === 'easy' && legal.length % 3 === 0) {
    return legal[(legal.length * 7 + seat * 5) % legal.length];
  }
  const safe = legal.filter((c) => !loses(c));
  if (safe.length === 0) return legal[0]; // every move loses — take one
  if (tier === 'hard') {
    // Prefer moves that leave the fewest "two-in-line with an empty third"
    // threats for the next seat (deny easy traps).
    let best = safe[0];
    let bestScore = Infinity;
    for (const c of safe) {
      const after = state.cells.slice();
      after[c] = 'X';
      let threats = 0;
      for (let b = 0; b < NK_BOARDS; b++) {
        for (const line of NK_LINES) {
          const vals = line.map((i) => after[b * 9 + i]);
          const xs = vals.filter((v) => v === 'X').length;
          const empties = vals.filter((v) => v === null).length;
          if (xs === 2 && empties === 1) threats += 1;
        }
      }
      if (threats < bestScore) {
        bestScore = threats;
        best = c;
      }
    }
    return best;
  }
  return safe[(safe.length * 5 + seat * 3) % safe.length];
}
