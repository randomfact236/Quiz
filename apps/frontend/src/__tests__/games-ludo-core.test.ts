import {
  TRACK_LEN,
  HOME_LEN,
  FULL_PITCH,
  RED,
  BLUE,
  YELLOW,
  GREEN,
  COLOURS,
  COLOUR_NAME,
  START_YARD,
  START_INDEX,
  SAFE_INDICES,
  positionOf,
  isYard,
  isTrack,
  isHome,
  isFinished,
  isSafe,
  createGame,
  cloneGame,
  trackIndexOf,
  occupantsOf,
  legalMoves,
  applyMove,
  playTurn,
  finishedFor,
  isFinishedGame,
  pawnCounts,
  evaluate,
  easyMove,
  mediumMove,
  search,
  aiMove,
  fromState,
} from '../../public/games/ludo/core.js';

/**
 * plan/games/42 — the pure Ludo model. The rules worth pinning: a six brings
 * a pawn out, only a six does; a PAIR on a square is a blockade, not a
 * capture; safe squares cannot be captured on; entering the home column needs
 * the EXACT roll; three sixes forfeits the turn; and the die is an input, so
 * the model never generates one.
 */
describe('ludo core — the board', () => {
  it('has a 51-square track and a 6-square home column', () => {
    expect(TRACK_LEN).toBe(51);
    expect(HOME_LEN).toBe(6);
    expect(FULL_PITCH).toBe(57);
  });

  it('starts every colour with four pawns in the yard', () => {
    const g = createGame();
    for (const c of COLOURS) {
      expect(g.pawns[c]).toHaveLength(4);
      expect(g.pawns[c].every((p) => p === START_YARD)).toBe(true);
    }
    expect(g.turn).toBe(RED);
  });

  it('spreads the four start squares 13 apart and marks the crossings safe', () => {
    expect(START_INDEX[RED]).toBe(0);
    expect(START_INDEX[BLUE]).toBe(13);
    expect(START_INDEX[YELLOW]).toBe(26);
    expect(START_INDEX[GREEN]).toBe(39);
    expect(SAFE_INDICES).toContain(0);
    expect(SAFE_INDICES).toContain(21); // the red/yellow crossing
    expect(SAFE_INDICES).toContain(34); // the blue/green crossing
    expect(isSafe(21)).toBe(true);
    expect(isSafe(5)).toBe(false);
  });

  it('classifies a position', () => {
    expect(positionOf(START_YARD)).toEqual({ where: 'yard' });
    expect(positionOf(1)).toEqual({ where: 'track', index: 0 });
    expect(positionOf(TRACK_LEN)).toEqual({ where: 'track', index: TRACK_LEN - 1 });
    expect(positionOf(TRACK_LEN + 1)).toEqual({ where: 'home', index: 0 });
    expect(positionOf(FULL_PITCH)).toEqual({ where: 'home', index: HOME_LEN - 1 });
    expect(isYard(0)).toBe(true);
    expect(isTrack(30)).toBe(true);
    expect(isHome(TRACK_LEN + 3)).toBe(true);
    expect(isFinished(FULL_PITCH)).toBe(true);
  });

  it('clones a game without sharing pawn arrays', () => {
    const g = createGame();
    const copy = cloneGame(g);
    copy.pawns[RED][0] = 10;
    expect(g.pawns[RED][0]).toBe(START_YARD);
  });
});

describe('ludo core — leaving the yard', () => {
  it('only a six brings a pawn out', () => {
    const g = createGame();
    expect(legalMoves(g, RED, 3)).toHaveLength(0);
    const six = legalMoves(g, RED, 6);
    expect(six).toHaveLength(4); // any of the four pawns
    expect(six.every((m) => m.bringsOut)).toBe(true);
  });

  it('cannot enter a start square held by an enemy', () => {
    const g = createGame();
    g.pawns[GREEN][0] = 1 + START_INDEX[RED]; // green sits on red's start
    expect(legalMoves(g, RED, 6)).toHaveLength(0);
  });

  it('may stack its OWN pawns on its start square', () => {
    const g = createGame();
    g.pawns[RED][0] = 1 + START_INDEX[RED];
    const moves = legalMoves(g, RED, 6);
    expect(moves.length).toBeGreaterThan(0);
  });
});

describe('ludo core — moving on the track', () => {
  it('advances exactly the roll', () => {
    const g = createGame();
    g.pawns[RED][0] = 5;
    const m = legalMoves(g, RED, 3)[0];
    expect(m.to).toBe(8);
  });

  it('captures a lone enemy pawn back to its yard', () => {
    const g = createGame();
    g.pawns[RED][0] = 5; // on track index 4
    g.pawns[BLUE][0] = 10; // on track index 9 — NOT a safe square
    const move = legalMoves(g, RED, 5).find((m) => m.to === 10);
    expect(move).toBeDefined();
    expect(move!.captures).toEqual([{ colour: BLUE, pawn: 0 }]);
    const after = applyMove(g, RED, move!, 4);
    expect(after.game.pawns[BLUE][0]).toBe(START_YARD);
    expect(after.game.captured[RED]).toBe(1);
  });

  it('refuses a square with TWO enemy pawns — that is a blockade', () => {
    const g = createGame();
    g.pawns[RED][0] = 5;
    g.pawns[BLUE][0] = 10;
    g.pawns[BLUE][1] = 10;
    expect(legalMoves(g, RED, 5).some((m) => m.to === 10)).toBe(false);
  });

  it('cannot land on its own pawn', () => {
    const g = createGame();
    g.pawns[RED][0] = 5;
    g.pawns[RED][1] = 10;
    expect(legalMoves(g, RED, 5).some((m) => m.to === 10)).toBe(false);
  });

  it('cannot capture on, or be blocked by, a safe square', () => {
    const g = createGame();
    g.pawns[RED][0] = 5;
    g.pawns[BLUE][0] = 1 + START_INDEX[GREEN]; // 39, a safe square
    const moves = legalMoves(g, RED, 35);
    expect(moves.some((m) => m.to === 40)).toBe(false); // the safe square is blocked
  });

  it('a pawn already on a safe square is untouchable', () => {
    const g = createGame();
    g.pawns[BLUE][0] = 1 + START_INDEX[RED]; // blue sits on red's safe start
    g.pawns[RED][0] = 40;
    // red cannot land on 0 (safe, occupied) even with the exact roll
    expect(legalMoves(g, RED, 11).some((m) => m.to === 1)).toBe(false);
  });
});

describe('ludo core — the home column', () => {
  it('needs the EXACT roll to enter', () => {
    const g = createGame();
    g.pawns[RED][0] = TRACK_LEN - 2; // two from the end of the track
    expect(legalMoves(g, RED, 1).some((m) => m.to === TRACK_LEN + 1)).toBe(false);
    expect(legalMoves(g, RED, 3).some((m) => m.to === TRACK_LEN + 1)).toBe(true);
  });

  it('moves inside the column by the exact roll and cannot overshoot', () => {
    const g = createGame();
    g.pawns[RED][0] = TRACK_LEN + 2;
    expect(legalMoves(g, RED, 2).some((m) => m.to === TRACK_LEN + 4)).toBe(true);
    expect(legalMoves(g, RED, 5).some((m) => m.to === TRACK_LEN + 7)).toBe(false);
  });

  it('finishes only on the exact roll home', () => {
    const g = createGame();
    g.pawns[RED][0] = FULL_PITCH - 1;
    const moves = legalMoves(g, RED, 1);
    expect(moves).toHaveLength(1);
    expect(moves[0].finishes).toBe(true);
    expect(moves[0].to).toBe(FULL_PITCH);
  });

  it('a six does not let a home pawn out to the track', () => {
    const g = createGame();
    g.pawns[RED][0] = TRACK_LEN + 1;
    // only look at the pawn that is IN the column — the other three are in
    // the yard, and a six legitimately brings one of those out
    const moves = legalMoves(g, RED, 6).filter((m) => m.pawn === 0);
    expect(moves.every((m) => m.to > TRACK_LEN + 1)).toBe(true);
  });

  it('a finished pawn has no moves left', () => {
    const g = createGame();
    g.pawns[RED][0] = FULL_PITCH;
    expect(legalMoves(g, RED, 3).some((m) => m.pawn === 0)).toBe(false);
  });
});

describe('ludo core — turns', () => {
  it('passes the turn on an ordinary roll', () => {
    const g = createGame();
    g.pawns[RED][0] = 5;
    const move = legalMoves(g, RED, 3)[0];
    const r = playTurn(g, RED, move, 3);
    expect(r.extraTurn).toBe(false);
    expect(r.game.turn).toBe(BLUE);
  });

  it('grants another roll on a six', () => {
    const g = createGame();
    const move = legalMoves(g, RED, 6)[0];
    const r = playTurn(g, RED, move, 6);
    expect(r.extraTurn).toBe(true);
    expect(r.game.turn).toBe(RED); // the same player rolls again
    expect(r.game.sixes).toBe(1);
  });

  it('forfeits the turn after three sixes in a row', () => {
    const g = createGame();
    g.sixes = 2;
    const move = legalMoves(g, RED, 6)[0];
    const r = playTurn(g, RED, move, 6);
    expect(r.game.turn).toBe(BLUE);
    expect(r.game.sixes).toBe(0);
  });

  it('resets the six-count on an ordinary roll', () => {
    const g = createGame();
    g.sixes = 2;
    g.pawns[RED][0] = 5;
    const move = legalMoves(g, RED, 2)[0];
    expect(playTurn(g, RED, move, 2).game.sixes).toBe(0);
  });

  it('ends the game when all four pawns are home', () => {
    const g = createGame();
    g.pawns[RED] = [FULL_PITCH - 1, FULL_PITCH, FULL_PITCH, FULL_PITCH];
    const move = legalMoves(g, RED, 1)[0];
    const r = playTurn(g, RED, move, 1);
    expect(r.over).toBe(true);
    expect(r.winner).toBe(RED);
    expect(finishedFor(r.game, RED)).toBe(1);
    expect(isFinishedGame(r.game)).toBe(true);
  });

  it('reports a dead roll as no moves at all', () => {
    const g = createGame();
    expect(legalMoves(g, RED, 1)).toHaveLength(0); // nothing out on a non-six
  });
});

describe('ludo core — the AI', () => {
  it('easy takes a legal move and never an illegal one', () => {
    const g = createGame();
    const m = easyMove(g, RED, 6);
    expect(m).not.toBeNull();
    expect(legalMoves(g, RED, 6)).toContainEqual(m);
  });

  it('easy returns null on a dead roll', () => {
    expect(easyMove(createGame(), RED, 3)).toBeNull();
  });

  it('medium finishes a pawn when it can', () => {
    const g = createGame();
    g.pawns[RED] = [FULL_PITCH - 1, 5, 6, 7];
    const m = mediumMove(g, RED, 1);
    expect(m?.finishes).toBe(true);
  });

  it('medium takes a capture when one is on offer', () => {
    const g = createGame();
    g.pawns[RED][0] = 5;
    g.pawns[BLUE][0] = 10;
    const m = mediumMove(g, RED, 5);
    expect(m?.captures.length).toBe(1);
  });

  it('medium brings a pawn out on a six rather than shuffling', () => {
    const g = createGame();
    g.pawns[RED][0] = 5;
    const m = mediumMove(g, RED, 6);
    expect(m?.bringsOut || m?.to === 11).toBe(true);
  });

  it('hard takes the free capture too', () => {
    const g = createGame();
    g.pawns[RED][0] = 5;
    g.pawns[BLUE][0] = 10;
    const found = search(g, RED, 5, { maxNodes: 8000 });
    expect(found?.move.captures.length).toBe(1);
  });

  it('hard stays inside its node cap', () => {
    const found = search(createGame(), RED, 6, { maxNodes: 500 });
    expect(found?.nodes).toBeLessThanOrEqual(501);
  });

  it('every tier answers legally for every roll', () => {
    const g = createGame();
    g.pawns[RED][0] = 5;
    g.pawns[RED][1] = 20;
    for (const roll of [1, 2, 3, 4, 5, 6]) {
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        const m = aiMove(g, RED, roll, difficulty, { maxNodes: 3000 });
        if (m === null) continue;
        expect(legalMoves(g, RED, roll)).toContainEqual(m);
      }
    }
  });

  it('values progress toward home', () => {
    const near = createGame();
    near.pawns[RED] = [TRACK_LEN + 2, START_YARD, START_YARD, START_YARD];
    const far = createGame();
    far.pawns[RED] = [10, START_YARD, START_YARD, START_YARD];
    expect(evaluate(near, RED)).toBeGreaterThan(evaluate(far, RED));
  });
});

describe('ludo core — a full game plays out', () => {
  it('keeps every pawn on a legal square however long it runs', () => {
    let g = createGame();
    let colour = RED;
    const rolls = [3, 4, 6, 2, 5, 1, 6, 4, 3, 2, 6, 5, 4, 3, 2, 1];
    let finished = null;
    for (let i = 0; i < 1200 && !finished; i++) {
      const roll = rolls[i % rolls.length];
      const moves = legalMoves(g, colour, roll);
      if (moves.length === 0) {
        // a dead roll passes the turn; the six in the cycle always frees it
        g = { ...g, turn: COLOURS[(COLOURS.indexOf(colour) + 1) % 4] };
        continue;
      }
      const pick = mediumMove(g, colour, roll) ?? moves[0];
      const r = playTurn(g, colour, pick, roll);
      g = r.game;
      if (r.over) finished = r;
      colour = g.turn;
    }
    if (finished) {
      expect(COLOURS).toContain(finished.winner);
      expect(pawnCounts(g)[finished.winner!].finished).toBe(4);
    } else {
      // A fixed roll sequence CAN deadlock, and that is real Ludo: a start
      // square blocked by a parked pawn stays blocked. The invariant that must
      // hold either way is that nothing is on an impossible square.
      expect(isFinishedGame(g)).toBe(false);
    }
    for (const c of COLOURS) {
      for (const pawn of g.pawns[c]) {
        expect(pawn).toBeGreaterThanOrEqual(0);
        expect(pawn).toBeLessThanOrEqual(FULL_PITCH);
      }
    }
  });

  it('reports a blocked start square as a dead roll, not a broken one', () => {
    // green parked on red's start: red CANNOT bring a pawn out on a six
    const g = createGame();
    g.pawns[GREEN][0] = 1 + START_INDEX[RED];
    expect(legalMoves(g, RED, 6)).toHaveLength(0);
    // and the moment green moves off, red can enter again
    g.pawns[GREEN][0] = 1 + START_INDEX[RED] + 1;
    expect(legalMoves(g, RED, 6).length).toBeGreaterThan(0);
  });

  it('finishes a game when it is played to a conclusion', () => {
    // a hand-set position close to the line, so the test proves the WIN path
    // rather than relying on a long random walk
    let g = createGame();
    g.pawns[RED] = [FULL_PITCH - 1, FULL_PITCH - 1, FULL_PITCH - 2, FULL_PITCH - 3];
    g.turn = RED;
    let last = null;
    // four pawns on the home stretch need six single-square moves, not four
    for (let i = 0; i < 10 && !(last && last.over); i++) {
      const moves = legalMoves(g, RED, 1);
      if (moves.length === 0) break;
      last = playTurn(g, RED, moves[0], 1);
      g = last.game;
    }
    expect(last?.over).toBe(true);
    expect(last?.winner).toBe(RED);
    expect(pawnCounts(last.game)[RED].finished).toBe(4);
  });
});

describe('ludo core — the wire format', () => {
  it('sanitises an untrusted pawns object', () => {
    const g = fromState({ 1: [5, 99, -1, 'x'], 2: [1, 2, 3, 4] }, 3);
    expect(g.pawns[RED]).toEqual([5, START_YARD, START_YARD, START_YARD]);
    expect(g.pawns[BLUE]).toEqual([1, 2, 3, 4]);
    expect(g.turn).toBe(YELLOW);
  });

  it('falls back to a fresh game for junk input', () => {
    const g = fromState(null, 99);
    expect(g.turn).toBe(RED);
    expect(g.pawns[RED].every((p) => p === START_YARD)).toBe(true);
  });

  it('names every colour', () => {
    for (const c of COLOURS) expect(COLOUR_NAME[c]).toBeTruthy();
  });
});
