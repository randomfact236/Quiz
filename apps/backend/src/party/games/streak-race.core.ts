/**
 * Streak Race MP (T40 3P + F36 4P, ONE core) — PURE core, backend-owned.
 *
 * Higher or lower, around the table: the value in the middle keeps rising
 * and falling as players call the next draw. A correct call extends your
 * streak; a wrong one (or a tie) ends your run for good. Longest streak
 * wins; first to a streak of six takes it instantly.
 *
 * EMPTY-BOARD: pure dice/card game — no words, no served content. Public.
 */

export const SR_MAX = 13;
export const SR_CAP = 6;

export interface SrState {
  /** The value on the table right now (1..13). */
  value: number;
  /** Current (unbroken) run per seat. */
  streak: number[];
  /** Frozen best per seat (set the moment a run breaks). */
  best: number[];
  /** Seats whose run has ended. */
  missed: boolean[];
  turn: number;
  seatCount: number;
  lastRoll: number | null;
  lastCall: 'h' | 'l' | null;
  lastSeat: number | null;
  lastCorrect: boolean | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface SrPlacement {
  seat: number;
  rank: number;
}

function srRoll(): number {
  return 1 + Math.floor(Math.random() * SR_MAX);
}

export function srInitialState(seatCount: number): SrState {
  return {
    value: srRoll(),
    streak: new Array(seatCount).fill(0) as number[],
    best: new Array(seatCount).fill(0) as number[],
    missed: new Array(seatCount).fill(false) as boolean[],
    turn: 0,
    seatCount,
    lastRoll: null,
    lastCall: null,
    lastSeat: null,
    lastCorrect: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

export function srValidateMove(state: SrState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { call?: unknown } | null;
  if (!m || (m.call !== 'h' && m.call !== 'l')) return 'Send { call: "h" } or { call: "l" }.';
  return null;
}

function srAdvance(state: SrState, from: number): number {
  let nxt = (from + 1) % state.seatCount;
  for (let i = 0; i < state.seatCount; i++) {
    if (!state.missed[nxt]) return nxt;
    nxt = (nxt + 1) % state.seatCount;
  }
  return from;
}

export function srApplyMove(state: SrState, seat: number, move: unknown): SrState {
  const m = move as { call: 'h' | 'l' };
  const roll = srRoll();
  const streak = state.streak.slice();
  const best = state.best.slice();
  const missed = state.missed.slice();
  const correct = (roll > state.value && m.call === 'h') || (roll < state.value && m.call === 'l');
  const next: SrState = {
    ...state,
    value: roll,
    streak,
    best,
    missed,
    lastRoll: roll,
    lastCall: m.call,
    lastSeat: seat,
    lastCorrect: correct,
    moveCount: state.moveCount + 1,
  };
  if (correct) {
    streak[seat] += 1;
    if (streak[seat] >= SR_CAP) {
      next.phase = 'finished';
      next.winnerSeat = seat;
      next.turn = seat;
      return next;
    }
  } else {
    best[seat] = Math.max(best[seat], streak[seat]);
    missed[seat] = true;
    streak[seat] = 0;
  }
  if (missed.every((v) => v)) {
    next.phase = 'finished';
    let winner: number | null = null;
    let top = -1;
    for (let s = 0; s < state.seatCount; s++) {
      if (best[s] > top) {
        top = best[s];
        winner = s;
      }
    }
    next.winnerSeat = winner;
    next.turn = seat;
    return next;
  }
  next.turn = srAdvance(next, seat);
  return next;
}

export function srIsOver(state: SrState): boolean {
  return state.phase === 'finished';
}

export function srWinner(state: SrState): number | null {
  return state.winnerSeat;
}

export function srPlacement(state: SrState): SrPlacement[] {
  const final = Array.from({ length: state.seatCount }, (_, s) => ({
    seat: s,
    n: Math.max(state.best[s], state.streak[s]),
  }));
  const win = state.winnerSeat;
  final.sort((x, y) => {
    if (win !== null) {
      if (x.seat === win) return -1;
      if (y.seat === win) return 1;
    }
    return y.n - x.n || x.seat - y.seat;
  });
  return final.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

export function srBotMove(state: SrState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const v = state.value;
  // Optimal: higher is better iff P(higher) > P(lower), ties are dead either way.
  const optimal: 'h' | 'l' = 13 - v > v - 1 ? 'h' : 'l';
  const sloppiness = tier === 'easy' ? 0.3 : tier === 'medium' ? 0.12 : 0;
  if (Math.random() < sloppiness) return { call: Math.random() < 0.5 ? 'h' : 'l' };
  if (v === 7) return { call: Math.random() < 0.5 ? 'h' : 'l' };
  return { call: optimal };
}
