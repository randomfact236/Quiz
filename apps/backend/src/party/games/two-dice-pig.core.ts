/**
 * Two-Dice Pig MP (T34 3P + F6 4P, ONE core) — PURE core, backend-owned.
 *
 * Push your luck with TWO dice: no 1s → the sum goes into the pot (doubles
 * pay double!); a single 1 busts the pot; double 1 is the PIG and eats
 * your whole trough (bank resets). Hold to bank the pot — first to 100 wins.
 * The server rolls; the client just watches.
 *
 * EMPTY-BOARD: pure dice game — no words, no served content. All public.
 */

export const TDP_TARGET = 100;

export interface TdpState {
  bank: number[];
  pot: number;
  turn: number;
  seatCount: number;
  lastRoll: number[] | null;
  lastEvent: 'roll' | 'bust' | 'pig' | 'hold' | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface TdpPlacement {
  seat: number;
  rank: number;
}

function tdpDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

export function tdpInitialState(seatCount: number): TdpState {
  return {
    bank: new Array(seatCount).fill(0) as number[],
    pot: 0,
    turn: 0,
    seatCount,
    lastRoll: null,
    lastEvent: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

export function tdpValidateMove(state: TdpState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { roll?: unknown; hold?: unknown } | null;
  if (!m || typeof m !== 'object') return 'Send { roll } or { hold }.';
  if (m.roll === true) return null;
  if (m.hold === true) {
    if (state.pot <= 0) return 'Roll first — there is nothing to bank.';
    return null;
  }
  return 'Send { roll } or { hold }.';
}

export function tdpApplyMove(state: TdpState, seat: number, move: unknown): TdpState {
  const m = move as { roll?: boolean; hold?: boolean };
  const bank = state.bank.slice();
  const next: TdpState = { ...state, bank, moveCount: state.moveCount + 1 };
  if (m.roll === true) {
    const d1 = tdpDie();
    const d2 = tdpDie();
    next.lastRoll = [d1, d2];
    if (d1 === 1 && d2 === 1) {
      next.pot = 0;
      bank[seat] = 0;
      next.lastEvent = 'pig';
      next.turn = (seat + 1) % state.seatCount;
    } else if (d1 === 1 || d2 === 1) {
      next.pot = 0;
      next.lastEvent = 'bust';
      next.turn = (seat + 1) % state.seatCount;
    } else {
      next.pot = state.pot + (d1 === d2 ? 2 * (d1 + d2) : d1 + d2);
      next.lastEvent = 'roll';
    }
    return next;
  }
  // hold
  bank[seat] = state.bank[seat] + state.pot;
  next.pot = 0;
  next.lastEvent = 'hold';
  if (bank[seat] >= TDP_TARGET) {
    next.phase = 'finished';
    next.winnerSeat = seat;
    return next;
  }
  next.turn = (seat + 1) % state.seatCount;
  return next;
}

export function tdpIsOver(state: TdpState): boolean {
  return state.phase === 'finished';
}

export function tdpWinner(state: TdpState): number | null {
  return state.winnerSeat;
}

export function tdpPlacement(state: TdpState): TdpPlacement[] {
  const rows = Array.from({ length: state.seatCount }, (_, seat) => ({
    seat,
    n: state.bank[seat],
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

export function tdpBotMove(
  state: TdpState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): unknown {
  if (state.pot > 0 && state.bank[seat] + state.pot >= TDP_TARGET) return { hold: true };
  const threshold = tier === 'easy' ? 16 : tier === 'medium' ? 21 : 25;
  if (state.pot >= threshold) return { hold: true };
  return { roll: true };
}
