/**
 * Memory Flip MP (T39 3P + F33 4P, ONE core) — PURE core, backend-owned.
 *
 * The classic pairs game: a shuffled grid of face-down cards; flip two per
 * turn — a MATCH scores +1 and keeps your turn; a MISS flips them back and
 * passes. Most pairs when the grid is claimed = 1st (ties share rank).
 *
 * RNG: the deck is server-shuffled at table creation (owner approved the
 * dice/card tier 2026-09-29). Values are runtime-generated pairs (1..N) —
 * no themed content, no served data.
 *
 * SECRETS: `deck` (values per cell) and `botMemory` (bot card memory) are
 * SERVER-ONLY — redactFor strips both from every view. `revealed` holds the
 * current transient flips, which are public by design (everyone sees the
 * cards currently face up).
 *
 * Move protocol: a move = { cell } — the FIRST flip of the turn opens it
 * (revealed), the SECOND flip resolves the pair (match/miss). Turn stays on
 * the same seat between its two flips. All bots share `botMemory` updated on
 * every reveal (fairness: tier caps how much each bot retains).
 */

export interface MemState {
  cols: number;
  rows: number;
  /** cell -> value (1..pairs), SERVER-ONLY. */
  deck: number[];
  /** cell -> seat index + 1 for claimed pairs (public). */
  claimed: number[];
  scores: number[];
  /** Current transient flips: [{cell, value}] — 0, 1 or 2 entries (public). */
  revealed: Array<{ cell: number; value: number }>;
  /** Bot card memory: seat -> [{cell, value}] — SERVER-ONLY. */
  botMemory: Record<string, Array<{ cell: number; value: number }>>;
  turn: number;
  seatCount: number;
}

export const MEM_PAIR_VALUES = 18; // 36 cards -> 6x6 grid

export function memGeometry(seatCount: number): { cols: number; rows: number } {
  return { cols: 6, rows: 6 }; // same grid for 3 and 4 seats
}

/** Fisher–Yates using the injected rng (service passes Math.random). */
export function memShuffledDeck(seatCount: number, rng: () => number): number[] {
  const { cols, rows } = memGeometry(seatCount);
  const cells = cols * rows;
  const deck: number[] = [];
  for (let v = 1; v <= cells / 2; v++) {
    deck.push(v, v);
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  void rows;
  return deck;
}

export function memInitialState(seatCount: number, rng: () => number): MemState {
  const { cols, rows } = memGeometry(seatCount);
  const botMemory: Record<string, Array<{ cell: number; value: number }>> = {};
  for (let s = 1; s < seatCount; s++) {
    botMemory[String(s)] = []; // bots populate memory as cards are revealed
  }
  return {
    cols,
    rows,
    deck: memShuffledDeck(seatCount, rng),
    claimed: Array<number>(cols * rows).fill(0),
    scores: Array<number>(seatCount).fill(0),
    revealed: [],
    botMemory,
    turn: 0,
    seatCount,
  };
}

export function memValidateMove(state: MemState, cell: number): string | null {
  if (!Number.isInteger(cell) || cell < 0 || cell >= state.deck.length) return 'Cell out of range.';
  if (state.claimed[cell] !== 0) return 'That card is already claimed.';
  if (state.revealed.some((r) => r.cell === cell)) return 'That card is already face up.';
  return null;
}

function remember(state: MemState, cell: number, value: number): void {
  for (let s = 1; s < state.seatCount; s++) {
    const key = String(s);
    const mem = state.botMemory[key] ?? [];
    if (!mem.some((m) => m.cell === cell)) mem.push({ cell, value });
    const cap = s % 3 === 0 ? 4 : s % 3 === 1 ? 12 : 8; // per-seat retention cap
    state.botMemory[key] = mem.slice(-cap);
  }
}

/** Apply one flip (1st opens, 2nd resolves). Mutates a copy, returns it. */
export function memApplyFlip(state: MemState, seat: number, cell: number): MemState {
  const next: MemState = {
    ...state,
    claimed: state.claimed.slice(),
    scores: state.scores.slice(),
    revealed: state.revealed.map((r) => ({ ...r })),
    botMemory: JSON.parse(JSON.stringify(state.botMemory)),
  };
  const value = next.deck[cell];
  next.revealed.push({ cell, value });
  remember(next, cell, value);

  if (next.revealed.length === 2) {
    const [a, b] = next.revealed;
    if (a.value === b.value) {
      // MATCH: claim both, score, clear reveals, SAME seat continues.
      next.claimed[a.cell] = seat + 1;
      next.claimed[b.cell] = seat + 1;
      next.scores[seat] += 1;
      next.revealed = [];
      // turn unchanged — the seat flips again (engine keeps turn)
    } else {
      // MISS: reveals clear (cards flip back), turn passes.
      next.revealed = [];
      next.turn = (seat + 1) % state.seatCount;
    }
  }
  // first flip: turn stays on the seat
  return next;
}

export function memIsOver(state: MemState): boolean {
  return state.claimed.every((c) => c !== 0);
}

/** Placement: most pairs 1st; ties share rank. */
export function memPlacement(scores: number[]): { seat: number; rank: number }[] {
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

/**
 * Bot flip: hard/medium use botMemory to complete a known pair; otherwise a
 * random unknown cell. (Bots only use their capped memory — never the deck.)
 */
export function memBotFlip(
  state: MemState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): number {
  const free: number[] = [];
  for (let i = 0; i < state.deck.length; i++) {
    if (state.claimed[i] === 0 && !state.revealed.some((r) => r.cell === i)) free.push(i);
  }
  if (free.length === 0) return -1;

  const mem = state.botMemory[String(seat)] ?? [];
  const knownFree = mem.filter((m) => free.includes(m.cell));

  // If one card is already revealed this turn, look for its partner in memory.
  if (state.revealed.length === 1) {
    const openValue = state.revealed[0].value;
    const partner = knownFree.find((m) => m.value === openValue);
    if (partner && (tier === 'hard' || (tier === 'medium' && free.length % 2 === 0))) {
      return partner.cell;
    }
    return free[(free.length * 7 + seat * 3) % free.length];
  }

  // First flip: hard prefers a value it knows twice (a sure pair).
  if (tier === 'hard') {
    for (const m of knownFree) {
      const twin = knownFree.find((o) => o !== m && o.value === m.value);
      if (twin) return m.cell; // flip the first; the partner is remembered
    }
  }
  return free[(free.length * 11 + seat * 5) % free.length];
}
