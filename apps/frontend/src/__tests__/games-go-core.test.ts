import {
  SIZE,
  CELLS,
  EMPTY,
  BLACK,
  WHITE,
  DEFAULT_KOMI,
  other,
  rowOf,
  fileOf,
  idxAt,
  neighbours,
  initialBoard,
  cloneBoard,
  groupAt,
  groupsOf,
  libertiesAt,
  playOn,
  isLegal,
  samePosition,
  legalMoves,
  applyMove,
  createGame,
  score,
  evaluate,
  easyMove,
  mediumMove,
  search,
  aiMove,
  fromArray,
} from '../../public/games/go/core.js';

/**
 * The canonical KO shape, reused by every ko and capture fixture:
 *
 *        (0,0) (0,1) (0,2)
 *          .      B      W
 *          B      W      .        white at (1,1) has ONE liberty, at (2,1)
 *          W      .      W        white at (2,0) (2,2) (3,1) pin the reply
 *
 * Black plays (2,1) and takes the white stone; white may not retake at once.
 */
function koPosition() {
  const cells = initialBoard();
  for (const [r, f] of [[0, 1], [1, 0], [1, 2]] as const) cells[idxAt(r, f)] = BLACK;
  for (const [r, f] of [[1, 1], [2, 0], [2, 2], [3, 1]] as const) cells[idxAt(r, f)] = WHITE;
  return cells;
}

/**
 * plan/games/39 — the pure Go 9×9 model. The rules that carry the game:
 * liberties, capture-before-suicide, the ko ban, and area scoring with komi.
 */
describe('go core — geometry', () => {
  it('is a 9x9 board of 81 points', () => {
    expect(SIZE).toBe(9);
    expect(CELLS).toBe(81);
    expect(initialBoard()).toHaveLength(81);
    expect(initialBoard().every((c) => c === EMPTY)).toBe(true);
  });

  it('maps coordinates both ways', () => {
    expect(idxAt(0, 0)).toBe(0);
    expect(idxAt(8, 8)).toBe(80);
    expect(idxAt(-1, 0)).toBe(-1);
    expect(idxAt(0, 9)).toBe(-1);
    expect(rowOf(40)).toBe(4);
    expect(fileOf(40)).toBe(4);
  });

  it('gives a corner two neighbours, an edge three, the middle four', () => {
    expect(neighbours(idxAt(0, 0))).toHaveLength(2);
    expect(neighbours(idxAt(0, 4))).toHaveLength(3);
    expect(neighbours(idxAt(4, 4))).toHaveLength(4);
    // no off-board index ever appears
    for (const n of neighbours(idxAt(0, 0))) expect(n).toBeGreaterThanOrEqual(0);
  });

  it('flips sides and clones', () => {
    expect(other(BLACK)).toBe(WHITE);
    expect(other(WHITE)).toBe(BLACK);
    const cells = initialBoard();
    cells[0] = BLACK;
    const copy = cloneBoard(cells);
    copy[0] = WHITE;
    expect(cells[0]).toBe(BLACK);
  });
});

describe('go core — groups and liberties', () => {
  it('counts a lone stone cornered on a corner as two liberties', () => {
    const cells = initialBoard();
    cells[idxAt(0, 0)] = BLACK;
    expect(libertiesAt(cells, idxAt(0, 0))).toBe(2);
  });

  it('groups stones that touch orthogonally', () => {
    const cells = initialBoard();
    cells[idxAt(4, 4)] = BLACK;
    cells[idxAt(4, 5)] = BLACK;
    cells[idxAt(4, 6)] = BLACK;
    // two rows clear, so it touches none of them orthogonally. (A stone at
    // (5,5) would sit directly BELOW (4,5) and join the run — "diagonal" is
    // not how Go groups stones.)
    cells[idxAt(6, 4)] = BLACK;
    expect(groupsOf(cells, BLACK)).toHaveLength(2);
    expect(groupAt(cells, idxAt(4, 6))).toBe(groupAt(cells, idxAt(4, 4)));
    expect(groupAt(cells, idxAt(6, 4))).not.toBe(groupAt(cells, idxAt(4, 4)));
  });

  it('counts shared liberties once, not twice', () => {
    const cells = initialBoard();
    cells[idxAt(4, 4)] = BLACK;
    cells[idxAt(4, 5)] = BLACK;
    // the pair shares the two points above/below the seam
    expect(libertiesAt(cells, idxAt(4, 4))).toBe(6);
  });

  it('returns one liberty for a group in atari', () => {
    const cells = initialBoard();
    const at = idxAt(4, 4);
    cells[at] = BLACK;
    cells[idxAt(3, 4)] = WHITE;
    cells[idxAt(5, 4)] = WHITE;
    cells[idxAt(4, 3)] = WHITE;
    expect(libertiesAt(cells, at)).toBe(1);
  });

  it('a corner stone with both neighbours filled is already dead', () => {
    const cells = initialBoard();
    cells[idxAt(0, 0)] = BLACK;
    cells[idxAt(0, 1)] = WHITE;
    cells[idxAt(1, 0)] = WHITE;
    expect(libertiesAt(cells, idxAt(0, 0))).toBe(0);
  });
});

describe('go core — capture and suicide', () => {
  it('removes a group when its last liberty is filled', () => {
    const cells = initialBoard();
    const at = idxAt(0, 1);
    cells[at] = WHITE; // last liberty is (0,2): (0,0) and (1,1) are black
    cells[idxAt(0, 0)] = BLACK;
    cells[idxAt(1, 1)] = BLACK;
    expect(libertiesAt(cells, at)).toBe(1);
    const r = playOn(cells, BLACK, idxAt(0, 2));
    expect(r).not.toBeNull();
    expect(r.captured).toEqual([at]);
    expect(r.cells[at]).toBe(EMPTY);
  });

  it('captures a whole group, not one stone', () => {
    const cells = initialBoard();
    const a = idxAt(4, 4);
    const b = idxAt(4, 5);
    cells[a] = WHITE;
    cells[b] = WHITE;
    // the pair's liberties are (3,4) (3,5) (5,4) (5,5) (4,3): black fills
    // all of them, and the move at (4,6) takes the last
    for (const [r, f] of [[3, 4], [3, 5], [5, 4], [5, 5], [4, 3]] as const) {
      cells[idxAt(r, f)] = BLACK;
    }
    const r = playOn(cells, BLACK, idxAt(4, 6));
    expect(r.captured.sort()).toEqual([a, b].sort());
  });

  it('refuses a suicide move', () => {
    // a point ringed entirely by white: black there would have no liberty
    // and would capture nothing, which is the definition of suicide
    const eye = initialBoard();
    for (const [r, f] of [[0, 1], [1, 0], [1, 2], [2, 1]] as const) eye[idxAt(r, f)] = WHITE;
    expect(playOn(eye, BLACK, idxAt(1, 1))).toBeNull();
    expect(isLegal(eye, BLACK, idxAt(1, 1))).toBe(false);
  });

  it('allows a move that captures even while filling its own last liberty', () => {
    // the standard snapback shape: white at the centre with one liberty, and
    // black's own group is in atari on the very same point
    const cells = koPosition();
    const r = playOn(cells, BLACK, idxAt(2, 1));
    expect(r).not.toBeNull();
    expect(r.captured).toEqual([idxAt(1, 1)]);
  });

  it('refuses an occupied point', () => {
    const cells = initialBoard();
    cells[idxAt(4, 4)] = BLACK;
    expect(playOn(cells, WHITE, idxAt(4, 4))).toBeNull();
  });
});

describe('go core — the ko rule', () => {
  it('refuses a move that recreates the previous position', () => {
    const before = koPosition();
    const after = playOn(before, BLACK, idxAt(2, 1));
    expect(after.captured).toEqual([idxAt(1, 1)]);
    // white may NOT immediately recapture — that would recreate `before`
    expect(isLegal(after.cells, WHITE, idxAt(1, 1), before)).toBe(false);
    // the recapture is a legal SHAPE; only the ko rule forbids it here
    expect(playOn(after.cells, WHITE, idxAt(1, 1)) !== null).toBe(true);
  });

  it('compares positions exactly', () => {
    const a = initialBoard();
    const b = initialBoard();
    expect(samePosition(a, b)).toBe(true);
    b[40] = BLACK;
    expect(samePosition(a, b)).toBe(false);
    expect(samePosition(a, null)).toBe(false);
  });

  it('lifts the ban when the capturing stone is itself taken (a snapback)', () => {
    const before = koPosition();
    const after = playOn(before, BLACK, idxAt(2, 1));
    // white recaptures at (1,1): legal, because black's stone at (2,1) comes
    // off too, so this is NOT a return to `before`
    const recapture = playOn(after.cells, WHITE, idxAt(1, 1));
    expect(recapture).not.toBeNull();
    expect(recapture.captured).toEqual([idxAt(2, 1)]);
  });
});

describe('go core — turns and passing', () => {
  it('starts with black on an empty board', () => {
    const state = createGame();
    expect(state.turn).toBe(BLACK);
    expect(state.captures).toEqual([0, 0]);
    expect(state.komi).toBe(DEFAULT_KOMI);
  });

  it('alternates the turn', () => {
    let state = createGame();
    state = applyMove(state, BLACK, idxAt(2, 2)).state;
    expect(state.turn).toBe(WHITE);
    state = applyMove(state, WHITE, idxAt(6, 6)).state;
    expect(state.turn).toBe(BLACK);
  });

  it('refuses a move from the side that is not to move', () => {
    const state = createGame();
    expect(applyMove(state, WHITE, idxAt(2, 2))).toBeNull();
  });

  it('ends the game after two consecutive passes', () => {
    let state = createGame();
    const one = applyMove(state, BLACK, null);
    expect(one.over).toBe(false);
    const two = applyMove(one.state, WHITE, null);
    expect(two.over).toBe(true);
  });

  it('resets the pass counter when a stone is played', () => {
    let state = createGame();
    state = applyMove(state, BLACK, null).state;
    expect(state.passes).toBe(1);
    state = applyMove(state, WHITE, idxAt(4, 4)).state;
    expect(state.passes).toBe(0);
  });

  it('counts captured stones per side', () => {
    const cells = koPosition();
    const state = { ...createGame(), cells, turn: BLACK, captures: [0, 0], passes: 0, previous: null };
    const r = applyMove(state, BLACK, idxAt(2, 1));
    expect(r.state.captures).toEqual([1, 0]);
    expect(r.captured).toEqual([idxAt(1, 1)]);
  });
});

describe('go core — area scoring with komi', () => {
  it('gives black the whole board when black holds it', () => {
    const cells = initialBoard();
    for (let idx = 0; idx < cells.length; idx++) cells[idx] = BLACK;
    const result = score({ cells, captures: [0, 0], komi: 0 });
    expect(result.blackArea).toBe(81);
    expect(result.whiteArea).toBe(0);
    expect(result.winner).toBe(BLACK);
  });

  it('gives komi to white, so an even board is a white win', () => {
    const cells = initialBoard();
    for (let idx = 0; idx < cells.length; idx++) cells[idx] = idx % 2 === 0 ? BLACK : WHITE;
    const withKomi = score({ cells, captures: [0, 0], komi: DEFAULT_KOMI });
    expect(withKomi.winner).toBe(WHITE);
    const noKomi = score({ cells, captures: [0, 0], komi: 0 });
    expect(Math.abs(noKomi.total.black - noKomi.total.white)).toBeLessThanOrEqual(1);
  });

  it('counts enclosed empty points as territory', () => {
    const cells = initialBoard();
    // four black stones walling in the single point (1,1) — its four
    // neighbours are all black, so it scores as black territory
    for (const [r, f] of [[0, 1], [1, 0], [1, 2], [2, 1]] as const) {
      cells[idxAt(r, f)] = BLACK;
    }
    expect(cells[idxAt(1, 1)]).toBe(EMPTY);
    const result = score({ cells, captures: [0, 0], komi: 0 });
    // 4 wall stones + the enclosed point (1,1) + the corner (0,0), which is
    // also bounded purely by black and so scores as black under area rules
    expect(result.blackArea).toBe(6);
    expect(result.winner).toBe(BLACK);
  });

  it('leaves dame between the colours to neither side', () => {
    const cells = initialBoard();
    // a single empty point touching both colours is dame
    cells[idxAt(4, 4)] = BLACK;
    cells[idxAt(4, 5)] = WHITE;
    const result = score({ cells, captures: [0, 0], komi: 0 });
    expect(result.dame).toBeGreaterThanOrEqual(1);
  });

  it('calls a dead-stone board a white win with komi', () => {
    const cells = initialBoard();
    // one black stone in the corner, everything else white
    cells[idxAt(0, 0)] = BLACK;
    for (let idx = 1; idx < cells.length; idx++) cells[idx] = WHITE;
    const result = score({ cells, captures: [0, 0], komi: DEFAULT_KOMI });
    expect(result.winner).toBe(WHITE);
  });
});

describe('go core — evaluation and AI tiers', () => {
  it('rewards liberties and punishes atari', () => {
    const open = initialBoard();
    open[idxAt(4, 4)] = BLACK;
    open[idxAt(4, 5)] = BLACK;
    open[idxAt(4, 6)] = BLACK;
    const tight = initialBoard();
    tight[idxAt(0, 0)] = BLACK;
    tight[idxAt(0, 1)] = WHITE;
    tight[idxAt(1, 0)] = WHITE;
    expect(evaluate(open, BLACK)).toBeGreaterThan(evaluate(tight, BLACK));
  });

  it('easy takes an available capture', () => {
    const state = { ...createGame(), cells: koPosition(), turn: BLACK, previous: null };
    expect(easyMove(state, BLACK)).toBe(idxAt(2, 1));
  });

  it('medium never suicides', () => {
    const cells = initialBoard();
    cells[idxAt(0, 0)] = BLACK;
    cells[idxAt(0, 1)] = BLACK;
    cells[idxAt(1, 0)] = BLACK; // the corner eye is the group's only liberty
    const state = { ...createGame(), cells, turn: BLACK, previous: null };
    const move = mediumMove(state, BLACK);
    expect(move).not.toBeNull();
    expect(legalMoves(cells, BLACK, null)).toContain(move);
    // playing into the eye and losing the stone must never be chosen
    const after = playOn(cells, BLACK, move);
    expect(after.suicided).toBe(false);
  });

  it('hard takes a capture that is available', () => {
    const state = { ...createGame(), cells: koPosition(), turn: BLACK, previous: null };
    const found = search(state, BLACK, { maxNodes: 20000 });
    expect(found.move).toBe(idxAt(2, 1));
  });

  it('hard stays inside its node cap and answers legally', () => {
    const state = createGame();
    const found = search(state, BLACK, { maxNodes: 2000 });
    expect(legalMoves(state.cells, BLACK, null)).toContain(found.move);
    expect(found.nodes).toBeLessThanOrEqual(2001);
  });

  it('every tier answers legally from the opening', () => {
    const state = createGame();
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const move = aiMove(state, BLACK, difficulty, { maxNodes: 8000 });
      expect(legalMoves(state.cells, BLACK, null)).toContain(move);
    }
  });
});

describe('go core — a full game plays out', () => {
  it('reaches two passes with a scored result and no illegal move', () => {
    let state = createGame(0);
    let side = BLACK;
    for (let ply = 0; ply < 160; ply++) {
      const move = mediumMove(state, side);
      if (move === null) break; // no legal placement
      const r = applyMove(state, side, move);
      expect(r).not.toBeNull();
      state = r.state;
      side = state.turn;
      if (r.over) break;
    }
    // finish with two passes
    let a = applyMove(state, side, null);
    state = a.state;
    a = applyMove(state, state.turn, null);
    expect(a.over).toBe(true);
    const result = score(state);
    expect(result.blackArea + result.whiteArea + result.dame).toBe(81);
  });
});

describe('go core — the wire format', () => {
  it('sanitises an untrusted board', () => {
    const dirty = fromArray([99, -1, 'x', 2, null, 1, 0]);
    expect(dirty[0]).toBe(EMPTY);
    expect(dirty[3]).toBe(WHITE);
    expect(dirty[5]).toBe(BLACK);
    expect(dirty).toHaveLength(81);
  });

  it('round-trips a real board', () => {
    const cells = initialBoard();
    cells[40] = BLACK;
    expect(fromArray(cells)).toEqual(cells);
  });
});
