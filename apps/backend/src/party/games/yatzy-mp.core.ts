/**
 * Yatzy MP (T35 3P + F7 4P, ONE core) — PURE core, backend-owned.
 *
 * The scorecard dice classic: 5 dice, 3 rolls per turn (hold any dice between
 * rolls), 15 fixed categories filled exactly once. Fixed-canonical scoring
 * (no regional variants — documented): upper aces..sixes with the 63 bonus,
 * one pair, two pairs, three alike, four alike, small straight (1-5), large
 * straight (2-6), full house, chance, yatzy (5 alike = 50). Highest total
 * wins; ties share rank.
 *
 * RNG: all rolls are server-side (owner approved the dice tier 2026-09-29).
 * Move protocol per turn: {roll:true, keep:[0-5 indexes]} to roll with held
 * dice; {score:<category>} to bank the current dice into a category (must
 * have rolled at least once, banking ends the turn).
 */

export const YZ_DICE = 5;
export const YZ_ROLLS = 3;

export const YZ_CATEGORIES = [
  'ones',
  'twos',
  'threes',
  'fours',
  'fives',
  'sixes',
  'onePair',
  'twoPairs',
  'threeAlike',
  'fourAlike',
  'smallStraight',
  'largeStraight',
  'fullHouse',
  'chance',
  'yatzy',
] as const;
export type YzCategory = (typeof YZ_CATEGORIES)[number];

export interface YzState {
  /** Current dice (1..6). */
  dice: number[];
  /** Rolls used this turn (0..3). */
  rolls: number;
  /** Held dice indexes for the UI (server ignores holds unless rolling). */
  hold: number[];
  turn: number;
  seatCount: number;
  /** scorecards[seat][category] = points or null (unused). */
  scorecards: Array<Record<string, number | null>>;
  /** true when every card is full (game over). */
  finished: boolean;
  lastAction: { seat: number; kind: 'roll' | 'score'; category?: string } | null;
}

export function yzInitialState(seatCount: number, rng: () => number): YzState {
  void rng;
  return {
    dice: Array(YZ_DICE).fill(1),
    rolls: 0,
    hold: [],
    turn: 0,
    seatCount,
    scorecards: Array.from({ length: seatCount }, () =>
      Object.fromEntries(YZ_CATEGORIES.map((c) => [c, null]))
    ),
    finished: false,
    lastAction: null,
  };
}

function counts(dice: number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const d of dice) m.set(d, (m.get(d) ?? 0) + 1);
  return m;
}

/** Fixed-canonical scoring for a dice set into a category. */
export function yzScore(dice: number[], category: YzCategory): number {
  const m = counts(dice);
  const sumOf = (v: number) => (m.get(v) ?? 0) * v;
  switch (category) {
    case 'ones':
      return sumOf(1);
    case 'twos':
      return sumOf(2);
    case 'threes':
      return sumOf(3);
    case 'fours':
      return sumOf(4);
    case 'fives':
      return sumOf(5);
    case 'sixes':
      return sumOf(6);
    case 'onePair': {
      let best = 0;
      for (const [v, n] of m) if (n >= 2 && v * 2 > best) best = v * 2;
      return best;
    }
    case 'twoPairs': {
      const pairs = [...m.entries()]
        .filter(([, n]) => n >= 2)
        .map(([v]) => v)
        .sort((a, b) => b - a);
      if (pairs.length >= 2) return pairs[0] * 2 + pairs[1] * 2;
      // four of a kind counts as two pairs (documented canonical rule)
      const four = [...m.entries()].find(([, n]) => n === 4);
      if (four) return four[0] * 4;
      return 0;
    }
    case 'threeAlike': {
      let best = 0;
      for (const [v, n] of m) if (n >= 3 && v * 3 > best) best = v * 3;
      return best;
    }
    case 'fourAlike': {
      let best = 0;
      for (const [v, n] of m) if (n >= 4 && v * 4 > best) best = v * 4;
      return best;
    }
    case 'smallStraight': {
      const s = [...dice].sort((a, b) => a - b).join('');
      return s === '12345' ? 15 : 0;
    }
    case 'largeStraight': {
      const s = [...dice].sort((a, b) => a - b).join('');
      return s === '23456' ? 20 : 0;
    }
    case 'fullHouse': {
      let three = 0;
      let pair = 0;
      for (const [v, n] of m) {
        if (n === 5) return v * 5; // 5 alike counts as full house (documented)
        if (n === 3) three = v;
        if (n === 2) pair = v;
      }
      return three > 0 && pair > 0 ? three * 3 + pair * 2 : 0;
    }
    case 'chance':
      return dice.reduce((a, b) => a + b, 0);
    case 'yatzy': {
      const first = dice[0];
      return dice.every((d) => d === first) ? 50 : 0;
    }
  }
}

export function yzUpperBonus(card: Record<string, number | null>): number {
  let upper = 0;
  for (const c of ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']) {
    upper += card[c] ?? 0;
  }
  return upper >= 63 ? 50 : 0;
}

export function yzTotal(card: Record<string, number | null>): number {
  let total = 0;
  for (const c of YZ_CATEGORIES) total += card[c] ?? 0;
  return total + yzUpperBonus(card);
}

/** Roll with held dice; rolls must remain. */
export function yzApplyRoll(
  state: YzState,
  seat: number,
  keep: number[],
  rng: () => number
): { state: YzState; error: string | null } {
  if (state.finished || state.turn !== seat) return { state, error: 'Not your turn.' };
  if (state.rolls >= YZ_ROLLS) return { state, error: 'No rolls left — bank a category.' };
  const dice = state.dice.slice();
  for (let i = 0; i < YZ_DICE; i++) {
    if (!keep.includes(i)) dice[i] = 1 + Math.floor(rng() * 6);
  }
  return {
    state: {
      ...state,
      dice,
      rolls: state.rolls + 1,
      hold: keep.slice(),
      lastAction: { seat, kind: 'roll' },
    },
    error: null,
  };
}

/** Bank the current dice into a category; must have rolled this turn. */
export function yzApplyScore(
  state: YzState,
  seat: number,
  category: YzCategory
): { state: YzState; error: string | null } {
  if (state.finished || state.turn !== seat) return { state, error: 'Not your turn.' };
  if (state.rolls === 0) return { state, error: 'Roll the dice before banking.' };
  if (!(YZ_CATEGORIES as readonly string[]).includes(category))
    return { state, error: 'Unknown category.' };
  const card = state.scorecards[seat];
  if (card[category] !== null) return { state, error: 'That category is already used.' };
  const nextCard = { ...card, [category]: yzScore(state.dice, category) };
  const scorecards = state.scorecards.map((c, i) => (i === seat ? nextCard : c));
  const finished = scorecards.every((c) => YZ_CATEGORIES.every((k) => c[k] !== null));
  return {
    state: {
      ...state,
      scorecards,
      dice: Array(YZ_DICE).fill(1),
      rolls: 0,
      hold: [],
      turn: finished ? seat : (seat + 1) % state.seatCount,
      finished,
      lastAction: { seat, kind: 'score', category },
    },
    error: null,
  };
}

export function yzValidateMove(
  state: YzState,
  seat: number,
  move: { roll?: boolean; keep?: number[] } | { score: YzCategory }
): string | null {
  if ('roll' in (move as { roll?: boolean })) {
    const keep = (move as { keep?: number[] }).keep ?? [];
    if (!Array.isArray(keep) || keep.some((k) => !Number.isInteger(k) || k < 0 || k >= YZ_DICE))
      return 'Hold indexes must be dice positions 0-4.';
    return null;
  }
  const m = move as { score?: YzCategory };
  if (!m.score) return 'Malformed move.';
  return null; // detailed validation in apply (returns error strings to bots too)
}

export function yzPlacement(state: YzState): { seat: number; rank: number }[] {
  const totals = state.scorecards.map((c) => yzTotal(c));
  const order = totals.map((t, seat) => ({ seat, t })).sort((a, b) => b.t - a.t || a.seat - b.seat);
  const ranks: number[] = [];
  let lastT = NaN;
  let lastRank = 0;
  order.forEach((row, i) => {
    if (row.t === lastT) ranks[row.seat] = lastRank;
    else {
      ranks[row.seat] = i + 1;
      lastRank = i + 1;
      lastT = row.t;
    }
  });
  return order.map((row) => ({ seat: row.seat, rank: ranks[row.seat] }));
}

/** Bot: roll up to 3 aiming at the best open category; bank greedily. */
export function yzBotDecide(
  state: YzState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard',
  rng: () => number
): { roll: true; keep: number[] } | { score: YzCategory } {
  const card = state.scorecards[seat];
  const open = YZ_CATEGORIES.filter((c) => card[c] === null);
  if (state.rolls >= YZ_ROLLS || open.length === 0) {
    // bank the best-scoring open category
    let best: YzCategory = open[0] ?? 'chance';
    let bestScore = -1;
    for (const c of open) {
      const s = yzScore(state.dice, c);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    return { score: best };
  }
  if (tier === 'easy' && state.rolls >= 1) {
    // easy banks after one roll
    return { score: open[(open.length * 7 + seat) % open.length] };
  }
  // hold dice that already form the most frequent value
  const m = counts(state.dice);
  let bestVal = 0;
  let bestN = 0;
  for (const [v, n] of m) {
    if (n > bestN || (n === bestN && v > bestVal)) {
      bestN = n;
      bestVal = v;
    }
  }
  const keep: number[] = [];
  state.dice.forEach((d, i) => {
    if (d === bestVal && bestN >= 2) keep.push(i);
  });
  void rng;
  return { roll: true, keep };
}
