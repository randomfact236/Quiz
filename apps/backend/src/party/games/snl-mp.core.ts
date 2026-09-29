/**
 * Snakes & Ladders MP (T42 3P + F35 4P, ONE core) — PURE core, backend-owned.
 *
 * The classic 1–100 race with the canonical Milton-Bradley snakes/ladders
 * layout — that layout is a RULES CONSTANT (like Checkers' opening array or
 * the standard 52-card deck), not served content. Dice are rolled by the
 * SERVER (approved Pig Dice precedent, 2026-09-29 owner approval unlocks the
 * dice tier). First to land EXACTLY on 100 wins (overshoot bounces back);
 * remaining seats rank by position. Empty-board: every seat starts off-board.
 */

export const SNL_SEATS_MAX = 4;
export const SNL_GOAL = 100;

/** Canonical layout: landing on the key climbs/slides to the value. */
export const SNL_LADDERS: Readonly<Record<number, number>> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};
export const SNL_SNAKES: Readonly<Record<number, number>> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  98: 79,
};

export interface SnlState {
  positions: number[]; // 0 = off-board (start)
  turn: number;
  seatCount: number;
  /** Last roll, for the UI (public). */
  lastRoll: number | null;
  /** Finish order as seats reach 100 (game ends on first finisher). */
  finished: number[];
}

export function snlInitialState(seatCount: number): SnlState {
  return {
    positions: Array<number>(seatCount).fill(0),
    turn: 0,
    seatCount,
    lastRoll: null,
    finished: [],
  };
}

export function snlRoll(): number {
  return 1 + Math.floor(Math.random() * 6);
}

export function snlValidateMove(
  state: SnlState,
  seat: number,
  move: { roll?: number }
): string | null {
  if (state.finished.length > 0) return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  if (
    move &&
    move.roll !== undefined &&
    (!Number.isInteger(move.roll) || move.roll < 1 || move.roll > 6)
  ) {
    return 'Invalid roll.';
  }
  return null;
}

/** Landing after movement + snakes/ladders + bounce-back at 100. */
export function snlLand(
  from: number,
  roll: number
): { pos: number; bounced: boolean; chute: string | null } {
  let pos = from + roll;
  let bounced = false;
  if (pos > SNL_GOAL) {
    pos = SNL_GOAL - (pos - SNL_GOAL);
    bounced = true;
  }
  let chute: string | null = null;
  if (SNL_LADDERS[pos]) {
    pos = SNL_LADDERS[pos];
    chute = 'ladder';
  } else if (SNL_SNAKES[pos]) {
    pos = SNL_SNAKES[pos];
    chute = 'snake';
  }
  return { pos, bounced, chute };
}

export function snlApplyMove(state: SnlState, seat: number, roll: number): SnlState {
  const positions = state.positions.slice();
  const { pos } = snlLand(positions[seat], roll);
  positions[seat] = pos;
  const finished = pos >= SNL_GOAL ? [...state.finished, seat] : state.finished;
  const nextTurn = (seat + 1) % state.seatCount;
  return {
    positions,
    turn: nextTurn,
    seatCount: state.seatCount,
    lastRoll: roll,
    finished,
  };
}

export function snlIsOver(state: SnlState): boolean {
  return state.finished.length > 0;
}

/**
 * Placement: the finisher is 1st; everyone else by position desc (off-board
 * seats last, ties share rank).
 */
export function snlPlacement(state: SnlState): { seat: number; rank: number }[] {
  const out: { seat: number; rank: number }[] = [];
  if (state.finished.length > 0) out.push({ seat: state.finished[0], rank: 1 });
  const rest = state.positions
    .map((p, seat) => ({ seat, p }))
    .filter((row) => row.seat !== state.finished[0])
    .sort((a, b) => b.p - a.p || a.seat - b.seat);
  const base = state.finished.length > 0 ? 2 : 1;
  let lastPos = NaN;
  let lastRank = 0;
  rest.forEach((row, i) => {
    let rank: number;
    if (row.p === lastPos) rank = lastRank;
    else {
      rank = base + i;
      lastRank = rank;
      lastPos = row.p;
    }
    out.push({ seat: row.seat, rank });
  });
  return out;
}
