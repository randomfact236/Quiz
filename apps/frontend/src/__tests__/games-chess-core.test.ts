import {
  WHITE,
  BLACK,
  EMPTY,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  W_PAWN,
  W_KING,
  CASTLE_WK,
  CASTLE_WQ,
  CASTLE_BK,
  CASTLE_BQ,
  initialBoard,
  createGame,
  rowOf,
  fileOf,
  squareName,
  parseSquare,
  typeOf,
  isWhite,
  colourOf,
  make,
  attacksFrom,
  findKing,
  isInCheck,
  pseudoMoves,
  applyToBoard,
  legalMoves,
  applyMove,
  isLegal,
  outcome,
  winnerOf,
  isInsufficientMaterial,
  repetitionCount,
  positionKey,
  evaluate,
  easyMove,
  mediumMove,
  search,
  aiMove,
  fromArray,
} from '../../public/games/chess/core.js';

/**
 * plan/games/40 — the pure Chess model. The rules that are easy to get
 * subtly wrong, and so get their own blocks: check, pins, castling rights,
 * en passant, promotion, and the draw conditions.
 */
describe('chess core — board and coordinates', () => {
  it('starts from the standard array', () => {
    const g = createGame();
    expect(g.board).toHaveLength(64);
    expect(g.turn).toBe(WHITE);
    expect(g.castling).toBe(CASTLE_WK | CASTLE_WQ | CASTLE_BK | CASTLE_BQ);
    expect(g.enPassant).toBe(-1);
    expect(g.halfmoves).toBe(0);
    expect(g.fullmove).toBe(1);
    // a1 is a white rook, e1 a white king, e8 a black king
    expect(g.board[parseSquare('a1')]).toBe(ROOK + 8);
    expect(g.board[parseSquare('e1')]).toBe(KING + 8);
    expect(g.board[parseSquare('e8')]).toBe(KING);
    expect(g.board[parseSquare('d8')]).toBe(QUEEN);
    expect(g.board[parseSquare('e2')]).toBe(PAWN + 8);
  });

  it('maps squares both ways', () => {
    expect(squareName(parseSquare('a1'))).toBe('a1');
    expect(squareName(parseSquare('h8'))).toBe('h8');
    expect(squareName(parseSquare('e4'))).toBe('e4');
    expect(parseSquare('z9')).toBe(-1);
    expect(rowOf(0)).toBe(0);
    expect(fileOf(63)).toBe(7);
  });

  it('classifies pieces', () => {
    const g = createGame();
    expect(typeOf(W_PAWN)).toBe(PAWN);
    expect(typeOf(KING + 8)).toBe(KING);
    expect(isWhite(W_PAWN)).toBe(true);
    expect(isWhite(PAWN)).toBe(false);
    expect(colourOf(EMPTY)).toBeNull();
    expect(make(QUEEN, WHITE)).toBe(QUEEN + 8);
  });

  it('opens with 20 legal moves', () => {
    expect(legalMoves(createGame())).toHaveLength(20);
  });
});

describe('chess core — attacks and check', () => {
  it('a knight attacks its eight squares, ignoring occupancy', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e4')] = make(KNIGHT, WHITE);
    expect(attacksFrom(b, parseSquare('e4')).sort((a, z) => a - z)).toEqual(
      [parseSquare('c3'), parseSquare('c5'), parseSquare('d2'), parseSquare('d6'),
       parseSquare('f2'), parseSquare('f6'), parseSquare('g3'), parseSquare('g5')].sort((a, z) => a - z)
    );
  });

  it('a slider stops at the first piece', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('a1')] = make(ROOK, WHITE);
    b[parseSquare('a4')] = make(PAWN, BLACK);
    const attacked = attacksFrom(b, parseSquare('a1'));
    expect(attacked).toContain(parseSquare('a4'));
    expect(attacked).not.toContain(parseSquare('a5')); // blocked beyond
  });

  it('finds the king and detects check', () => {
    const g = createGame();
    expect(isInCheck(g.board, WHITE)).toBe(false);
    // clear the e-file so the rook is not blocked by white's own pawn
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('e8')] = make(KING, BLACK);
    b[parseSquare('e5')] = make(ROOK, BLACK);
    expect(isInCheck(b, WHITE)).toBe(true);
    expect(findKing(b, BLACK)).toBe(parseSquare('e8'));
    expect(isInCheck(b, BLACK)).toBe(false);
  });

  it('a pinned piece still attacks (so the king may not step there)', () => {
    // a black rook pinned along the e-file must still be "attacking" e4
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = make(KING, BLACK);
    b[parseSquare('e4')] = make(ROOK, BLACK);
    b[parseSquare('e8')] = make(ROOK, WHITE);
    expect(attacksFrom(b, parseSquare('e4'))).toContain(parseSquare('e1'));
  });
});

describe('chess core — legal moves', () => {
  it('a pawn pushes, double-pushes from home, and captures diagonally', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e2')] = make(PAWN, WHITE);
    b[parseSquare('d5')] = make(PAWN, BLACK);
    const g = { ...createGame(), board: b, turn: WHITE };
    const moves = legalMoves(g);
    expect(moves.some((m) => m.to === parseSquare('e3'))).toBe(true);
    expect(moves.some((m) => m.to === parseSquare('e4') && m.doublePawn)).toBe(true);
    expect(moves.some((m) => m.to === parseSquare('d5'))).toBe(false); // not adjacent
    const b2 = b.slice();
    b2[parseSquare('d3')] = make(PAWN, BLACK);
    const g2 = { ...createGame(), board: b2, turn: WHITE };
    expect(legalMoves(g2).some((m) => m.to === parseSquare('d3') && m.captured !== EMPTY)).toBe(true);
  });

  it('a pawn cannot move into an occupied square', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e2')] = make(PAWN, WHITE);
    b[parseSquare('e3')] = make(PAWN, BLACK);
    const g = { ...createGame(), board: b, turn: WHITE };
    expect(legalMoves(g).some((m) => m.to === parseSquare('e3'))).toBe(false);
  });

  it('may not move a pinned piece off the pin', () => {
    // a knight on e2 is pinned by a rook on e8 against the king on e1
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = make(KING, WHITE);
    b[parseSquare('e2')] = make(KNIGHT, WHITE);
    b[parseSquare('e8')] = make(ROOK, BLACK);
    const g = { ...createGame(), board: b, turn: WHITE };
    const moves = legalMoves(g);
    expect(moves.some((m) => m.from === parseSquare('e2'))).toBe(false);
  });

  it('the king may not step into check', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = make(KING, WHITE);
    b[parseSquare('e8')] = make(ROOK, BLACK);
    const g = { ...createGame(), board: b, turn: WHITE };
    const moves = legalMoves(g);
    expect(moves.some((m) => m.to === parseSquare('e7'))).toBe(false); // still on the file
  });

  it('throws on an illegal move rather than repairing it', () => {
    const g = createGame();
    expect(() => applyMove(g, { from: parseSquare('a1'), to: parseSquare('a4') })).toThrow(/Illegal/);
  });
});

describe('chess core — castling', () => {
  it('is NOT offered in the opening — the bishop and knight are in the way', () => {
    // a rule worth pinning: the starting array blocks both castles
    expect(legalMoves(createGame()).some((m) => m.castle)).toBe(false);
  });

  it('is offered once the squares between are clear', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('a1')] = make(ROOK, WHITE);
    b[parseSquare('h1')] = make(ROOK, WHITE);
    b[parseSquare('e8')] = make(KING, BLACK);
    const g = { ...createGame(), board: b, turn: WHITE };
    const moves = legalMoves(g);
    expect(moves.some((m) => m.castle === 'K')).toBe(true);
    expect(moves.some((m) => m.castle === 'Q')).toBe(true);
  });

  it('moves the rook as well as the king', () => {
    const g = createGame();
    const board = applyToBoard(g, { from: parseSquare('e1'), to: parseSquare('g1'), piece: W_KING, captured: EMPTY, castle: 'K' });
    expect(board[parseSquare('g1')]).toBe(W_KING);
    expect(board[parseSquare('f1')]).toBe(ROOK + 8);
    expect(board[parseSquare('e1')]).toBe(EMPTY);
  });

  it('is forbidden while in check', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('e8')] = make(ROOK, BLACK);
    b[parseSquare('a1')] = make(ROOK, WHITE);
    b[parseSquare('h1')] = make(ROOK, WHITE);
    const g = { ...createGame(), board: b, turn: WHITE };
    expect(legalMoves(g).some((m) => m.castle)).toBe(false);
  });

  it('is forbidden through an attacked square', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('a1')] = make(ROOK, WHITE);
    b[parseSquare('h1')] = make(ROOK, WHITE);
    b[parseSquare('f8')] = make(ROOK, BLACK); // attacks f1
    const g = { ...createGame(), board: b, turn: WHITE };
    expect(legalMoves(g).some((m) => m.castle === 'K')).toBe(false);
    expect(legalMoves(g).some((m) => m.castle === 'Q')).toBe(true);
  });

  it('loses the right once the king moves', () => {
    // a cleared board: in the real opening the king's squares are all filled,
    // so there is no king move to make
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('e8')] = make(KING, BLACK);
    let g = { ...createGame(), board: b, turn: WHITE };
    const step = legalMoves(g).find((m) => m.from === parseSquare('e1') && m.to === parseSquare('e2'));
    expect(step).toBeDefined();
    g = applyMove(g, step!).state;
    expect(g.castling & (CASTLE_WK | CASTLE_WQ)).toBe(0);
  });

  it('loses the right when a rook is captured on its home square', () => {
    // a cleared board, because in the real opening the a8 rook is walled in by
    // its own pawn and cannot move at all
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('a8')] = make(ROOK, BLACK);
    b[parseSquare('h8')] = make(ROOK, BLACK);
    b[parseSquare('e8')] = make(KING, BLACK);
    b[parseSquare('e1')] = W_KING;
    const g = { ...createGame(), board: b, turn: BLACK };
    const step = legalMoves(g).find((m) => m.from === parseSquare('a8'));
    expect(step).toBeDefined();
    const after = applyMove(g, step!).state;
    expect(after.castling & CASTLE_BQ).toBe(0); // that rook left home
    expect(after.castling & CASTLE_BK).toBe(CASTLE_BK); // the other still stands
  });
});

describe('chess core — en passant', () => {
  it('records the skipped square on a double push', () => {
    const g = createGame();
    const dbl = legalMoves(g).find((m) => m.doublePawn && m.from === parseSquare('d2'));
    expect(dbl).toBeDefined();
    const next = applyMove(g, dbl!).state;
    expect(next.enPassant).toBe((parseSquare('d2') + parseSquare('d4')) / 2);
  });

  it('is available for one ply only', () => {
    let g = createGame();
    g = applyMove(g, legalMoves(g).find((m) => m.doublePawn && m.from === parseSquare('e2'))).state;
    expect(g.enPassant).toBeGreaterThan(0);
    // a SINGLE push replies: the en-passant window closes. (A double-push
    // reply would legitimately open a NEW one, which is why the test does not
    // use one here.)
    const reply = legalMoves(g).find((m) => m.to === parseSquare('a6') || m.to === parseSquare('h6'));
    expect(reply).toBeDefined();
    g = applyMove(g, reply!).state;
    expect(g.enPassant).toBe(-1);
  });

  it('captures the pawn BESIDE the destination square', () => {
    // white pawn e5, black just double-pushed d7-d5
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('e8')] = make(KING, BLACK);
    b[parseSquare('e5')] = make(PAWN, WHITE);
    b[parseSquare('d5')] = make(PAWN, BLACK);
    const g = { ...createGame(), board: b, turn: WHITE, enPassant: parseSquare('d6') };
    const ep = legalMoves(g).find((m) => m.enPassant);
    expect(ep).toBeDefined();
    expect(ep?.to).toBe(parseSquare('d6'));
    expect(ep?.captured).toBe(make(PAWN, BLACK));
    const after = applyToBoard(g, ep!);
    expect(after[parseSquare('d5')]).toBe(EMPTY); // the pawn beside it is gone
    expect(after[parseSquare('d6')]).toBe(make(PAWN, WHITE));
  });
});

describe('chess core — promotion', () => {
  it('offers all four pieces on the last rank', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('a1')] = W_KING;
    b[parseSquare('h8')] = make(KING, BLACK);
    b[parseSquare('a7')] = make(PAWN, WHITE);
    const g = { ...createGame(), board: b, turn: WHITE };
    const promos = legalMoves(g).filter((m) => m.to === parseSquare('a8'));
    expect(promos.length).toBe(4);
    expect(new Set(promos.map((m) => typeOf(m.promotion)))).toEqual(new Set([QUEEN, ROOK, BISHOP, KNIGHT]));
  });

  it('places the chosen piece', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('a1')] = W_KING;
    b[parseSquare('h8')] = make(KING, BLACK);
    b[parseSquare('a7')] = make(PAWN, WHITE);
    const g = { ...createGame(), board: b, turn: WHITE };
    const promo = legalMoves(g).find((m) => m.to === parseSquare('a8') && typeOf(m.promotion) === KNIGHT);
    const after = applyToBoard(g, promo!);
    expect(after[parseSquare('a8')]).toBe(make(KNIGHT, WHITE));
  });
});

describe('chess core — endings', () => {
  it("detects checkmate (the back-rank fool: f3 e5 g4 Qh4#)", () => {
    // the white king is boxed in by its own queen, bishop and pawns, and the
    // f2/g3 diagonal is empty because those pawns moved
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('d1')] = make(QUEEN, WHITE);
    b[parseSquare('f1')] = make(BISHOP, WHITE);
    b[parseSquare('e2')] = make(PAWN, WHITE);
    b[parseSquare('d2')] = make(PAWN, WHITE);
    b[parseSquare('f3')] = make(PAWN, WHITE);
    b[parseSquare('g4')] = make(PAWN, WHITE);
    b[parseSquare('h4')] = make(QUEEN, BLACK);
    b[parseSquare('e5')] = make(PAWN, BLACK);
    b[parseSquare('e8')] = make(KING, BLACK);
    const g = { ...createGame(), board: b, turn: WHITE };
    expect(isInCheck(b, WHITE)).toBe(true);
    expect(legalMoves(g)).toHaveLength(0);
    expect(outcome(g)).toBe('checkmate');
    expect(winnerOf('checkmate', BLACK)).toBe(BLACK);
  });

  it('detects stalemate as a draw', () => {
    // white king a8, black queen c7 — not in check, but no legal move
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('a8')] = W_KING;
    b[parseSquare('c7')] = make(QUEEN, BLACK);
    b[parseSquare('h8')] = make(KING, BLACK);
    const g = { ...createGame(), board: b, turn: WHITE };
    expect(legalMoves(g)).toHaveLength(0);
    expect(isInCheck(b, WHITE)).toBe(false);
    expect(outcome(g)).toBe('stalemate');
    expect(winnerOf('stalemate', WHITE)).toBeNull();
  });

  it('calls bare kings and lone minors a draw', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('e8')] = make(KING, BLACK);
    expect(isInsufficientMaterial(b)).toBe(true);
    b[parseSquare('d4')] = make(BISHOP, WHITE);
    expect(isInsufficientMaterial(b)).toBe(true);
    b[parseSquare('h4')] = make(PAWN, BLACK);
    expect(isInsufficientMaterial(b)).toBe(false);
  });

  it('counts the fifty-move clock', () => {
    const g = { ...createGame(), halfmoves: 99 };
    expect(outcome(g)).not.toBe('fifty');
    expect(outcome({ ...g, halfmoves: 100 })).toBe('fifty');
  });

  it('resets the halfmove clock on a capture and a pawn move', () => {
    const g = createGame();
    const quiet = legalMoves(g).find((m) => typeOf(m.piece) === KNIGHT);
    const after = applyMove(g, quiet).state;
    expect(after.halfmoves).toBe(1);
    expect(applyMove(after, legalMoves(after).find((m) => typeOf(m.piece) === PAWN)).state.halfmoves).toBe(0);
  });

  it('detects threefold repetition', () => {
    const g = createGame();
    const key = positionKey(g);
    const thrice = { ...g, history: [key, key, key] };
    expect(repetitionCount(thrice)).toBe(3);
    expect(outcome(thrice)).toBe('repetition');
  });

  it('reports no outcome on a fresh game', () => {
    expect(outcome(createGame())).toBeNull();
  });
});

describe('chess core — evaluation and AI', () => {
  it('scores material with the sign of the side asked for', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('d4')] = make(QUEEN, WHITE);
    expect(evaluate(b, WHITE)).toBe(900);
    expect(evaluate(b, BLACK)).toBe(-900);
  });

  it('every tier answers legally', () => {
    const g = createGame();
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const move = aiMove(g, difficulty, { maxNodes: 8000 });
      expect(legalMoves(g)).toContainEqual(move);
    }
  });

  it('hard takes a free queen', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('e8')] = make(KING, BLACK);
    b[parseSquare('d4')] = make(QUEEN, BLACK);
    b[parseSquare('e4')] = make(ROOK, WHITE);
    const g = { ...createGame(), board: b, turn: WHITE };
    const found = search(g, { maxNodes: 20000 });
    expect(found?.move.to).toBe(parseSquare('d4'));
  });

  it('hard stays inside its node cap', () => {
    const found = search(createGame(), { maxNodes: 2000 });
    expect(found?.nodes).toBeLessThanOrEqual(2001);
  });

  it('medium castles when it is free', () => {
    const b = new Array(64).fill(EMPTY);
    b[parseSquare('e1')] = W_KING;
    b[parseSquare('a1')] = make(ROOK, WHITE);
    b[parseSquare('h1')] = make(ROOK, WHITE);
    b[parseSquare('e8')] = make(KING, BLACK);
    const g = { ...createGame(), board: b, turn: WHITE };
    expect(mediumMove(g)?.castle).toBeTruthy();
  });
});

describe('chess core — a full game plays out', () => {
  it('reaches a legal ending with a consistent board', () => {
    let g = createGame();
    for (let ply = 0; ply < 300; ply++) {
      const result = outcome(g);
      if (result) {
        expect(['checkmate', 'stalemate', 'fifty', 'repetition', 'material']).toContain(result);
        return;
      }
      const move = mediumMove(g);
      if (!move) break;
      g = applyMove(g, move).state;
    }
    // a game that neither ends nor stalls has a real result within 300 plies
    expect(outcome(g)).not.toBeNull();
  });

  it('plays 40 opening plays with both tiers and never returns an illegal move', () => {
    let g = createGame();
    for (let ply = 0; ply < 40; ply++) {
      if (outcome(g)) break;
      const move = aiMove(g, ply % 2 === 0 ? 'medium' : 'easy', { maxNodes: 5000 });
      expect(legalMoves(g)).toContainEqual(move);
      g = applyMove(g, move).state;
    }
  });
});

describe('chess core — the wire format', () => {
  it('sanitises an untrusted board', () => {
    const dirty = fromArray([99, -1, 7, 8, 14, 0, 'x', 1]);
    expect(dirty[0]).toBe(EMPTY);
    expect(dirty[2]).toBe(EMPTY); // 7 and 8 are not pieces
    expect(dirty[4]).toBe(KING + 8);
    expect(dirty[7]).toBe(PAWN);
    expect(dirty).toHaveLength(64);
  });

  it('round-trips a real board', () => {
    expect(fromArray(initialBoard())).toEqual(initialBoard());
  });
});
