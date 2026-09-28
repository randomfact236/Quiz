/**
 * Quad-OXO (F11, MP1 Wave A): 4-player four-in-a-row on a 5×5 grid.
 *
 * PURE MODEL — imported by both the party backend adapter (authoritative)
 * and the frontend game page (hints/UI). No I/O, no randomness: the
 * empty-board rule holds (5×5 grid starts empty; every mark is a player's
 * decision; bots are just players who pick moves by policy).
 *
 * Players: up to 4 seats (humans/bots/closed). Each seat owns ONE symbol.
 * Symbols: A ● B ▲ C ■ D ★ (letters in code, glyphs in the UI).
 * Move: place your symbol on any empty cell (0..24).
 * Win: FOUR of your own symbols in a row (row/col/diagonal). First line wins;
 *   all other seats share the remaining rank by placement order.
 * Board full with no line: shared 1st for everyone still standing (rare).
 */

export const QUAD_BOARD_CELLS = 25;
export const QUAD_LINE_LEN = 4;

/** All 4-in-a-row lines on a 5×5 grid: 5 rows + 5 cols + 2 main diagonals +
 *  8 off-diagonals of length 4 = 20 lines. */
export const QUAD_LINES: readonly (readonly number[])[] = (() => {
  const lines: number[][] = [];
  const idx = (r: number, c: number): number => r * 5 + c;
  // rows
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c <= 1; c++)
      lines.push([idx(r, c), idx(r, c + 1), idx(r, c + 2), idx(r, c + 3)]);
  }
  // cols
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r <= 1; r++)
      lines.push([idx(r, c), idx(r + 1, c), idx(r + 2, c), idx(r + 3, c)]);
  }
  // diagonals ↘
  for (let r = 0; r <= 1; r++) {
    for (let c = 0; c <= 1; c++) {
      lines.push([idx(r, c), idx(r + 1, c + 1), idx(r + 2, c + 2), idx(r + 3, c + 3)]);
    }
  }
  // diagonals ↙
  for (let r = 0; r <= 1; r++) {
    for (let c = 3; c <= 4; c++) {
      lines.push([idx(r, c), idx(r + 1, c - 1), idx(r + 2, c - 2), idx(r + 3, c - 3)]);
    }
  }
  return lines;
})();

export type QuadSymbol = 'A' | 'B' | 'C' | 'D';
export const QUAD_SYMBOLS: readonly QuadSymbol[] = ['A', 'B', 'C', 'D'];

export interface QuadState {
  cells: (QuadSymbol | null)[]; // 25
  /** How many seats actively play (2..4); closed seats are skipped. */
  playerCount: number;
}

export interface QuadPlacement {
  seat: number;
  rank: number;
}

/** All legal moves for the given seat's symbol (empty cells). */
export function quadLegalMoves(state: QuadState): number[] {
  const out: number[] = [];
  for (let i = 0; i < QUAD_BOARD_CELLS; i++) {
    if (state.cells[i] === null) out.push(i);
  }
  return out;
}

export function quadValidateMove(state: QuadState, cell: number): string | null {
  if (!Number.isInteger(cell) || cell < 0 || cell >= QUAD_BOARD_CELLS) return 'Cell out of range.';
  if (state.cells[cell] !== null) return 'That cell is taken.';
  return null;
}

/** Apply a move (state is treated immutably); returns the next state. */
export function quadApplyMove(state: QuadState, seat: number, cell: number): QuadState {
  const cells = [...state.cells];
  cells[cell] = QUAD_SYMBOLS[seat] ?? 'A';
  return { ...state, cells };
}

/** Did `seat`'s symbol just complete a line? Returns the winning line or null. */
export function quadWinningLine(state: QuadState, seat: number): readonly number[] | null {
  const sym = QUAD_SYMBOLS[seat];
  if (!sym) return null;
  for (const line of QUAD_LINES) {
    const [a, b, c, d] = line;
    if (
      state.cells[a] === sym &&
      state.cells[b] === sym &&
      state.cells[c] === sym &&
      state.cells[d] === sym
    ) {
      return line;
    }
  }
  return null;
}

export function quadIsFull(state: QuadState): boolean {
  return state.cells.every((c) => c !== null);
}

/**
 * Placement for a finished table:
 *  - line-maker → rank 1
 *  - everyone else → rank 2 (shared), ordered by seat for stable display
 *  - full board, no line → everyone rank 1 (shared win; near-impossible in 4P)
 */
export function quadPlacement(seatsInPlay: number[], winnerSeat: number | null): QuadPlacement[] {
  const order = [...seatsInPlay].sort((a, b) => a - b);
  if (winnerSeat === null) return order.map((seat) => ({ seat, rank: 1 }));
  return order.map((seat) => ({ seat, rank: seat === winnerSeat ? 1 : 2 }));
}

/**
 * AI policies (tiers mirror the family standard). Pure move pickers:
 * they receive the visible state and return a legal cell.
 */
export function quadAiMove(
  state: QuadState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): number {
  const legal = quadLegalMoves(state);
  if (legal.length === 0) return -1;
  const sym = QUAD_SYMBOLS[seat];

  if (tier === 'easy') {
    // Loose play: mostly random, takes an instant win only half the time.
    const win = legal.find((c) => quadWinningLine(quadApplyMove(state, seat, c), seat) !== null);
    if (win !== undefined && (seat + legal.length) % 2 === 0) return win;
    return legal[(seat * 7 + legal.length * 3) % legal.length];
  }

  // medium & hard share the priority ladder; hard looks one step further.
  // 1) Win now.
  const win = legal.find((c) => quadWinningLine(quadApplyMove(state, seat, c), seat) !== null);
  if (win !== undefined) return win;

  // 2) Block: a rival with 3-in-line and an open completing cell.
  const threats: number[] = [];
  for (const line of QUAD_LINES) {
    const counts = new Map<string, number>();
    let empty = -1;
    for (const i of line) {
      const v = state.cells[i];
      if (v === null) empty = i;
      else counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    if (empty >= 0 && counts.size === 1) {
      const [who, n] = [...counts.entries()][0];
      if (n === 3 && who !== sym) threats.push(empty);
    }
  }
  if (threats.length > 0) return threats[0];

  // 3) Build own line: prefer cells that extend own 2-in-line.
  let best = legal[0];
  let bestScore = -1;
  for (const c of legal) {
    const after = quadApplyMove(state, seat, c);
    let score = 0;
    for (const line of QUAD_LINES) {
      if (!line.includes(c)) continue;
      const own = line.filter((i) => state.cells[i] === sym).length;
      if (own >= 1) score += own * own;
    }
    if (tier === 'hard') {
      // Deny rivals' growth cells a little too.
      for (const line of QUAD_LINES) {
        if (!line.includes(c)) continue;
        const rivals = line.filter((i) => state.cells[i] !== null && state.cells[i] !== sym).length;
        if (rivals >= 2) score += 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
