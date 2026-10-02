/**
 * Farkle-lite MP (F38 4P, seats up to 4) — PURE core, backend-owned.
 *
 * Six-dice push-your-luck, streamlined for parties: every roll's scoring
 * dice count automatically; you choose to bank the pot or keep rolling the
 * rest. A roll with nothing counts = FARKLE, the pot burns. First to 5,000
 * banks the win. The server rolls every die.
 *
 * EMPTY-BOARD: pure dice game — no words, no served content. All public.
 */

export const FK_TARGET = 5000;

export interface FkState {
  bank: number[];
  pot: number;
  /** Dice rolled in the current roll (for the table to see). */
  dice: number[];
  /** How many dice the NEXT roll uses. */
  diceLeft: number;
  phaseTurn: 'roll' | 'decide';
  turn: number;
  seatCount: number;
  lastEvent: 'roll' | 'farkle' | 'bank' | 'open' | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface FkPlacement {
  seat: number;
  rank: number;
}

function fkDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

export function fkInitialState(seatCount: number): FkState {
  return {
    bank: new Array(seatCount).fill(0) as number[],
    pot: 0,
    dice: [],
    diceLeft: 6,
    phaseTurn: 'roll',
    turn: 0,
    seatCount,
    lastEvent: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

/** Score + how many dice are consumed by the scoring. Lite rules. */
export function fkScore(dice: number[]): { score: number; used: number } {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // 1..6
  for (const d of dice) counts[d] += 1;
  const n = dice.length;
  // straight 1-6
  if (n === 6 && counts.slice(1).every((c) => c === 1)) return { score: 1500, used: 6 };
  // three pairs
  const pairs = counts.slice(1).filter((c) => c === 2).length;
  if (n === 6 && pairs === 3) return { score: 1500, used: 6 };
  let score = 0;
  let used = 0;
  for (let f = 1; f <= 6; f++) {
    const c = counts[f];
    if (c >= 3) {
      const base = f === 1 ? 1000 : f * 100;
      const mult = c === 3 ? 1 : c === 4 ? 2 : c === 5 ? 4 : 8;
      score += base * mult;
      used += c;
    } else if (c > 0) {
      if (f === 1) {
        score += c * 100;
        used += c;
      } else if (f === 5) {
        score += c * 50;
        used += c;
      }
    }
  }
  return { score, used };
}

export function fkValidateMove(state: FkState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { roll?: unknown; bank?: unknown } | null;
  if (!m || typeof m !== 'object') return 'Send { roll } or { bank }.';
  if (m.roll === true) return null;
  if (m.bank === true) {
    if (state.phaseTurn !== 'decide') return 'Roll first — nothing to bank yet.';
    return null;
  }
  return 'Send { roll } or { bank }.';
}

export function fkApplyMove(state: FkState, seat: number, move: unknown): FkState {
  const m = move as { roll?: boolean; bank?: boolean };
  const bank = state.bank.slice();
  const next: FkState = { ...state, bank, moveCount: state.moveCount + 1 };
  if (m.roll === true) {
    const count = state.phaseTurn === 'decide' ? state.diceLeft : 6;
    const dice: number[] = [];
    for (let i = 0; i < count; i++) dice.push(fkDie());
    next.dice = dice;
    const { score, used } = fkScore(dice);
    if (score === 0) {
      next.pot = 0;
      next.phaseTurn = 'roll';
      next.diceLeft = 6;
      next.lastEvent = 'farkle';
      next.turn = (seat + 1) % state.seatCount;
      return next;
    }
    next.pot = state.pot + score;
    const left = dice.length - used;
    next.diceLeft = left === 0 ? 6 : left;
    next.phaseTurn = 'decide';
    next.lastEvent = 'roll';
    return next;
  }
  // bank
  bank[seat] = state.bank[seat] + state.pot;
  next.pot = 0;
  next.dice = [];
  next.diceLeft = 6;
  next.phaseTurn = 'roll';
  next.lastEvent = 'bank';
  if (bank[seat] >= FK_TARGET) {
    next.phase = 'finished';
    next.winnerSeat = seat;
    return next;
  }
  next.turn = (seat + 1) % state.seatCount;
  return next;
}

export function fkIsOver(state: FkState): boolean {
  return state.phase === 'finished';
}

export function fkWinner(state: FkState): number | null {
  return state.winnerSeat;
}

export function fkPlacement(state: FkState): FkPlacement[] {
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

export function fkBotMove(state: FkState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  if (state.phaseTurn === 'roll') return { roll: true };
  if (state.bank[seat] + state.pot >= FK_TARGET) return { bank: true };
  const base = tier === 'easy' ? 300 : tier === 'medium' ? 450 : 550;
  // more dice left = keep some boldness; few dice = bank sooner
  const adj =
    state.diceLeft >= 4
      ? base + 100
      : state.diceLeft === 3
        ? base
        : state.diceLeft === 2
          ? base - 100
          : base - 250;
  if (state.pot >= adj) return { bank: true };
  return { roll: true };
}
