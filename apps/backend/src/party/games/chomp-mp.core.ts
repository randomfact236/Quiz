/**
 * Chomp Elimination MP (T15 3P + F22 4P, ONE core) — PURE core, backend-owned.
 *
 * The chomp classic turned into a survival round: a shared grid with the
 * poison at the top-left. A move takes one cell and everything below+right
 * of it (the quadrant). Whoever is forced to take the poison (or takes it
 * on purpose) is OUT; the survivors get a fresh grid and play on. Last seat
 * standing wins — placement is the elimination order reversed.
 *
 * EMPTY-BOARD: a pure board game — no words, no served content. Everything
 * is public information; no redaction needed.
 */

export const CH_ROWS = 6;
export const CH_COLS = 6;

export interface ChState {
  /** true = still on the tray (false = chomped away). */
  open: boolean[][];
  /** Seats still in the round, in play order. */
  alive: number[];
  /** Elimination order (first out first). */
  eliminated: number[];
  turn: number;
  round: number;
  seatCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}

export interface ChPlacement {
  seat: number;
  rank: number;
}

function chFreshGrid(): boolean[][] {
  return Array.from({ length: CH_ROWS }, () => Array.from({ length: CH_COLS }, () => true));
}

export function chInitialState(seatCount: number): ChState {
  return {
    open: chFreshGrid(),
    alive: Array.from({ length: seatCount }, (_, i) => i),
    eliminated: [],
    turn: 0,
    round: 1,
    seatCount,
    phase: 'playing',
    winnerSeat: null,
  };
}

export function chValidateMove(state: ChState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { cell?: unknown } | null;
  if (!m || !Array.isArray(m.cell) || m.cell.length !== 2) return 'Send { cell: [row, col] }.';
  const [r, c] = m.cell as [number, number];
  if (!Number.isInteger(r) || !Number.isInteger(c)) return 'Send { cell: [row, col] }.';
  if (r < 0 || r >= CH_ROWS || c < 0 || c >= CH_COLS) return 'That cell is off the tray.';
  if (!state.open[r][c]) return 'That bite has already been taken.';
  return null;
}

export function chIsPoison(r: number, c: number): boolean {
  return r === 0 && c === 0;
}

/**
 * Apply a legal move. Poison bites eliminate the mover (board resets for the
 * survivors); safe bites remove the quadrant and pass the turn.
 */
export function chApplyMove(
  state: ChState,
  seat: number,
  move: { cell: [number, number] }
): ChState {
  const [r, c] = move.cell;
  if (chIsPoison(r, c)) {
    const eliminated = [...state.eliminated, seat];
    const alive = state.alive.filter((s) => s !== seat);
    if (alive.length <= 1) {
      return {
        ...state,
        alive,
        eliminated,
        phase: 'finished',
        winnerSeat: alive.length === 1 ? alive[0] : null,
        turn: alive.length === 1 ? alive[0] : state.turn,
      };
    }
    // Fresh tray for the survivors; the next alive seat starts the round.
    const nextSeat = chNextAlive(alive, seat);
    return {
      ...state,
      open: chFreshGrid(),
      alive,
      eliminated,
      turn: nextSeat,
      round: state.round + 1,
    };
  }
  const open = state.open.map((row) => row.slice());
  for (let i = r; i < CH_ROWS; i++) {
    for (let j = c; j < CH_COLS; j++) open[i][j] = false;
  }
  return { ...state, open, turn: chNextAlive(state.alive, seat) };
}

function chNextAlive(alive: number[], afterSeat: number): number {
  const sorted = alive.slice().sort((a, b) => a - b);
  for (const s of sorted) {
    if (s > afterSeat) return s;
  }
  return sorted[0];
}

export function chIsOver(state: ChState): boolean {
  return state.phase === 'finished';
}

export function chWinner(state: ChState): number | null {
  return state.winnerSeat;
}

/** Placement: the survivor 1st, then eliminations in reverse (last out = 2nd). */
export function chPlacement(state: ChState): ChPlacement[] {
  const out: ChPlacement[] = [];
  const survivor = state.winnerSeat;
  if (survivor !== null) out.push({ seat: survivor, rank: 1 });
  const rev = state.eliminated.slice().reverse();
  rev.forEach((seat, i) => out.push({ seat, rank: (survivor !== null ? 1 : 0) + i + 1 }));
  return out;
}

/** Open (un-chomped) cell count — public sugar for bots + UI. */
export function chOpenCount(state: ChState): number {
  let n = 0;
  for (let i = 0; i < CH_ROWS; i++) {
    for (let j = 0; j < CH_COLS; j++) if (state.open[i][j]) n += 1;
  }
  return n;
}

/**
 * Bot bite — honest tray reading only. Safe cells are anything except the
 * poison: easy nibbles the smallest quadrant, hard clears the biggest
 * (fast rounds), medium rolls a seeded middle pick. Forced to bite the
 * poison (only it remains open or no safe pick), the bot takes it.
 */
export function chBotMove(state: ChState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const safe: { r: number; c: number; size: number }[] = [];
  for (let r = 0; r < CH_ROWS; r++) {
    for (let c = 0; c < CH_COLS; c++) {
      if (!state.open[r][c] || chIsPoison(r, c)) continue;
      // quadrant size = cells (i>=r, j>=c) still open
      let size = 0;
      for (let i = r; i < CH_ROWS; i++) {
        for (let j = c; j < CH_COLS; j++) if (state.open[i][j]) size += 1;
      }
      safe.push({ r, c, size });
    }
  }
  if (safe.length === 0) return { cell: [0, 0] }; // only the poison remains — take it
  let pick;
  if (tier === 'easy') {
    pick = safe.reduce((a, b) => (b.size < a.size ? b : a), safe[0]);
  } else if (tier === 'hard') {
    pick = safe.reduce((a, b) => (b.size > a.size ? b : a), safe[0]);
  } else {
    pick = safe[(seat * 7 + chOpenCount(state) * 3) % safe.length];
  }
  return { cell: [pick.r, pick.c] };
}
