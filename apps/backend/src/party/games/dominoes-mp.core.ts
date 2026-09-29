/**
 * Dominoes Block MP (T38 3P + F34 4P, ONE core) — PURE core, backend-owned.
 *
 * The classic block game: double-six set (28 tiles), 7 tiles per hand,
 * players extend either end of a single line; you may only play a tile whose
 * pips match an open end. If you cannot play you draw from the boneyard
 * (draw variant, documented house rule) until it is empty, then pass. The
 * game ends when someone empties their hand (domino!) or ALL seats pass in
 * a row (blocked). Emptying your hand wins outright; a blocked game ranks
 * by lowest pip count.
 *
 * RNG: the shuffle is server-side (owner approved the dice/card tier
 * 2026-09-29). Tiles are pure numbers — no content, no themes.
 *
 * Tile model: [a, b] pips, a <= b. State keeps the line as an ordered array
 * of tiles as laid (with each tile stored in the orientation it was played).
 * Open ends = line[0].a (left) and line[line.length-1].b (right).
 *
 * SECRETS: other seats' hands — hands are per-seat arrays; the ADAPTER
 * redactFor keeps only the viewer's hand and counts for the rest (documented
 * adapter contract, like Memory's deck).
 */

export const DOM_SET_MAX = 6; // double-six
export const DOM_HAND_SIZE = 7;

export type Domino = [number, number];

export interface DomState {
  /** Boneyard: shuffled remaining tiles. SERVER-ONLY (redacted to a count). */
  boneyard: Domino[];
  /** hands[seat] — this seat's tiles. Redacted per viewer. */
  hands: Domino[][];
  /** The line: tiles as laid, in play orientation. */
  line: Domino[];
  turn: number;
  seatCount: number;
  /** Consecutive seats that could not move (blocked ending). */
  passStreak: number;
  /** true when a seat has emptied its hand (game over, domino). */
  domino: number | null;
  /** Last action summary for the UI: seat, kind. */
  lastAction: { seat: number; kind: 'play' | 'draw' | 'pass'; side?: 'left' | 'right' } | null;
}

/** All 28 tiles of the double-six set, shuffled with the injected rng. */
export function domShuffledSet(rng: () => number): Domino[] {
  const tiles: Domino[] = [];
  for (let a = 0; a <= DOM_SET_MAX; a++) for (let b = a; b <= DOM_SET_MAX; b++) tiles.push([a, b]);
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

export function domInitialState(seatCount: number, rng: () => number): DomState {
  const set = domShuffledSet(rng);
  const hands: Domino[][] = [];
  for (let s = 0; s < seatCount; s++)
    hands.push(set.slice(s * DOM_HAND_SIZE, (s + 1) * DOM_HAND_SIZE));
  return {
    boneyard: set.slice(seatCount * DOM_HAND_SIZE),
    hands,
    line: [],
    turn: 0,
    seatCount,
    passStreak: 0,
    domino: null,
    lastAction: null,
  };
}

export function domPips(hand: Domino[]): number {
  return hand.reduce((sum, t) => sum + t[0] + t[1], 0);
}

function openEnds(state: DomState): { left: number | null; right: number | null } {
  if (state.line.length === 0) return { left: null, right: null };
  return { left: state.line[0][0], right: state.line[state.line.length - 1][1] };
}

/** Legal moves: which tiles fit which end. First move: any tile. */
export function domLegalMoves(
  state: DomState,
  seat: number
): Array<{ tile: Domino; side: 'left' | 'right' }> {
  const hand = state.hands[seat];
  const out: Array<{ tile: Domino; side: 'left' | 'right' }> = [];
  const ends = openEnds(state);
  for (const tile of hand) {
    if (state.line.length === 0) {
      out.push({ tile, side: 'right' });
      continue;
    }
    if (tile[0] === ends.left || tile[1] === ends.left) out.push({ tile, side: 'left' });
    else if (tile[0] === ends.right || tile[1] === ends.right) out.push({ tile, side: 'right' });
  }
  return out;
}

/** A draw is legal when the seat has no playable tile and the boneyard has tiles. */
export function domCanDraw(state: DomState, seat: number): boolean {
  return domLegalMoves(state, seat).length === 0 && state.boneyard.length > 0;
}

export function domValidateMove(
  state: DomState,
  seat: number,
  move: { tile: Domino; side?: 'left' | 'right' } | { draw: true } | { pass: true }
): string | null {
  if (state.domino !== null) return 'The table has finished.';
  if ('draw' in (move as { draw?: true })) {
    if (!domCanDraw(state, seat)) return 'You can still play, or the boneyard is empty.';
    return null;
  }
  if ('pass' in (move as { pass?: true })) {
    if (domCanDraw(state, seat)) return 'Draw from the boneyard before passing.';
    if (domLegalMoves(state, seat).length > 0) return 'You have a legal tile — play it.';
    return null;
  }
  const m = move as { tile: Domino; side?: 'left' | 'right' };
  if (!Array.isArray(m.tile) || m.tile.length !== 2) return 'Malformed tile.';
  const idx = state.hands[seat].findIndex((t) => t[0] === m.tile[0] && t[1] === m.tile[1]);
  if (idx < 0) return 'That tile is not in your hand.';
  const legal = domLegalMoves(state, seat);
  const hit = legal.find(
    (l) => l.tile[0] === m.tile[0] && l.tile[1] === m.tile[1] && (!m.side || l.side === m.side)
  );
  if (!hit) return 'That tile does not match an open end.';
  return null;
}

/** Apply a play. Tile is oriented: laid tile keeps [x, y] where x faces the joint. */
export function domApplyPlay(
  state: DomState,
  seat: number,
  tile: Domino,
  side: 'left' | 'right'
): DomState {
  const hands = state.hands.map((h, i) =>
    i === seat ? h.filter((t) => !(t[0] === tile[0] && t[1] === tile[1])) : h.slice()
  );
  let line = state.line.slice();
  if (line.length === 0) {
    line = [[tile[0], tile[1]] as Domino];
  } else if (side === 'left') {
    const left = line[0][0];
    line = [[tile[0] === left ? tile[1] : tile[0], left] as Domino, ...line];
  } else {
    const right = line[line.length - 1][1];
    line = [...line, [right, tile[0] === right ? tile[1] : tile[0]] as Domino];
  }
  const domino = hands[seat].length === 0 ? seat : null;
  return {
    ...state,
    hands,
    line,
    turn: domino !== null ? seat : (seat + 1) % state.seatCount,
    passStreak: 0,
    domino,
    lastAction: { seat, kind: 'play', side },
  };
}

export function domApplyDraw(state: DomState, seat: number): DomState {
  if (state.boneyard.length === 0) return state;
  const boneyard = state.boneyard.slice();
  const tile = boneyard.pop() as Domino;
  const hands = state.hands.map((h, i) => (i === seat ? [...h, tile] : h.slice()));
  // drawing keeps the turn (house rule: you keep drawing/playing until done)
  return { ...state, boneyard, hands, passStreak: 0, lastAction: { seat, kind: 'draw' } };
}

export function domApplyPass(state: DomState, seat: number): DomState {
  return {
    ...state,
    turn: (seat + 1) % state.seatCount,
    passStreak: state.passStreak + 1,
    lastAction: { seat, kind: 'pass' },
  };
}

export function domIsOver(state: DomState): boolean {
  return state.domino !== null || state.passStreak >= state.seatCount;
}

/** Blocked game: lowest pip count 1st (ties share rank). Domino: that seat 1st. */
export function domPlacement(state: DomState): { seat: number; rank: number }[] {
  const scores = state.hands.map((h) => domPips(h));
  if (state.domino !== null) {
    const order = [
      state.domino,
      ...scores
        .map((_, s) => s)
        .filter((s) => s !== state.domino)
        .sort((a, b) => scores[a] - scores[b] || a - b),
    ];
    return order.map((seat, i) => ({ seat, rank: i + 1 }));
  }
  const order = scores.map((s, seat) => ({ seat, s })).sort((a, b) => a.s - b.s || a.seat - b.seat);
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

/** Bot: play a matching tile (prefer heaviest), else draw, else pass. */
export function domBotMove(
  state: DomState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): { tile: Domino; side: 'left' | 'right' } | { draw: true } | { pass: true } {
  const legal = domLegalMoves(state, seat);
  if (legal.length === 0) {
    if (domCanDraw(state, seat)) return { draw: true };
    return { pass: true };
  }
  if (tier === 'easy') return legal[(legal.length * 7 + seat) % legal.length];
  // medium/hard: play the heaviest matching tile (shed high pips)
  const best = legal
    .map((l) => ({ ...l, pips: l.tile[0] + l.tile[1] }))
    .sort((a, b) => b.pips - a.pips || a.tile[0] - b.tile[0]);
  return { tile: best[0].tile, side: best[0].side };
}
