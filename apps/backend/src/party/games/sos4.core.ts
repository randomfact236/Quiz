/**
 * SOS 4P (F3, MP1 Wave A) — PURE core, backend-owned.
 *
 * General-mode SOS on 7×7 (5×5 for 3 seats): place one S or O per turn; any
 * SOS you COMPLETE (either direction, your letters or a rival's) scores +1
 * and grants ANOTHER turn. No letters pre-filled — the paper classic, empty.
 */

export const SOS4_GRID = 7;

export interface Sos4State {
  /** 'S' | 'O' | null per cell. */
  cells: (string | null)[];
  scores: number[];
  grid: number;
}

export function sos4InitialState(seatCount: number): Sos4State {
  const grid = seatCount >= 4 ? 7 : 5;
  return {
    cells: Array<string | null>(grid * grid).fill(null),
    scores: Array<number>(seatCount).fill(0),
    grid,
  };
}

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

/** SOS patterns completed by the letter just placed at (r,c). */
export function sos4CompletedAt(state: Sos4State, r: number, c: number): number {
  const g = state.grid;
  const at = (rr: number, cc: number): string | null =>
    rr < 0 || cc < 0 || rr >= g || cc >= g ? null : state.cells[rr * g + cc];
  const letter = state.cells[r * g + c];
  let count = 0;
  for (const [dr, dc] of DIRS) {
    // pattern 1: letter is the final S (…S-O-S)
    if (letter === 'S' && at(r - dr, c - dc) === 'O' && at(r - 2 * dr, c - 2 * dc) === 'S') count++;
    // pattern 2: letter is the middle O (S-O-S)
    if (letter === 'O' && at(r - dr, c - dc) === 'S' && at(r + dr, c + dc) === 'S') count++;
    // pattern 3: letter is the leading S (S-O-…)
    if (letter === 'S' && at(r + dr, c + dc) === 'O' && at(r + 2 * dr, c + 2 * dc) === 'S') count++;
  }
  return count;
}

export function sos4ValidateMove(
  state: Sos4State,
  move: { cell: number; letter: string }
): string | null {
  const { cell, letter } = move;
  if (!Number.isInteger(cell) || cell < 0 || cell >= state.cells.length)
    return 'Cell out of range.';
  if (state.cells[cell] !== null) return 'That cell is taken.';
  if (letter !== 'S' && letter !== 'O') return "Letter must be 'S' or 'O'.";
  return null;
}

export function sos4ApplyMove(
  state: Sos4State,
  seat: number,
  move: { cell: number; letter: string },
  activeSeats: number[]
): { state: Sos4State; scored: number; nextTurn: number } {
  const cells = state.cells.slice();
  const scores = state.scores.slice();
  const { cell, letter } = move;
  cells[cell] = letter;
  const g = state.grid;
  const scored = sos4CompletedAt({ ...state, cells }, Math.floor(cell / g), cell % g);
  scores[seat] += scored;

  const nextTurn =
    scored > 0 ? seat : activeSeats[(activeSeats.indexOf(seat) + 1) % activeSeats.length];
  return { state: { cells, scores, grid: state.grid }, scored, nextTurn };
}

export function sos4IsOver(state: Sos4State): boolean {
  return state.cells.every((c) => c !== null);
}

/** Placement: most points 1st; ties share rank. */
export function sos4Placement(scores: number[]): { seat: number; rank: number }[] {
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

/** AI: complete own SOS → block/avoid gifting → prefer S near O's (threats). */
export function sos4AiMove(
  state: Sos4State,
  tier: 'easy' | 'medium' | 'hard'
): { cell: number; letter: string } {
  const free: number[] = [];
  for (let i = 0; i < state.cells.length; i++) if (state.cells[i] === null) free.push(i);
  if (free.length === 0) return { cell: -1, letter: 'S' };

  const tryLetter = (cell: number, letter: string): number => {
    const cells = state.cells.slice();
    cells[cell] = letter;
    const g = state.grid;
    return sos4CompletedAt({ ...state, cells }, Math.floor(cell / g), cell % g);
  };

  if (tier === 'easy') {
    const cell = free[(free.length * 11 + 3) % free.length];
    return { cell, letter: free.length % 2 === 0 ? 'S' : 'O' };
  }

  // 1) Take any scoring placement (prefer multi-SOS cells).
  let best: { cell: number; letter: string; score: number } | null = null;
  for (const cell of free) {
    for (const letter of ['S', 'O'] as const) {
      const s = tryLetter(cell, letter);
      if (s > 0 && (!best || s > best.score)) best = { cell, letter, score: s };
    }
  }
  if (best) return { cell: best.cell, letter: best.letter };

  // 2) Otherwise: place where the OPPONENT could not complete an SOS next
  //    turn (hard), or just avoid adjacent-to-O S's (medium).
  const risky = (cell: number, letter: string): boolean => {
    const cells = state.cells.slice();
    cells[cell] = letter;
    const g = state.grid;
    const st = { ...state, cells };
    // Would this letter let some existing line complete with one more letter?
    return sos4CompletedAt(st, Math.floor(cell / g), cell % g) > 0;
  };

  if (tier === 'hard') {
    // Prefer cells that block a potential enemy SOS: a cell where either
    // letter CREATES a two-thirds pattern the enemy could finish.
    const blockish = free.filter((cell) => {
      const g = state.grid;
      const r = Math.floor(cell / g);
      const c = cell % g;
      let potential = 0;
      for (const [dr, dc] of DIRS) {
        const at = (rr: number, cc: number): string | null =>
          rr < 0 || cc < 0 || rr >= g || cc >= g ? null : state.cells[rr * g + cc];
        // placing O that sits between two S's is a threat next turn — do it
        if (at(r - dr, c - dc) === 'S' && at(r + dr, c + dc) === 'S') potential++;
      }
      return potential > 0;
    });
    if (blockish.length > 0) {
      const cell = blockish[0];
      return { cell, letter: 'O' };
    }
  }
  const cell = free[(free.length * 7 + 5) % free.length];
  return { cell, letter: state.scores.length % 2 === 0 ? 'S' : 'O' };
}
