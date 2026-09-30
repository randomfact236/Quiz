/**
 * Pig Dice MP (T33 3P + F5 4P, ONE core) — PURE core, backend-owned.
 *
 * The classic push-your-luck dice game, three/four banks deep: roll the die
 * as often as you dare, adding to the pot; stop (hold) to bank the pot. Roll
 * a 1 and the pot is gone — the turn passes. First bank to 100 wins.
 *
 * The die is SERVER-ROLLED (the approved Pig Dice server-roll precedent);
 * the client (and bots) only ever send {roll:true} or {hold:true}.
 *
 * Every number here is public information — no redaction needed.
 */

export const PD_TARGET = 100;

export interface PdState {
  /** Banked total per seat. */
  banks: number[];
  /** The rolling seat's un-banked pot. */
  pot: number;
  /** Seat whose turn it is. */
  turn: number;
  seatCount: number;
  /** Last die face (public sugar; null before any roll). */
  lastRoll: number | null;
  /** Rolls made in the current turn (public sugar). */
  rollCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}

export interface PdPlacement {
  seat: number;
  rank: number;
}

export function pdInitialState(seatCount: number): PdState {
  return {
    banks: Array.from({ length: seatCount }, () => 0),
    pot: 0,
    turn: 0,
    seatCount,
    lastRoll: null,
    rollCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

export function pdValidateMove(state: PdState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { roll?: unknown; hold?: unknown } | null;
  if (!m || typeof m !== 'object') return 'Send { roll: true } or { hold: true }.';
  if (m.roll === true) return null;
  if (m.hold === true) {
    if (state.pot <= 0) return 'Roll at least once before holding.';
    return null;
  }
  return 'Send { roll: true } or { hold: true }.';
}

/**
 * Apply a move; the die face is supplied by the caller (server roll).
 * roll: 1 busts (pot goes, turn passes); 2-6 grows the pot and keeps the turn.
 * hold: banks the pot; first bank >= PD_TARGET wins.
 */
export function pdApplyMove(
  state: PdState,
  seat: number,
  move: { roll?: boolean; hold?: boolean },
  die: number
): PdState {
  if (move.hold === true) {
    const banks = state.banks.slice();
    banks[seat] += state.pot;
    const won = banks[seat] >= PD_TARGET;
    return {
      ...state,
      banks,
      pot: 0,
      rollCount: 0,
      turn: won ? seat : (seat + 1) % state.seatCount,
      phase: won ? 'finished' : 'playing',
      winnerSeat: won ? seat : null,
    };
  }
  if (die === 1) {
    return {
      ...state,
      pot: 0,
      lastRoll: 1,
      rollCount: 0,
      turn: (seat + 1) % state.seatCount,
    };
  }
  return {
    ...state,
    pot: state.pot + die,
    lastRoll: die,
    rollCount: state.rollCount + 1,
  };
}

export function pdIsOver(state: PdState): boolean {
  return state.phase === 'finished';
}

export function pdWinner(state: PdState): number | null {
  return state.winnerSeat;
}

/** Placement: the winner 1st, the rest by banked total desc (ties by seat). */
export function pdPlacement(state: PdState): PdPlacement[] {
  const seats = Array.from({ length: state.seatCount }, (_, i) => i);
  const winner = state.winnerSeat;
  const rest = seats.filter((s) => s !== winner);
  rest.sort((a, b) => state.banks[b] - state.banks[a] || a - b);
  const out: PdPlacement[] = [];
  if (winner !== null) out.push({ seat: winner, rank: 1 });
  rest.forEach((s, i) => out.push({ seat: s, rank: (winner !== null ? 1 : 0) + i + 1 }));
  return out;
}

/**
 * Bot strategy — honest push-your-luck on public numbers only:
 * hold once the pot reaches the tier target (easy 15, medium 20, hard 25),
 * but never hold below 10 total banked unless the pot is already huge.
 */
export function pdBotMove(state: PdState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const target = tier === 'easy' ? 15 : tier === 'medium' ? 20 : 25;
  const banked = state.banks[seat];
  const need = PD_TARGET - banked;
  if (state.pot > 0 && (state.pot >= target || state.pot >= need)) return { hold: true };
  if (state.pot > 0 && banked + state.pot >= PD_TARGET) return { hold: true };
  return { roll: true };
}
