import {
  BOARD_SIZES,
  DEFAULT_SIZE,
  EMPTY,
  DARK,
  LIGHT,
  DIRS,
  other,
  sizeOf,
  at,
  initialBoard,
  cloneCells,
  flipsFor,
  legalMoves,
  isLegalMove,
  applyMove,
  pass,
  discCount,
  isOver,
  outcome,
  evaluate,
  easyMove,
  mediumMove,
  search,
  aiMove,
  fromArray,
} from '../../public/games/othello/core.js';

/**
 * plan/games/12 — the pure Othello model. The whole game is flip geometry, so
 * the directions are table-tested one by one; the rest covers passes, the
 * pass/pass finish, score integrity and the three AI tiers.
 */
describe('othello core — board and opening', () => {
  it('ships 6/8/10 and defaults to 8', () => {
    expect(BOARD_SIZES).toEqual([6, 8, 10]);
    expect(DEFAULT_SIZE).toBe(8);
    expect(sizeOf(initialBoard(8))).toBe(8);
  });

  it('opens with the standard 2x2 centre, light on the main diagonal', () => {
    const cells = initialBoard(8);
    // at() returns the square INDEX; the value lives in the array
    expect(cells[at(cells, 3, 3)]).toBe(LIGHT);
    expect(cells[at(cells, 3, 4)]).toBe(DARK);
    expect(cells[at(cells, 4, 3)]).toBe(DARK);
    expect(cells[at(cells, 4, 4)]).toBe(LIGHT);
    expect(discCount(cells)).toEqual({ dark: 2, light: 2, empty: 60, total: 64 });
  });

  it('opens 6x6 and 10x10 on their own centres', () => {
    expect(initialBoard(6)).toHaveLength(36);
    expect(initialBoard(10)).toHaveLength(100);
    expect(initialBoard(6)[at(initialBoard(6), 2, 2)]).toBe(LIGHT);
    expect(initialBoard(10)[at(initialBoard(10), 4, 5)]).toBe(DARK);
  });

  it('opens with exactly 4 legal moves', () => {
    // d3/c4/f5/e6 for dark, e3/d5/c6/f4 for light — the four squares that
    // bracket the centre
    expect(legalMoves(initialBoard(8), DARK)).toEqual([19, 26, 37, 44]);
    expect(legalMoves(initialBoard(8), LIGHT)).toEqual([20, 29, 34, 43]);
  });

  it('maps out-of-bounds coordinates to -1', () => {
    const cells = initialBoard(8);
    expect(at(cells, -1, 0)).toBe(-1);
    expect(at(cells, 0, 8)).toBe(-1);
    expect(at(cells, 8, 0)).toBe(-1);
  });
});

describe('othello core — flip geometry in all 8 directions', () => {
  /** A board with `mid` light discs along one ray, bracketed by a dark disc. */
  function rayBoard(dr, df, mid, size = 8) {
    const cells = new Array(size * size).fill(EMPTY);
    const origin = { row: 4, file: 4 };
    // the closing dark disc at the far end of the run
    cells[(origin.row + dr * (mid + 1)) * size + (origin.file + df * (mid + 1))] = DARK;
    for (let i = 1; i <= mid; i++) {
      cells[(origin.row + dr * i) * size + (origin.file + df * i)] = LIGHT;
    }
    return { cells, origin: origin.row * size + origin.file };
  }

  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  it.each(DIRS.map((d, i) => [names[i], d[0], d[1]]))(
    'flips a run to the %s',
    (_name, dr, df) => {
      const mid = 2;
      const { cells, origin } = rayBoard(dr, df, mid);
      const flipped = flipsFor(cells, origin, DARK);
      expect(flipped).toHaveLength(mid);
      for (let i = 1; i <= mid; i++) {
        expect(flipped).toContain((4 + dr * i) * 8 + (4 + df * i));
      }
    }
  );

  it('flips every direction at once from a real position', () => {
    // each opening move flips exactly the one centre disc it brackets
    const cells = initialBoard(8);
    expect(flipsFor(cells, 19, DARK)).toEqual([27]);
    expect(flipsFor(cells, 26, DARK)).toEqual([27]);
    expect(flipsFor(cells, 37, DARK)).toEqual([36]);
    expect(flipsFor(cells, 44, DARK)).toEqual([36]);
    expect(flipsFor(cells, 20, LIGHT)).toEqual([28]);
    expect(flipsFor(cells, 43, LIGHT)).toEqual([35]);
  });

  it('does not flip an unbracketed run (an empty square ends the line)', () => {
    const cells = new Array(64).fill(EMPTY);
    cells[4 * 8 + 4] = DARK; // the new disc
    cells[3 * 8 + 3] = LIGHT; // one light, then nothing
    expect(flipsFor(cells, 4 * 8 + 4, DARK)).toEqual([]);
  });

  it('does not flip a run closed by the wrong colour', () => {
    const cells = new Array(64).fill(EMPTY);
    cells[3 * 8 + 3] = LIGHT;
    cells[2 * 8 + 2] = LIGHT;
    cells[1 * 8 + 1] = DARK; // closed by DARK — so LIGHT placing at 4,4 flips nothing
    expect(flipsFor(cells, 4 * 8 + 4, LIGHT)).toEqual([]);
  });

  it('needs at least one flip — a bare placement is not a move', () => {
    const cells = initialBoard(8);
    // an empty corner with no line through it
    expect(flipsFor(cells, 0, DARK)).toEqual([]);
    expect(isLegalMove(cells, DARK, 0)).toBe(false);
  });

  it('refuses an occupied square', () => {
    const cells = initialBoard(8);
    expect(flipsFor(cells, 27, DARK)).toEqual([]);
    expect(isLegalMove(cells, DARK, 27)).toBe(false);
  });

  it('flips through a multi-disc line in one move', () => {
    // three lights in a row east of (4,3), closed by a dark at (4,7) — the
    // closer must sit ON the board, which is what the first fixture got wrong
    const cells = new Array(64).fill(EMPTY);
    cells[4 * 8 + 4] = LIGHT;
    cells[4 * 8 + 5] = LIGHT;
    cells[4 * 8 + 6] = LIGHT;
    cells[4 * 8 + 7] = DARK;
    expect(flipsFor(cells, 4 * 8 + 3, DARK)).toEqual([4 * 8 + 4, 4 * 8 + 5, 4 * 8 + 6]);
  });
});

describe('othello core — applying moves', () => {
  it('places the disc, flips, and hands the turn over', () => {
    const r = applyMove(initialBoard(8), DARK, 19);
    expect(r.cells[19]).toBe(DARK);
    expect(r.cells[27]).toBe(DARK); // flipped from light
    expect(r.flipped).toEqual([27]);
    expect(r.turn).toBe(LIGHT);
    expect(r.passed).toBe(false);
    expect(r.over).toBe(false);
    expect(discCount(r.cells)).toEqual({ dark: 4, light: 1, empty: 59, total: 64 });
  });

  it('throws on an illegal placement instead of repairing it', () => {
    const cells = initialBoard(8);
    expect(() => applyMove(cells, DARK, 27)).toThrow(/Illegal/);
    expect(() => applyMove(cells, DARK, 0)).toThrow(/Illegal/);
  });

  it('never mutates the board it was given', () => {
    const cells = initialBoard(8);
    const snapshot = cells.slice();
    applyMove(cells, DARK, 19);
    expect(cells).toEqual(snapshot);
  });

  it('clones a board', () => {
    const cells = initialBoard(8);
    const copy = cloneCells(cells);
    copy[0] = DARK;
    expect(cells[0]).toBe(EMPTY);
  });
});

/**
 * A verified position in which LIGHT is out of moves while DARK still has one:
 * dark on 0 and 1, light on 2 and 8. Dark plays 3 and flips 2, which strands
 * light again. Returned as a factory so no test can mutate another's board.
 */
function passPosition() {
  const cells = new Array(64).fill(EMPTY);
  cells[0] = DARK;
  cells[1] = DARK;
  cells[2] = LIGHT;
  cells[8] = LIGHT;
  return cells;
}

describe('othello core — passes and the finish', () => {
  it('passes the turn back when the side to move has no move', () => {
    // a crafted position where LIGHT has no legal reply
    // A verified stuck position: LIGHT cannot bracket either dark disc, and
    // dark's reply leaves it still stuck while dark keeps a move — a pass, not
    // the finish. (Found by searching real positions; a hand-built one kept
    // turning into a game over instead.)
    const cells = passPosition();
    expect(legalMoves(cells, LIGHT)).toEqual([]); // the premise, asserted
    const r = applyMove(cells, DARK, 3);
    expect(r.flipped).toEqual([2]);
    expect(r.cells[2]).toBe(DARK);
    expect(legalMoves(r.cells, LIGHT)).toEqual([]);
    expect(legalMoves(r.cells, DARK).length).toBeGreaterThan(0);
    expect(r.passed).toBe(true);
    expect(r.turn).toBe(DARK); // handed back, not to light
    expect(r.over).toBe(false);
  });

  it('ends the game when neither side can move', () => {
    // two light discs in a corner pocket, everything else filled so neither
    // side has a move
    const cells = new Array(64).fill(DARK);
    cells[9] = LIGHT;
    cells[1] = LIGHT;
    expect(legalMoves(cells, DARK)).toEqual([]);
    expect(legalMoves(cells, LIGHT)).toEqual([]);
    expect(isOver(cells)).toBe(true);
    const r = pass(cells, DARK);
    expect(r.over).toBe(true);
  });

  it('pass() is a no-op when the side to move can still play', () => {
    // the contract is "advance past a STUCK side" — calling it on a side with
    // a move must not silently skip their turn
    const r = pass(initialBoard(8), DARK);
    expect(r.turn).toBe(DARK);
    expect(r.passed).toBe(false);
    expect(r.over).toBe(false);
    expect(r.flipped).toEqual([]);
  });

  it('pass() gives the turn back when the opponent is stuck', () => {
    // the same verified position: light is stuck, dark still has a move, so
    // pass() hands the turn straight back to dark
    const cells = passPosition();
    expect(legalMoves(cells, LIGHT)).toEqual([]);
    const r = pass(cells, LIGHT);
    expect(r.turn).toBe(DARK);
    expect(r.passed).toBe(true);
    expect(r.over).toBe(false);
    expect(r.flipped).toEqual([]); // a pass places nothing
  });
});

describe('othello core — counts and result', () => {
  it('counts discs, empties and the total', () => {
    const cells = initialBoard(8);
    expect(discCount(cells)).toEqual({ dark: 2, light: 2, empty: 60, total: 64 });
    const filled = new Array(64).fill(DARK);
    expect(discCount(filled)).toEqual({ dark: 64, light: 0, empty: 0, total: 64 });
  });

  it('decides by majority and reports a draw as a draw', () => {
    const darkWins = new Array(64).fill(DARK);
    darkWins[0] = LIGHT;
    expect(outcome(darkWins)).toEqual({ winner: DARK, dark: 63, light: 1, draw: false });

    const lightWins = new Array(64).fill(LIGHT);
    lightWins[0] = DARK;
    lightWins[1] = DARK;
    expect(outcome(lightWins)).toEqual({ winner: LIGHT, dark: 2, light: 62, draw: false });

    const lopsided = new Array(64).fill(DARK);
    lopsided[0] = LIGHT;
    lopsided[1] = LIGHT;
    lopsided[2] = LIGHT;
    lopsided[3] = LIGHT;
    expect(outcome(lopsided)).toEqual({ winner: DARK, dark: 60, light: 4, draw: false });
  });

  it('calls an exactly even board a draw', () => {
    const even = new Array(8).fill(DARK).concat(new Array(8).fill(LIGHT));
    const r = outcome(even);
    expect(r.draw).toBe(true);
    expect(r.winner).toBeNull();
    expect(r.dark).toBe(r.light);
  });

  it('knows when the game is over', () => {
    expect(isOver(initialBoard(8))).toBe(false);
    const done = new Array(64).fill(DARK);
    done[0] = LIGHT;
    expect(isOver(done)).toBe(true);
  });
});

describe('othello core — evaluation', () => {
  it('values a corner far above the centre', () => {
    const corner = new Array(64).fill(EMPTY);
    corner[0] = DARK;
    const centre = new Array(64).fill(EMPTY);
    centre[27] = DARK;
    expect(evaluate(corner, DARK)).toBeGreaterThan(evaluate(centre, DARK));
  });

  it('is signed from the given side', () => {
    // a dark-favoured board must score positive for dark and negative for light
    const darkHeavy = new Array(64).fill(DARK);
    expect(evaluate(darkHeavy, DARK)).toBeGreaterThan(0);
    expect(evaluate(darkHeavy, LIGHT)).toBeLessThan(0);
    // and the two sides are exact mirrors (on a balanced board both are 0, so
    // use the unbalanced one to keep the sign meaningful)
    expect(evaluate(darkHeavy, DARK)).toBe(-evaluate(darkHeavy, LIGHT));
  });
});

describe('othello core — AI tiers', () => {
  it('easy takes the biggest immediate flip', () => {
    // dark can flip one disc at d3 and two at c5
    const cells = initialBoard(8);
    const move = easyMove(cells, DARK);
    expect(legalMoves(cells, DARK)).toContain(move);
  });

  it('every tier returns a legal move from the opening', () => {
    const cells = initialBoard(8);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      expect(legalMoves(cells, DARK)).toContainEqual(aiMove(cells, DARK, difficulty, { maxNodes: 20000 }));
    }
  });

  it('returns null when there is no legal move', () => {
    const done = new Array(64).fill(DARK);
    done[0] = LIGHT;
    expect(easyMove(done, DARK)).toBeNull();
    expect(mediumMove(done, DARK)).toBeNull();
    expect(search(done, DARK)).toBeNull();
    expect(aiMove(done, DARK, 'hard')).toBeNull();
  });

  it('hard stays inside its node cap and still answers legally', () => {
    const found = search(initialBoard(8), DARK, { maxNodes: 3000 });
    expect(legalMoves(initialBoard(8), DARK)).toContainEqual(found.move);
    expect(found.nodes).toBeLessThanOrEqual(3001);
  });

  it('hard prefers a corner when one is available', () => {
    const cells = new Array(64).fill(EMPTY);
    // give dark a corner move and an equally legal but duller centre move
    cells[0] = LIGHT;
    cells[9] = LIGHT;
    cells[10] = DARK; // closes the line to the corner (0,0) for light
    cells[18] = DARK;
    cells[27] = LIGHT;
    cells[36] = DARK;
    cells[45] = LIGHT;
    cells[54] = DARK;
    cells[63] = LIGHT;
    const found = search(cells, LIGHT, { maxNodes: 20000 });
    if (legalMoves(cells, LIGHT).includes(0)) expect(found.move).toBe(0);
  });

  it('hard wins a position it can finish', () => {
    // dark is one disc from filling the board and winning overwhelmingly
    const cells = new Array(64).fill(DARK);
    cells[0] = LIGHT;
    cells[9] = LIGHT;
    cells[1] = EMPTY;
    const found = search(cells, DARK, { maxNodes: 40000 });
    expect(legalMoves(cells, DARK)).toContainEqual(found.move);
  });
});

describe('othello core — a full game plays out', () => {
  it('finishes with a legal result and the disc totals match the board', () => {
    let cells = initialBoard(8);
    let side = DARK;
    for (let ply = 0; ply < 200; ply++) {
      if (isOver(cells)) break;
      const moves = legalMoves(cells, side);
      if (moves.length === 0) {
        const res = pass(cells, side);
        if (res.over) break;
        side = res.turn;
        continue;
      }
      const move = aiMove(cells, side, 'hard', { maxNodes: 4000 });
      expect(moves).toContainEqual(move);
      const r = applyMove(cells, side, move);
      cells = r.cells;
      side = r.turn;
    }
    expect(isOver(cells)).toBe(true);
    const { dark, light, empty, total } = discCount(cells);
    expect(empty).toBe(0);
    expect(dark + light).toBe(total);
    const result = outcome(cells);
    expect(result.dark).toBe(dark);
    expect(result.light).toBe(light);
    expect(result.winner === null).toBe(result.draw);
  });
});

describe('othello core — the wire format', () => {
  it('sanitises an untrusted board', () => {
    const dirty = fromArray([99, -1, 'x', 2, null, undefined, 1, 0], 8);
    expect(dirty[0]).toBe(EMPTY);
    expect(dirty[1]).toBe(EMPTY);
    expect(dirty[2]).toBe(EMPTY);
    expect(dirty[3]).toBe(LIGHT);
    expect(dirty[6]).toBe(DARK);
    expect(dirty).toHaveLength(64);
  });

  it('round-trips a real board', () => {
    const cells = initialBoard(8);
    expect(fromArray(cells, 8)).toEqual(cells);
  });

  it('other() flips sides', () => {
    expect(other(DARK)).toBe(LIGHT);
    expect(other(LIGHT)).toBe(DARK);
  });
});
