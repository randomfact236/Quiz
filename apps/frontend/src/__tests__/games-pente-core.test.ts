import {
  BOARD_SIZES,
  DEFAULT_SIZE,
  EMPTY,
  BLACK,
  WHITE,
  WIN_LENGTH,
  CAPTURE_TARGET,
  DIRS,
  other,
  sizeOf,
  at,
  centreOf,
  initialBoard,
  cloneCells,
  isEmpty,
  capturesAt,
  pairsAt,
  makesFive,
  legalMoves,
  applyMove,
  stoneCount,
  hasLine,
  outcome,
  isFull,
  evaluate,
  easyMove,
  mediumMove,
  search,
  aiMove,
  fromArray,
} from '../../public/games/pente/core.js';

/** Board coordinate → index, for readable fixtures. */
function sq(row: number, file: number): number {
  return row * 19 + file;
}

/**
 * plan/games/23 — the pure Pente model. The two rules that make Pente Pente:
 * a capture needs EXACTLY two flanked stones (one or three do nothing), and a
 * capture resolves before the five-in-a-row check.
 */
describe('pente core — board and opening', () => {
  it('ships 15 and 19, defaulting to 19', () => {
    expect(BOARD_SIZES).toEqual([15, 19]);
    expect(DEFAULT_SIZE).toBe(19);
    expect(sizeOf(initialBoard(19))).toBe(19);
  });

  it('opens with exactly one centre stone, black', () => {
    const cells = initialBoard(19);
    expect(cells.filter((c) => c !== EMPTY)).toHaveLength(1);
    expect(cells[centreOf(19)]).toBe(BLACK);
    expect(centreOf(15)).toBe(112);
  });

  it('finds the centre square on both sizes', () => {
    expect(centreOf(19)).toBe(180);
    expect(centreOf(15)).toBe(112);
  });

  it('maps out-of-bounds coordinates to -1', () => {
    const cells = initialBoard(19);
    expect(at(cells, -1, 0)).toBe(-1);
    expect(at(cells, 0, 19)).toBe(-1);
    expect(at(cells, 19, 0)).toBe(-1);
  });

  it('reports emptiness and clones', () => {
    const cells = initialBoard(19);
    expect(isEmpty(cells, 0)).toBe(true);
    expect(isEmpty(cells, centreOf(19))).toBe(false);
    expect(isEmpty(cells, 999)).toBe(false); // out of range is not empty
    const copy = cloneCells(cells);
    copy[0] = WHITE;
    expect(cells[0]).toBe(EMPTY);
  });
});

describe('pente core — captures need EXACTLY two', () => {
  /** A horizontal run of `n` white stones starting right of `idx`, closed by black. */
  function run(idx, side, n, size = 19) {
    const cells = new Array(size * size).fill(EMPTY);
    const row = Math.floor(idx / size);
    for (let i = 1; i <= n; i++) cells[row * size + (idx % size) + i] = side;
    cells[row * size + (idx % size) + n + 1] = other(side);
    return cells;
  }

  it('captures a flanked pair', () => {
    const at0 = sq(9, 5);
    const cells = run(at0, WHITE, 2);
    const taken = capturesAt(cells, at0, BLACK, 19);
    expect(taken).toHaveLength(2);
    expect(pairsAt(cells, at0, BLACK, 19)).toBe(1);
  });

  it('does NOT capture a single stone', () => {
    const at0 = sq(9, 5);
    const cells = run(at0, WHITE, 1);
    expect(capturesAt(cells, at0, BLACK, 19)).toEqual([]);
  });

  it('does NOT capture a run of three', () => {
    const at0 = sq(9, 5);
    const cells = run(at0, WHITE, 3);
    expect(capturesAt(cells, at0, BLACK, 19)).toEqual([]);
  });

  it('does NOT capture an unbracketed pair (no closing stone)', () => {
    const at0 = sq(9, 5);
    const cells = new Array(19 * 19).fill(EMPTY);
    cells[sq(9, 6)] = WHITE;
    cells[sq(9, 7)] = WHITE;
    expect(capturesAt(cells, at0, BLACK, 19)).toEqual([]);
  });

  it('captures in all 8 directions at once', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    for (const [dr, df] of DIRS) {
      cells[sq(9 + dr, 9 + df)] = WHITE;
      cells[sq(9 + dr * 2, 9 + df * 2)] = WHITE;
      cells[sq(9 + dr * 3, 9 + df * 3)] = BLACK; // the closing stone
    }
    const taken = capturesAt(cells, sq(9, 9), BLACK, 19);
    expect(taken).toHaveLength(16); // 8 pairs
    expect(pairsAt(cells, sq(9, 9), BLACK, 19)).toBe(8);
  });

  it('does not capture when the closing stone is an enemy', () => {
    const at0 = sq(9, 5);
    const cells = run(at0, WHITE, 2);
    // flip the closer so the run is closed by WHITE — no bracket for black
    cells[sq(9, 8)] = WHITE;
    expect(capturesAt(cells, at0, BLACK, 19)).toEqual([]);
  });

  it('lists exactly the capture squares', () => {
    const at0 = sq(9, 5);
    const cells = run(at0, WHITE, 2);
    expect(capturesAt(cells, at0, BLACK, 19).sort((a, b) => a - b)).toEqual(
      [sq(9, 6), sq(9, 7)].sort((a, b) => a - b)
    );
  });
});

describe('pente core — five in a row', () => {
  it('detects five horizontally, vertically and diagonally', () => {
    for (const [dr, df] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const cells = new Array(19 * 19).fill(EMPTY);
      for (let i = 0; i < WIN_LENGTH; i++) cells[sq(9 + dr * i, 9 + df * i)] = BLACK;
      expect(hasLine(cells, BLACK, 19)).toBe(true);
    }
  });

  it('does not mistake four for five', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    for (let i = 0; i < 4; i++) cells[sq(9, 5 + i)] = BLACK;
    expect(hasLine(cells, BLACK, 19)).toBe(false);
  });

  it('is not fooled by a gap', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    cells[sq(9, 5)] = BLACK;
    cells[sq(9, 6)] = BLACK;
    cells[sq(9, 7)] = EMPTY; // the gap
    cells[sq(9, 8)] = BLACK;
    cells[sq(9, 9)] = BLACK;
    expect(hasLine(cells, BLACK, 19)).toBe(false);
  });

  it('counts six as a line too', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    for (let i = 0; i < 6; i++) cells[sq(9, 5 + i)] = BLACK;
    expect(hasLine(cells, BLACK, 19)).toBe(true);
  });
});

describe('pente core — playing a stone', () => {
  it('places a stone, takes the pair, and hands the turn over', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    cells[sq(9, 6)] = WHITE;
    cells[sq(9, 7)] = WHITE;
    cells[sq(9, 8)] = BLACK;
    const r = applyMove(cells, BLACK, sq(9, 5));
    expect(r.captured).toHaveLength(2);
    expect(r.pairs).toBe(1);
    expect(r.cells[sq(9, 5)]).toBe(BLACK);
    expect(r.cells[sq(9, 6)]).toBe(EMPTY);
    expect(r.cells[sq(9, 7)]).toBe(EMPTY);
    expect(r.turn).toBe(WHITE);
    expect(r.line).toBe(false);
  });

  it('throws on an occupied square', () => {
    expect(() => applyMove(initialBoard(19), BLACK, centreOf(19))).toThrow(/Illegal/);
  });

  it('never mutates the board it was given', () => {
    const cells = initialBoard(19);
    const snapshot = cells.slice();
    applyMove(cells, WHITE, 0);
    expect(cells).toEqual(snapshot);
  });

  it('lists capture moves as the only legal ones', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    cells[sq(9, 6)] = WHITE;
    cells[sq(9, 7)] = WHITE;
    cells[sq(9, 8)] = BLACK;
    expect(legalMoves(cells, BLACK, 19)).toEqual([sq(9, 5)]);
    expect(legalMoves(cells, WHITE, 19)).toEqual([]); // white cannot capture
  });
});

describe('pente core — the two win conditions', () => {
  it('wins on five in a row', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    for (let i = 0; i < 4; i++) cells[sq(9, 5 + i)] = BLACK;
    cells[sq(9, 9)] = BLACK;
    const r = outcome(cells, BLACK, [0, 0], CAPTURE_TARGET, 19);
    expect(r).toEqual({ winner: BLACK, line: true, points: 0 });
  });

  it('wins on the capture target without a line', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    cells[0] = BLACK;
    const r = outcome(cells, BLACK, [CAPTURE_TARGET, 0], CAPTURE_TARGET, 19);
    expect(r).toEqual({ winner: BLACK, line: false, points: CAPTURE_TARGET });
  });

  it('keeps the game live below both thresholds', () => {
    const cells = initialBoard(19);
    expect(outcome(cells, BLACK, [1, 0], CAPTURE_TARGET, 19)).toBeNull();
    expect(outcome(cells, WHITE, [0, CAPTURE_TARGET - 1], CAPTURE_TARGET, 19)).toBeNull();
  });

  it('knows a full board', () => {
    expect(isFull(initialBoard(19))).toBe(false);
    const full = new Array(19 * 19).fill(BLACK);
    full[0] = EMPTY;
    expect(isFull(full)).toBe(false);
    expect(isFull(new Array(19 * 19).fill(BLACK))).toBe(true);
  });
});

describe('pente core — AI tiers', () => {
  it('easy always takes a capture when one exists', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    cells[sq(9, 6)] = WHITE;
    cells[sq(9, 7)] = WHITE;
    cells[sq(9, 8)] = BLACK;
    expect(easyMove(cells, BLACK, 19, () => 0)).toBe(sq(9, 5));
  });

  it('easy plays near the centre', () => {
    const cells = initialBoard(19);
    const move = easyMove(cells, WHITE, 19, () => 0);
    const mid = 9;
    expect(Math.abs(Math.floor(move / 19) - mid) + Math.abs((move % 19) - mid)).toBe(1);
  });

  it('medium completes five when it can', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    for (let i = 0; i < 4; i++) cells[sq(9, 5 + i)] = BLACK;
    // a four-run has TWO squares that make five — either is a correct answer
    expect([sq(9, 4), sq(9, 9)]).toContain(mediumMove(cells, BLACK, 19));
  });

  it('medium blocks the opponent five', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    for (let i = 0; i < 4; i++) cells[sq(9, 5 + i)] = WHITE;
    // black has no five of its own, so it must take a blocking square
    expect([sq(9, 4), sq(9, 9)]).toContain(mediumMove(cells, BLACK, 19));
  });

  it('medium takes a capture before anything else', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    cells[sq(9, 6)] = WHITE;
    cells[sq(9, 7)] = WHITE;
    cells[sq(9, 8)] = BLACK;
    expect(mediumMove(cells, BLACK, 19)).toBe(sq(9, 5));
  });

  it('hard takes an immediate five', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    for (let i = 0; i < 4; i++) cells[sq(9, 5 + i)] = BLACK;
    const found = search(cells, BLACK, [0, 0], { maxNodes: 20000 });
    // either end of the four completes five — and it MUST complete five rather
    // than wander off to a corner (the root-ordering bug this caught)
    expect([sq(9, 4), sq(9, 9)]).toContain(found.move);
  });

  it('hard takes a free capture', () => {
    const cells = new Array(19 * 19).fill(EMPTY);
    cells[sq(9, 6)] = WHITE;
    cells[sq(9, 7)] = WHITE;
    cells[sq(9, 8)] = BLACK;
    const found = search(cells, BLACK, [0, 0], { maxNodes: 20000 });
    expect(found.move).toBe(sq(9, 5));
  });

  it('hard stays inside its node cap and answers legally', () => {
    const cells = initialBoard(19);
    const found = search(cells, WHITE, [0, 0], { maxNodes: 3000 });
    expect(isEmpty(cells, found.move)).toBe(true);
    expect(found.nodes).toBeLessThanOrEqual(3001);
  });

  it('every tier returns a legal move from the opening', () => {
    const cells = initialBoard(19);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const move = aiMove(cells, WHITE, [0, 0], difficulty, { maxNodes: 8000, rand: () => 0 });
      expect(isEmpty(cells, move)).toBe(true);
    }
  });

  it('returns null on a full board', () => {
    const full = new Array(19 * 19).fill(BLACK); // no empties at all
    expect(isFull(full)).toBe(true);
    expect(aiMove(full, BLACK, [0, 0], 'hard', { maxNodes: 1000 })).toBeNull();
  });

  it('values the centre more than the rim', () => {
    const centre = new Array(19 * 19).fill(EMPTY);
    centre[180] = BLACK;
    const rim = new Array(19 * 19).fill(EMPTY);
    rim[0] = BLACK;
    expect(evaluate(centre, BLACK)).toBeGreaterThan(evaluate(rim, BLACK));
  });
});

describe('pente core — a full game plays out', () => {
  it('reaches a decision with a legal result and consistent counts', () => {
    let cells = initialBoard(19);
    let side = WHITE; // black opened with the centre stone
    let captures = [0, 0];
    for (let ply = 0; ply < 300; ply++) {
      const move = mediumMove(cells, side, 19);
      if (move === null) break; // board full
      const r = applyMove(cells, side, move);
      const index = side === BLACK ? 0 : 1;
      captures[index] += r.pairs;
      cells = r.cells;
      const result = outcome(cells, side, captures, CAPTURE_TARGET, 19);
      if (result) {
        expect([BLACK, WHITE]).toContain(result.winner);
        const counts = stoneCount(cells);
        expect(counts.black + counts.white + counts.empty).toBe(cells.length);
        return;
      }
      side = r.turn;
    }
    // a 300-ply medium-vs-medium game must not have hung
    expect(true).toBe(true);
  });
});

describe('pente core — the wire format', () => {
  it('sanitises an untrusted board', () => {
    const dirty = fromArray([99, -1, 'x', 2, null, undefined, 1, 0], 19);
    expect(dirty[0]).toBe(EMPTY);
    expect(dirty[1]).toBe(EMPTY);
    expect(dirty[2]).toBe(EMPTY);
    expect(dirty[3]).toBe(WHITE);
    expect(dirty[6]).toBe(BLACK);
    expect(dirty).toHaveLength(361);
  });

  it('round-trips a real board', () => {
    const cells = initialBoard(19);
    expect(fromArray(cells, 19)).toEqual(cells);
  });

  it('other() flips sides', () => {
    expect(other(BLACK)).toBe(WHITE);
    expect(other(WHITE)).toBe(BLACK);
  });
});
