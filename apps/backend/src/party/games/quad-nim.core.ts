/**
 * Quad-Nim MP (F12 4P, seats up to 4) — PURE core, backend-owned.
 *
 * The classic take-away game as a forced-order party puzzle: 22 sticks,
 * take 1-3 each turn. Nobody wants the LAST stick — its taker finishes
 * 4th, and the player who forced them there takes 1st (the rest rank by
 * who moved most recently before them).
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const QN_STICKS = 22; // 22 mod 4 = 2: the first mover can force it

export interface QnState {
  sticks: number;
  turn: number;
  seatCount: number;
  /** Move log: seat + take per move, oldest first. */
  moves: { seat: number; take: number }[];
  lastTake: number | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
  loserSeat: number | null;
}
export interface QnPlacement {
  seat: number;
  rank: number;
}

export function qnInitialState(seatCount: number): QnState {
  return {
    sticks: QN_STICKS,
    turn: 0,
    seatCount,
    moves: [],
    lastTake: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
    loserSeat: null,
  };
}

export function qnValidateMove(state: QnState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { take?: unknown } | null;
  if (!m || !Number.isInteger(m.take)) return 'Send { take } (1-3).';
  const take = m.take as number;
  if (take < 1 || take > 3) return 'Take one, two or three sticks.';
  if (take > state.sticks) return 'There are only ' + state.sticks + ' sticks left.';
  return null;
}

export function qnApplyMove(state: QnState, seat: number, move: unknown): QnState {
  const m = move as { take: number };
  const sticks = state.sticks - m.take;
  const moves = state.moves.concat([{ seat, take: m.take }]);
  const next: QnState = {
    ...state,
    sticks,
    moves,
    lastTake: m.take,
    moveCount: state.moveCount + 1,
  };
  if (sticks <= 0) {
    // seat ate the last stick: loser. The player who moved before them forced it.
    const winner = moves.length >= 2 ? moves[moves.length - 2].seat : (seat + 1) % state.seatCount;
    next.phase = 'finished';
    next.loserSeat = seat;
    next.winnerSeat = winner;
    next.turn = seat;
    return next;
  }
  next.turn = (seat + 1) % state.seatCount;
  return next;
}

export function qnIsOver(state: QnState): boolean {
  return state.phase === 'finished';
}

export function qnWinner(state: QnState): number | null {
  return state.winnerSeat;
}

export function qnPlacement(state: QnState): QnPlacement[] {
  if (state.phase !== 'finished' || state.loserSeat === null) {
    return Array.from({ length: state.seatCount }, (_, s) => ({ seat: s, rank: s + 1 }));
  }
  const loser = state.loserSeat;
  // last-move index per seat
  const last = new Array(state.seatCount).fill(-1) as number[];
  state.moves.forEach((mv, i) => {
    last[mv.seat] = i;
  });
  const others = Array.from({ length: state.seatCount }, (_, s) => s).filter((s) => s !== loser);
  others.sort((a, b) => last[b] - last[a] || a - b);
  const order = others.concat([loser]);
  return order.map((seat, i) => ({ seat, rank: i + 1 }));
}

export function qnBotMove(state: QnState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const n = state.sticks;
  // Winning take: leave a pile of 1 (mod 4).
  const winning: number[] = [];
  for (const take of [1, 2, 3]) {
    if (take > n) continue;
    const left = n - take;
    if (left >= 1 && left % 4 === 1) winning.push(take);
  }
  const safe: number[] = [];
  for (const take of [1, 2, 3]) {
    if (take > n) continue;
    if (n - take === 0) continue; // that is the losing stick
    safe.push(take);
  }
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  if (tier !== 'easy' && winning.length) return { take: pick(winning) };
  if (tier === 'easy') {
    const all: number[] = [];
    for (const take of [1, 2, 3]) if (take <= n) all.push(take);
    return { take: pick(all.length ? all : [1]) };
  }
  if (safe.length) return { take: pick(safe) };
  return { take: Math.min(3, n) }; // doomed anyway
}
