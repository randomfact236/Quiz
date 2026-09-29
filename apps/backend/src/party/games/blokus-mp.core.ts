/**
 * Blokus 4P (F44, Build 10) — PURE core, backend-owned.
 *
 * THE four-player original: 20×20 grid, four full 21-piece sets (1 square,
 * 2 dominoes, 2 tri-ominoes, 5 tetrominoes, 11 pentominoes — 89 squares per
 * seat). Placement rules: first piece touches your corner cell; after that a
 * new piece must touch one of your OWN pieces corner-to-corner only (never
 * edge-to-edge); no overlap. When a seat has no legal placement it passes;
 * when ALL seats pass consecutively the game ends. Score = placed squares,
 * +15 bonus if you placed ALL 21 pieces, −1 per unplaced square is NOT used
 * (documented simplified scoring: squares placed + all-piece bonus).
 *
 * Piece canon: the 21 polyominoes by cell count [1,2,2,3,3,4×5,5×11]. Each
 * piece is stored as a normalized cell list + rotation/reflection generated
 * at runtime from base shapes (deduped) — rules constants, not content.
 *
 * Move protocol: { piece: number (0..20), rot: 0..7 (r×f index), r, c } —
 * rot encodes rotate 0-3 × flip 0-1 applied to the base cells; (r,c) is the
 * top-left anchor of the rotated bounding box.
 */

export const BLK_SIZE = 20;
export const BLK_PIECES = 21;
export const BLK_CORNERS: ReadonlyArray<[number, number]> = [
  [0, 0],
  [0, BLK_SIZE - 1],
  [BLK_SIZE - 1, 0],
  [BLK_SIZE - 1, BLK_SIZE - 1],
];

export interface BlkState {
  grid: number[][]; // seat index + 1, or 0
  hands: number[][]; // remaining piece ids per seat (0..20)
  turn: number;
  seatCount: number;
  passStreak: number;
  placements: number[]; // squares placed per seat
}

/** Base 21 shapes as normalized [r,c] lists (canonical pentomino letters). */
const RAW_SHAPES: number[][][] = [
  [[0, 0]], // 1 monomino
  [
    [0, 0],
    [0, 1],
  ], // domino
  [
    [0, 0],
    [1, 0],
  ], // domino (vertical — distinct under no-rotation? dedup merges)
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ], // I3
  [
    [0, 0],
    [1, 0],
    [0, 1],
  ], // V3
  // 5 tetrominoes (O, I, T, L, S)
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ],
  [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
  ],
  // 11 pentominoes (F, I, L, N, P, T, U, V, W, X, Z)
  [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [3, 1],
  ],
  [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 0],
    [2, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
    [2, 3],
  ],
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
  ],
];

function normalize(cells: Array<[number, number]>): Array<[number, number]> {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  const out = cells.map(([r, c]) => [r - minR, c - minC] as [number, number]);
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return out;
}

function keyOf(cells: Array<[number, number]>): string {
  return normalize(cells)
    .map((c) => c[0] + ',' + c[1])
    .join('|');
}

function rotate(cells: Array<[number, number]>, size: number): Array<[number, number]> {
  return normalize(cells.map(([r, c]) => [c, size - 1 - r] as [number, number]));
}

function reflect(cells: Array<[number, number]>, size: number): Array<[number, number]> {
  return normalize(cells.map(([r, c]) => [r, size - 1 - c] as [number, number]));
}

/** All distinct orientations of the 11 asymmetric pentominoes + 5 tetrominoes. */
export function blkOrientations(pieceId: number): Array<Array<[number, number]>> {
  const base = RAW_SHAPES[pieceId];
  const seen = new Set<string>();
  const out: Array<Array<[number, number]>> = [];
  let cur = normalize(base as Array<[number, number]>);
  for (let rot = 0; rot < 4; rot++) {
    for (const flip of [false, true]) {
      const cand = flip ? reflect(cur, 6) : cur;
      const k = keyOf(cand);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(cand);
      }
    }
    cur = rotate(cur, 6);
  }
  return out;
}

export function blkPieceArea(pieceId: number): number {
  return RAW_SHAPES[pieceId].length;
}

/** 21 piece ids grouped by size: piece 0 = 1 cell, 1-2 = 2, 3-4 = 3, 5-9 = 4, 10-20 = 5. */
export function blkPieceSizes(): number[] {
  return RAW_SHAPES.map((s) => s.length);
}

export function blkInitialState(seatCount: number): BlkState {
  void seatCount;
  return {
    grid: Array.from({ length: BLK_SIZE }, () => Array<number>(BLK_SIZE).fill(0)),
    hands: [
      Array.from({ length: BLK_PIECES }, (_, i) => i),
      Array.from({ length: BLK_PIECES }, (_, i) => i),
      Array.from({ length: BLK_PIECES }, (_, i) => i),
      Array.from({ length: BLK_PIECES }, (_, i) => i),
    ],
    turn: 0,
    seatCount: 4,
    passStreak: 0,
    placements: [0, 0, 0, 0],
  };
}

/** Rotate+reflect base cells by rot index (0..7: 4 rotations × flip). */
export function blkOrientedCells(pieceId: number, rot: number): Array<[number, number]> {
  const all = blkOrientations(pieceId);
  return all[rot % all.length];
}

export function blkValidateMove(
  state: BlkState,
  seat: number,
  move: { piece: number; rot: number; r: number; c: number }
): string | null {
  const hand = state.hands[seat];
  if (!hand.includes(move.piece)) return 'You already placed that piece.';
  const cells = blkOrientedCells(move.piece, move.rot);
  let touchesCornerOwn = false;
  for (const [dr, dc] of cells) {
    const r = move.r + dr;
    const c = move.c + dc;
    if (r < 0 || c < 0 || r >= BLK_SIZE || c >= BLK_SIZE) return 'Piece falls off the board.';
    if (state.grid[r][c] !== 0) return 'Overlap.';
    // edge contact with own colour is illegal
    for (const [er, ec] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nr = r + er;
      const nc = c + ec;
      if (nr >= 0 && nc >= 0 && nr < BLK_SIZE && nc < BLK_SIZE && state.grid[nr][nc] === seat + 1) {
        return 'Pieces may touch only corner-to-corner.';
      }
    }
    // corner contact with own colour
    for (const [ar, ac] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]) {
      const nr = r + ar;
      const nc = c + ac;
      if (nr >= 0 && nc >= 0 && nr < BLK_SIZE && nc < BLK_SIZE && state.grid[nr][nc] === seat + 1) {
        touchesCornerOwn = true;
      }
    }
    // first move: must cover the seat's corner cell
    const [cr, cc] = BLK_CORNERS[seat];
    if (state.placements[seat] === 0 && r === cr && c === cc) touchesCornerOwn = true;
  }
  if (!touchesCornerOwn) {
    return state.placements[seat] === 0
      ? 'Your first piece must cover your corner.'
      : 'Pieces must touch your own pieces corner-to-corner.';
  }
  return null;
}

export function blkApplyMove(
  state: BlkState,
  seat: number,
  move: { piece: number; rot: number; r: number; c: number }
): BlkState {
  const grid = state.grid.map((row) => row.slice());
  const cells = blkOrientedCells(move.piece, move.rot);
  for (const [dr, dc] of cells) grid[move.r + dr][move.c + dc] = seat + 1;
  const hands = state.hands.map((h, i) =>
    i === seat ? h.filter((id) => id !== move.piece) : h.slice()
  );
  const placements = state.placements.slice();
  placements[seat] += cells.length;
  return { ...state, grid, hands, placements, turn: (seat + 1) % 4 };
}

export function blkHasAnyMove(state: BlkState, seat: number): boolean {
  const hand = state.hands[seat];
  for (const piece of hand) {
    const cells = blkOrientedCells(piece, 0);
    const maxR = Math.max(...cells.map((c) => c[0]));
    const maxC = Math.max(...cells.map((c) => c[1]));
    for (let r = -maxR; r < BLK_SIZE; r++) {
      for (let c = -maxC; c < BLK_SIZE; c++) {
        if (blkValidateMove(state, seat, { piece, rot: 0, r, c }) === null) return true;
      }
    }
  }
  return false;
}

export function blkIsOver(state: BlkState): boolean {
  return state.passStreak >= state.seatCount;
}

export function blkApplyPass(state: BlkState): BlkState {
  return { ...state, passStreak: state.passStreak + 1, turn: (state.turn + 1) % state.seatCount };
}

export function blkApplyTurnWithPassTracking(
  state: BlkState,
  seat: number,
  moved: boolean
): BlkState {
  const passStreak = moved ? 0 : state.passStreak + 1;
  const turn = (seat + 1) % state.seatCount;
  return { ...state, passStreak, turn };
}

export function blkScore(state: BlkState, seat: number): number {
  let score = state.placements[seat];
  if (state.hands[seat].length === 0) score += 15;
  return score;
}

export function blkPlacement(state: BlkState): { seat: number; rank: number }[] {
  const order = [0, 1, 2, 3]
    .map((seat) => ({ seat, s: blkScore(state, seat) }))
    .sort((a, b) => b.s - a.s || a.seat - b.seat);
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

/** Bot placement: legal cells for a piece orientation, scored greedily. */
export function blkBotMove(
  state: BlkState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): { piece: number; rot: number; r: number; c: number } | null {
  const hand = state.hands[seat];
  let best: { piece: number; rot: number; r: number; c: number; score: number } | null = null;
  for (const piece of hand) {
    const area = blkPieceArea(piece);
    for (let rot = 0; rot < 8; rot++) {
      const cells = blkOrientedCells(piece, rot);
      const maxR = Math.max(...cells.map((c) => c[0]));
      const maxC = Math.max(...cells.map((c) => c[1]));
      for (let r = -maxR; r < BLK_SIZE; r++) {
        for (let c = -maxC; c < BLK_SIZE; c++) {
          if (blkValidateMove(state, seat, { piece, rot, r, c }) !== null) continue;
          const score =
            area * 10 +
            (tier === 'easy' ? 0 : BLK_SIZE - Math.abs(r - 10) + (BLK_SIZE - Math.abs(c - 10)));
          if (!best || score > best.score) best = { piece, rot, r, c, score };
          if (tier === 'easy') return { piece, rot, r, c };
        }
      }
    }
    if (tier === 'medium' && best) break; // medium: first piece with best spot
  }
  if (!best) return null;
  return { piece: best.piece, rot: best.rot, r: best.r, c: best.c };
}
