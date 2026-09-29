/**
 * Crazy Eights MP (T37 3P + F10 4P, ONE core) — PURE core, backend-owned.
 *
 * The shedding classic: 52-card deck (values A..K, suits as abstract symbols
 * — no themes, no faces, no content), 5 cards per hand (documented MP house
 * rule for faster tables), one discard pile. You play a card matching the
 * top card's suit or value; eights are wild and let you call the next suit.
 * Cannot play? Draw one card from the stock (house rule: draw exactly one,
 * then you may still play it or pass). First empty hand wins; when the
 * stock runs dry, seats that cannot play pass; last survivor by fewest
 * cards when nobody can move and the pile is deadlocked.
 *
 * Card encoding: {v: 1..13 (A=1 .. K=13), s: 0..3}. Eights = v === 8.
 *
 * SECRETS: other hands and the stock are SERVER-ONLY (redactFor keeps the
 * viewer's hand + public counts + the top discard).
 */

export interface CeCard {
  v: number; // 1..13
  s: number; // 0..3
}

export interface CeState {
  /** SERVER-ONLY: draw stock. */
  stock: CeCard[];
  /** SERVER-ONLY: per-seat hands. */
  hands: CeCard[][];
  /** Public: discard pile as played (top = last). */
  discard: CeCard[];
  /** Suit called by the last eight (overrides pile top suit when set). */
  calledSuit: number | null;
  turn: number;
  seatCount: number;
  /** Seat that emptied their hand (game over). */
  winner: number | null;
  /** Consecutive passes with an empty stock (deadlock ending). */
  passStreak: number;
  lastAction: { seat: number; kind: 'play' | 'draw' | 'pass'; eight?: boolean } | null;
}

export function ceShuffledDeck(rng: () => number): CeCard[] {
  const deck: CeCard[] = [];
  for (let s = 0; s < 4; s++) for (let v = 1; v <= 13; v++) deck.push({ v, s });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const CE_HAND = 5;

export function ceInitialState(seatCount: number, rng: () => number): CeState {
  const deck = ceShuffledDeck(rng);
  const hands: CeCard[][] = [];
  for (let s = 0; s < seatCount; s++) hands.push(deck.slice(s * CE_HAND, (s + 1) * CE_HAND));
  const stock = deck.slice(seatCount * CE_HAND);
  const first = stock.pop() as CeCard;
  // if an eight leads, clear the call so the first player plays anything
  return {
    stock,
    hands,
    discard: [first],
    calledSuit: first.v === 8 ? null : null,
    turn: 0,
    seatCount,
    winner: null,
    passStreak: 0,
    lastAction: null,
  };
}

/** Effective suit to match: an eight's called suit, else the top card's suit. */
export function ceActiveSuit(state: CeState): number {
  if (state.calledSuit !== null) return state.calledSuit;
  return state.discard[state.discard.length - 1].s;
}

export function ceActiveValue(state: CeState): number {
  return state.discard[state.discard.length - 1].v;
}

/** Legal plays for the seat: match active suit, match value, or any eight. */
export function ceLegalMoves(state: CeState, seat: number): CeCard[] {
  if (state.winner !== null) return [];
  const hand = state.hands[seat];
  const suit = ceActiveSuit(state);
  const value = ceActiveValue(state);
  return hand.filter((c) => c.v === 8 || c.s === suit || c.v === value);
}

export function ceValidateMove(
  state: CeState,
  seat: number,
  move: { card: CeCard; calledSuit?: number } | { draw: true } | { pass: true }
): string | null {
  if (state.winner !== null) return 'The table has finished.';
  if ('draw' in (move as { draw?: true })) {
    if (state.stock.length === 0) return 'The stock is empty.';
    if (ceLegalMoves(state, seat).length > 0) return 'You have a legal play — play it.';
    return null;
  }
  if ('pass' in (move as { pass?: true })) {
    if (ceLegalMoves(state, seat).length > 0) return 'You have a legal play — play it.';
    if (state.stock.length > 0) return 'Draw from the stock before passing.';
    return null;
  }
  const m = move as { card: CeCard; calledSuit?: number };
  if (!m.card || typeof m.card.v !== 'number' || typeof m.card.s !== 'number')
    return 'Malformed card.';
  const inHand = state.hands[seat].some((c) => c.v === m.card.v && c.s === m.card.s);
  if (!inHand) return 'That card is not in your hand.';
  if (!ceLegalMoves(state, seat).some((c) => c.v === m.card.v && c.s === m.card.s))
    return 'That card does not match suit or value.';
  if (m.card.v === 8) {
    if (typeof m.calledSuit !== 'number' || m.calledSuit < 0 || m.calledSuit > 3)
      return 'Eights must call the next suit (0-3).';
  }
  return null;
}

export function ceApplyPlay(
  state: CeState,
  seat: number,
  card: CeCard,
  calledSuit: number | null
): CeState {
  const hands = state.hands.map((h, i) =>
    i === seat ? h.filter((c) => !(c.v === card.v && c.s === card.s)) : h.slice()
  );
  const discard = [...state.discard, card];
  const winner = hands[seat].length === 0 ? seat : null;
  return {
    ...state,
    hands,
    discard,
    calledSuit: card.v === 8 ? calledSuit : null,
    turn: winner !== null ? seat : (seat + 1) % state.seatCount,
    passStreak: 0,
    winner,
    lastAction: { seat, kind: 'play', eight: card.v === 8 },
  };
}

export function ceApplyDraw(state: CeState, seat: number): CeState {
  if (state.stock.length === 0) return state;
  const stock = state.stock.slice();
  const card = stock.pop() as CeCard;
  const hands = state.hands.map((h, i) => (i === seat ? [...h, card] : h.slice()));
  // draw keeps the turn (house rule: draw one, then play it or pass)
  return { ...state, stock, hands, passStreak: 0, lastAction: { seat, kind: 'draw' } };
}

export function ceApplyPass(state: CeState, seat: number): CeState {
  return {
    ...state,
    turn: (seat + 1) % state.seatCount,
    passStreak: state.passStreak + 1,
    lastAction: { seat, kind: 'pass' },
  };
}

export function ceIsOver(state: CeState): boolean {
  return state.winner !== null || state.passStreak >= state.seatCount;
}

/** Winner seat empties first; deadlock ranks by fewest cards (ties share). */
export function cePlacement(state: CeState): { seat: number; rank: number }[] {
  const sizes = state.hands.map((h) => h.length);
  if (state.winner !== null) {
    const rest = sizes
      .map((_, s) => s)
      .filter((s) => s !== state.winner)
      .sort((a, b) => sizes[a] - sizes[b] || a - b);
    return [{ seat: state.winner, rank: 1 }, ...rest.map((s, i) => ({ seat: s, rank: i + 2 }))];
  }
  const order = sizes.map((s, seat) => ({ seat, s })).sort((a, b) => a.s - b.s || a.seat - b.seat);
  const ranks: number[] = [];
  let lastS = NaN;
  let lastRank = 0;
  order.forEach((row, i) => {
    if (row.s === lastS) ranks[row.seat] = lastRank;
    else {
      ranks[row.seat] = i + 1;
      lastRank = i + 1;
      lastS = row.s;
    }
  });
  return order.map((row) => ({ seat: row.seat, rank: ranks[row.seat] }));
}

const SUIT_NAMES = ['spades', 'hearts', 'clubs', 'diamonds'];

/** Bot: shed non-eights first (match value over suit), keep eights for later. */
export function ceBotMove(
  state: CeState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): { card: CeCard; calledSuit: number | null } | { draw: true } | { pass: true } {
  const legal = ceLegalMoves(state, seat);
  if (legal.length === 0) {
    if (state.stock.length > 0) return { draw: true };
    return { pass: true };
  }
  void SUIT_NAMES;
  const nonEight = legal.filter((c) => c.v !== 8);
  const pool = nonEight.length > 0 && tier !== 'easy' ? nonEight : legal;
  if (tier === 'easy')
    return { card: pool[(pool.length * 7 + seat) % pool.length], calledSuit: null };
  // medium/hard: shed the highest value card; eights call the suit they hold most of
  const pick = pool.slice().sort((a, b) => b.v - a.v)[0];
  let calledSuit: number | null = null;
  if (pick.v === 8) {
    const counts = [0, 0, 0, 0];
    for (const c of state.hands[seat]) if (c.v !== 8) counts[c.s] += 1;
    calledSuit = counts.indexOf(Math.max(...counts));
  }
  return { card: pick, calledSuit };
}
