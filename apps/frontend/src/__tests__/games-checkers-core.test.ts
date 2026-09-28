import {
  BOARD_ROWS,
  SQUARES,
  RED,
  BLACK,
  RED_MAN,
  RED_KING,
  BLACK_MAN,
  BLACK_KING,
  CROWN_ROW,
  DRAW_QUIET_PLIES,
  rowOf,
  fileOf,
  squareAt,
  squareLabel,
  other,
  sideOf,
  isKing,
  forwardOf,
  countPieces,
  initialBoard,
  toArray,
  fromArray,
  legalMoves,
  jumpTargetsFrom,
  hasAnyJump,
  isLegalMove,
  applyMove,
  playChain,
  isStalemated,
  outcome,
  advancesClock,
  evaluate,
  chainLength,
  search,
  easyMove,
  mediumMove,
  hardDepth,
  aiMove,
  captureMoves,
} from '../../public/games/checkers/core.js';

/**
 * plan/games/06 — the pure Checkers model. The plan calls this the most
 * complex model in the family and names the bug farm: forced-capture
 * filtering, multi-jump continuation/termination, crowning, and the quiet-move
 * draw guard. Each gets its own block below.
 *
 * Fixtures are written as (row, file) and go through squareAt(), which throws
 * on a light square — a playable square always has an ODD row+file.
 */

/** A blank board to place pieces on. */
function empty() {
  return new Uint8Array(SQUARES);
}

/** Place `piece` on the square at (row, file) — a readable test fixture. */
function withPiece(board, row, file, piece) {
  const sq = squareAt(row, file);
  if (sq < 0) throw new Error(`(${row},${file}) is not a playable square`);
  board[sq] = piece;
  return board;
}

/** The (row, file) step `side` could play, as a move, or undefined. */
function stepFrom(board, side, fromRow, fromFile, toRow, toFile) {
  return legalMoves(board, side).find(
    (m) => m.from === squareAt(fromRow, fromFile) && m.to === squareAt(toRow, toFile)
  );
}

function canMoveTo(board, side, fromRow, fromFile, toRow, toFile) {
  return stepFrom(board, side, fromRow, fromFile, toRow, toFile) !== undefined;
}

describe('checkers core — geometry', () => {
  it('maps all 32 dark squares on and off the board', () => {
    expect(SQUARES).toBe(32);
    expect(BOARD_ROWS).toBe(8);
    const seen = new Set<number>();
    for (let row = 0; row < 8; row++) {
      for (let file = 0; file < 8; file++) {
        const sq = squareAt(row, file);
        if (sq < 0) continue;
        // even rows sit on odd files, odd rows on even files — never both
        expect(file % 2).toBe(row % 2 === 0 ? 1 : 0);
        expect(rowOf(sq)).toBe(row);
        expect(fileOf(sq)).toBe(file);
        seen.add(sq);
      }
    }
    expect(seen.size).toBe(32);
  });

  it('rejects the light squares and the off-board edges', () => {
    expect(squareAt(0, 0)).toBe(-1);
    expect(squareAt(1, 1)).toBe(-1);
    expect(squareAt(-1, 3)).toBe(-1);
    expect(squareAt(8, 3)).toBe(-1);
    expect(squareAt(3, -1)).toBe(-1);
    expect(squareAt(3, 8)).toBe(-1);
  });

  it('labels squares a1..h8', () => {
    expect(squareLabel(squareAt(0, 1))).toBe('b1');
    expect(squareLabel(squareAt(7, 0))).toBe('a8');
  });

  it('classifies pieces and sides', () => {
    expect(sideOf(RED_MAN)).toBe(RED);
    expect(sideOf(BLACK_KING)).toBe(BLACK);
    expect(sideOf(0)).toBe(0);
    expect(isKing(RED_KING)).toBe(true);
    expect(isKing(BLACK_MAN)).toBe(false);
    expect(other(RED)).toBe(BLACK);
    expect(forwardOf(RED)).toBe(-1);
    expect(forwardOf(BLACK)).toBe(1);
    expect(CROWN_ROW[RED]).toBe(0);
    expect(CROWN_ROW[BLACK]).toBe(7);
  });

  it('starts 12 a side, red at the bottom, black at the top', () => {
    const board = initialBoard();
    expect(countPieces(board, RED)).toEqual({ men: 12, kings: 0, total: 12 });
    expect(countPieces(board, BLACK)).toEqual({ men: 12, kings: 0, total: 12 });
    expect(rowOf(board.findIndex((p) => p !== 0))).toBe(0); // black's back row
    expect(rowOf(board.findLastIndex((p) => p !== 0))).toBe(7); // red's back row
    expect(board[squareAt(0, 1)]).toBe(BLACK_MAN);
    expect(board[squareAt(5, 0)]).toBe(RED_MAN);
  });

  it('survives a JSON round trip (the wire format)', () => {
    const board = initialBoard();
    expect(toArray(fromArray(toArray(board)))).toEqual(toArray(board));
    // junk in, empty out — never a poisoned square
    const dirty = fromArray([99, -4, 'x', null, undefined]);
    expect(dirty[0]).toBe(0);
    expect(dirty[1]).toBe(0);
  });
});

describe('checkers core — simple moves', () => {
  it('opens with exactly 7 legal moves', () => {
    // red's first ply: 4 men on row 5 and 3 on row 6 can step up
    expect(legalMoves(initialBoard(), RED)).toHaveLength(7);
  });

  it('moves a man one diagonal forward only', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    expect(legalMoves(board, RED)).toEqual([
      { from: squareAt(4, 3), to: squareAt(3, 2) },
      { from: squareAt(4, 3), to: squareAt(3, 4) },
    ]);
    // sideways and backwards are not moves
    expect(canMoveTo(board, RED, 4, 3, 4, 5)).toBe(false);
    expect(canMoveTo(board, RED, 4, 3, 5, 2)).toBe(false);
  });

  it('moves a king in all four directions', () => {
    const board = withPiece(empty(), 4, 3, RED_KING);
    expect(legalMoves(board, RED)).toHaveLength(4);
    expect(canMoveTo(board, RED, 4, 3, 3, 4)).toBe(true);
    expect(canMoveTo(board, RED, 4, 3, 5, 2)).toBe(true);
  });

  it('never moves onto an occupied square', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    withPiece(board, 3, 2, RED_KING);
    expect(canMoveTo(board, RED, 4, 3, 3, 2)).toBe(false);
    expect(canMoveTo(board, RED, 4, 3, 3, 4)).toBe(true);
  });

  it('refuses a move for the side that does not own the piece', () => {
    expect(legalMoves(withPiece(empty(), 4, 3, RED_MAN), BLACK)).toEqual([]);
  });

  it('applies a slide, hands the turn over, and keeps the piece a man', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    const r = applyMove(board, RED, { from: squareAt(4, 3), to: squareAt(3, 2) });
    expect(r.captured).toBeNull();
    expect(r.crowned).toBe(false);
    expect(r.chain).toBe(false);
    expect(r.turn).toBe(BLACK);
    expect(r.board[squareAt(3, 2)]).toBe(RED_MAN);
    expect(r.board[squareAt(4, 3)]).toBe(0);
  });

  it('throws on an illegal step rather than repairing it', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    expect(() => applyMove(board, RED, { from: squareAt(4, 3), to: squareAt(5, 2) })).toThrow(
      /Illegal/
    );
    expect(() => applyMove(board, RED, null)).toThrow();
  });
});

describe('checkers core — forced captures', () => {
  it('jumps exactly one piece into the empty square behind it', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    withPiece(board, 3, 4, BLACK_MAN);
    expect(legalMoves(board, RED)).toEqual([
      { from: squareAt(4, 3), to: squareAt(2, 5), over: squareAt(3, 4) },
    ]);
  });

  it('FORCES the jump — the quiet slides are not offered', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    withPiece(board, 3, 4, BLACK_MAN);
    withPiece(board, 5, 0, RED_MAN); // this man has a perfectly legal quiet step
    expect(canMoveTo(board, RED, 5, 0, 4, 1)).toBe(false);
    expect(canMoveTo(board, RED, 4, 3, 3, 2)).toBe(false);
    expect(captureMoves(board, RED)).toHaveLength(1);
  });

  it('forces captures for the side that must move, not the other side', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    withPiece(board, 3, 2, BLACK_MAN); // red jumps it to (2,1)
    withPiece(board, 5, 4, BLACK_MAN); // …and blocks black's counter-jump landing
    expect(captureMoves(board, RED)).toHaveLength(1);
    expect(legalMoves(board, BLACK).every((m) => m.over === undefined)).toBe(true);
    expect(legalMoves(board, BLACK).length).toBeGreaterThan(0);
  });

  it('will not jump over its own piece, or land on an occupied square', () => {
    const own = withPiece(empty(), 4, 3, RED_MAN);
    withPiece(own, 3, 4, RED_KING);
    expect(jumpTargetsFrom(own, squareAt(4, 3), RED)).toEqual([]);

    const blocked = withPiece(empty(), 4, 3, RED_MAN);
    withPiece(blocked, 3, 4, BLACK_MAN);
    withPiece(blocked, 2, 5, BLACK_MAN); // the landing square is taken
    expect(jumpTargetsFrom(blocked, squareAt(4, 3), RED)).toEqual([]);
  });

  it('lets a king jump in all four directions', () => {
    const board = withPiece(empty(), 4, 3, RED_KING);
    withPiece(board, 3, 4, BLACK_MAN);
    withPiece(board, 5, 2, BLACK_MAN);
    const targets = jumpTargetsFrom(board, squareAt(4, 3), RED).map((m) => m.to);
    expect(targets).toEqual(expect.arrayContaining([squareAt(2, 5), squareAt(6, 1)]));
    expect(targets).toHaveLength(2);
  });

  it('offers every available jump, not just the first', () => {
    const board = empty();
    withPiece(board, 4, 3, RED_MAN);
    withPiece(board, 3, 4, BLACK_MAN); // red jumps to (2,5)
    withPiece(board, 2, 7, RED_MAN);
    withPiece(board, 1, 6, BLACK_MAN); // and that man jumps to (0,5)
    expect(captureMoves(board, RED)).toHaveLength(2);
    expect(hasAnyJump(board, RED)).toBe(true);
  });

  it('removes the captured man and marks the step', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    withPiece(board, 3, 4, BLACK_MAN);
    const r = applyMove(board, RED, { from: squareAt(4, 3), to: squareAt(2, 5) });
    expect(r.captured).toBe(squareAt(3, 4));
    expect(r.board[squareAt(3, 4)]).toBe(0);
    expect(r.board[squareAt(2, 5)]).toBe(RED_MAN);
    expect(r.move.over).toBe(squareAt(3, 4));
    expect(isLegalMove(board, RED, r.move)).toBe(true);
  });
});

describe('checkers core — multi-jump chains', () => {
  /** A red man on (6,1) with a two-hop run: over (5,2) to (4,3), then over (3,4) to (2,5). */
  function chainBoard() {
    const board = empty();
    withPiece(board, 6, 1, RED_MAN);
    withPiece(board, 5, 2, BLACK_MAN);
    withPiece(board, 3, 4, BLACK_MAN);
    return board;
  }

  it('keeps the turn on the same side while jumps remain', () => {
    const r = applyMove(chainBoard(), RED, { from: squareAt(6, 1), to: squareAt(4, 3) });
    expect(r.chain).toBe(true);
    expect(r.turn).toBe(RED);
    // and the continuation is ONLY the piece that is mid-jump
    expect(legalMoves(r.board, RED, r.move.to)).toEqual([
      { from: squareAt(4, 3), to: squareAt(2, 5), over: squareAt(3, 4) },
    ]);
  });

  it('ends the chain when no jump is left', () => {
    const first = applyMove(chainBoard(), RED, { from: squareAt(6, 1), to: squareAt(4, 3) });
    const second = applyMove(first.board, RED, { from: squareAt(4, 3), to: squareAt(2, 5) });
    expect(second.chain).toBe(false);
    expect(second.turn).toBe(BLACK);
    expect(countPieces(second.board, BLACK).total).toBe(0); // both men gone
  });

  it('cannot continue the chain with a different piece', () => {
    const board = chainBoard();
    withPiece(board, 4, 7, RED_KING); // a second red piece that has jumps of its own
    const first = applyMove(board, RED, { from: squareAt(6, 1), to: squareAt(4, 3) });
    const continuation = legalMoves(first.board, RED, first.move.to);
    expect(continuation).toHaveLength(1);
    expect(continuation[0].from).toBe(squareAt(4, 3));
  });

  it('cannot be cut short — a slide is illegal mid-chain', () => {
    const first = applyMove(chainBoard(), RED, { from: squareAt(6, 1), to: squareAt(4, 3) });
    // (4,3) → (3,2) is a quiet diagonal, but the chain must carry on
    expect(isLegalMove(first.board, RED, { from: squareAt(4, 3), to: squareAt(3, 2) })).toBe(false);
  });

  it('plays a whole chain step by step', () => {
    const {
      steps,
      board: after,
      turn,
    } = playChain(chainBoard(), RED, { from: squareAt(6, 1), to: squareAt(4, 3) }, [
      { from: squareAt(4, 3), to: squareAt(2, 5) },
    ]);
    expect(steps).toHaveLength(2);
    expect(turn).toBe(BLACK);
    expect(countPieces(after, BLACK).total).toBe(0);
  });

  it('measures the chain length for move ordering', () => {
    expect(chainLength(chainBoard(), squareAt(6, 1), RED)).toBe(2);
    const solo = withPiece(empty(), 4, 3, RED_MAN);
    withPiece(solo, 3, 4, BLACK_MAN);
    expect(chainLength(solo, squareAt(4, 3), RED)).toBe(1);
  });
});

describe('checkers core — kings and crowning', () => {
  it('crowns a man that jumps onto the far row and ends the turn there', () => {
    const board = withPiece(empty(), 2, 3, RED_MAN);
    withPiece(board, 1, 4, BLACK_MAN);
    const r = applyMove(board, RED, { from: squareAt(2, 3), to: squareAt(0, 5) });
    expect(r.captured).toBe(squareAt(1, 4));
    expect(r.crowned).toBe(true);
    expect(r.chain).toBe(false);
    expect(r.turn).toBe(BLACK);
    expect(r.board[squareAt(0, 5)]).toBe(RED_KING);
  });

  it('crowns on the plain slide to the far row too', () => {
    const board = withPiece(empty(), 1, 2, RED_MAN);
    const r = applyMove(board, RED, { from: squareAt(1, 2), to: squareAt(0, 1) });
    expect(r.crowned).toBe(true);
    expect(r.board[squareAt(0, 1)]).toBe(RED_KING);
  });

  it('crowns black on row 7', () => {
    const board = withPiece(empty(), 6, 5, BLACK_MAN);
    const r = applyMove(board, BLACK, { from: squareAt(6, 5), to: squareAt(7, 6) });
    expect(r.crowned).toBe(true);
    expect(r.board[squareAt(7, 6)]).toBe(BLACK_KING);
  });

  it('does not crown a man on any other row', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    expect(applyMove(board, RED, { from: squareAt(4, 3), to: squareAt(3, 2) }).crowned).toBe(false);
  });

  it('a crowned king retreats — captures both ways', () => {
    const board = withPiece(empty(), 2, 3, RED_KING);
    withPiece(board, 3, 4, BLACK_MAN); // behind the king, down-board
    expect(jumpTargetsFrom(board, squareAt(2, 3), RED)).toEqual([
      { from: squareAt(2, 3), to: squareAt(4, 5), over: squareAt(3, 4) },
    ]);
  });
});

describe('checkers core — outcome and the draw guard', () => {
  it('is stalemated with no pieces', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    expect(isStalemated(board, BLACK)).toBe(true);
    expect(isStalemated(board, RED)).toBe(false);
  });

  it('is stalemated when every piece is walled in', () => {
    const board = empty();
    withPiece(board, 3, 2, RED_MAN);
    // block both slides AND both jump landings — a blocked jump is not a move
    withPiece(board, 2, 1, BLACK_MAN);
    withPiece(board, 2, 3, BLACK_MAN);
    withPiece(board, 1, 0, BLACK_MAN);
    withPiece(board, 1, 4, BLACK_MAN);
    expect(legalMoves(board, RED)).toHaveLength(0);
    expect(legalMoves(board, BLACK).length).toBeGreaterThan(0); // black itself is not stuck
    expect(isStalemated(board, RED)).toBe(true);
  });

  it('reports a win for the side that just moved', () => {
    const blackGone = withPiece(empty(), 4, 3, RED_MAN);
    expect(outcome(blackGone, RED, 0)).toBe(RED);

    const redGone = withPiece(empty(), 4, 3, BLACK_MAN);
    expect(outcome(redGone, BLACK, 0)).toBe(BLACK);
  });

  it('calls a draw only after the quiet-move limit, and not before', () => {
    const board = initialBoard();
    expect(outcome(board, RED, DRAW_QUIET_PLIES - 1)).toBeNull();
    expect(outcome(board, RED, DRAW_QUIET_PLIES)).toBe('draw');
  });

  it('lets a win beat the draw clock', () => {
    const board = withPiece(empty(), 4, 3, RED_MAN);
    expect(outcome(board, RED, DRAW_QUIET_PLIES + 10)).toBe(RED);
  });

  it('resets the quiet clock on a capture and on a man advancing', () => {
    const slide = withPiece(empty(), 4, 3, RED_MAN);
    expect(advancesClock(slide, RED, { from: squareAt(4, 3), to: squareAt(3, 2) })).toBe(true);

    const retreat = withPiece(empty(), 3, 2, RED_KING);
    expect(advancesClock(retreat, RED, { from: squareAt(3, 2), to: squareAt(4, 1) })).toBe(false);

    const jump = withPiece(empty(), 4, 3, RED_MAN);
    withPiece(jump, 3, 4, BLACK_MAN);
    expect(advancesClock(jump, RED, { from: squareAt(4, 3), to: squareAt(2, 5) })).toBe(true);
  });
});

describe('checkers core — AI tiers', () => {
  it('easy picks a uniformly random legal move', () => {
    const board = initialBoard();
    const legal = legalMoves(board, RED);
    for (let i = 0; i < 20; i++) {
      expect(legal).toContainEqual(easyMove(board, RED));
    }
    expect(easyMove(withPiece(empty(), 4, 3, RED_MAN), RED)).not.toBeNull();
    expect(easyMove(empty(), RED)).toBeNull();
  });

  it('medium always takes an available capture', () => {
    const board = empty();
    withPiece(board, 4, 1, RED_MAN);
    withPiece(board, 3, 2, BLACK_MAN);
    withPiece(board, 2, 5, RED_MAN);
    withPiece(board, 3, 4, BLACK_MAN);
    expect(mediumMove(board, RED).over).toBeDefined();
  });

  it('medium prefers the longer chain', () => {
    const board = empty();
    withPiece(board, 6, 1, RED_MAN); // a two-hop chain: (6,1) → (4,3) → (2,5)
    withPiece(board, 5, 2, BLACK_MAN);
    withPiece(board, 3, 4, BLACK_MAN);
    withPiece(board, 1, 0, RED_KING); // a one-hop alternative, clear of the chain
    withPiece(board, 2, 1, BLACK_MAN);
    expect(chainLength(board, squareAt(6, 1), RED)).toBe(2);
    expect(chainLength(board, squareAt(1, 0), RED)).toBe(1);
    expect(mediumMove(board, RED).from).toBe(squareAt(6, 1));
  });

  it('medium does not walk a man into an enemy jump when it can help it', () => {
    const board = empty();
    withPiece(board, 4, 1, RED_MAN); // c4 hands black a jump; a4 does not
    withPiece(board, 2, 3, BLACK_KING);
    withPiece(board, 6, 5, RED_MAN);
    const risky = applyMove(board, RED, { from: squareAt(4, 1), to: squareAt(3, 2) });
    expect(jumpTargetsFrom(risky.board, squareAt(2, 3), BLACK)).toHaveLength(1);
    const move = mediumMove(board, RED);
    expect(move.to).not.toBe(squareAt(3, 2));
    expect(move.to).toBe(squareAt(3, 0)); // the safe square, and the most advanced one
  });

  it('hard finds the winning capture in a one-piece race', () => {
    const board = empty();
    withPiece(board, 6, 3, RED_KING);
    withPiece(board, 5, 4, BLACK_MAN); // black's last man, and the forced jump
    const found = search(board, RED, 5, { maxNodes: 20000 });
    expect(found.move.over).toBe(squareAt(5, 4));
    const r = applyMove(board, RED, found.move);
    expect(isStalemated(r.board, BLACK)).toBe(true);
  });

  it('hard answers every position with a legal move and stays inside its node cap', () => {
    const board = initialBoard();
    const found = search(board, RED, 4, { maxNodes: 5000 });
    expect(legalMoves(board, RED)).toContainEqual(found.move);
    expect(found.nodes).toBeLessThanOrEqual(5001);
  });

  it('spends more depth on thin endgames than on the opening', () => {
    const endgame = empty();
    withPiece(endgame, 4, 3, RED_KING);
    withPiece(endgame, 3, 4, BLACK_KING);
    expect(hardDepth(endgame, RED)).toBeGreaterThan(hardDepth(initialBoard(), RED));
  });

  it('routes every tier through aiMove', () => {
    const board = initialBoard();
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      expect(legalMoves(board, RED)).toContainEqual(
        aiMove(board, RED, difficulty, { maxNodes: 20000 })
      );
    }
    expect(aiMove(empty(), RED, 'hard')).toBeNull();
  });

  it('values a king above a man', () => {
    const king = withPiece(empty(), 4, 3, RED_KING);
    const man = withPiece(empty(), 4, 3, RED_MAN);
    expect(evaluate(king, RED)).toBeGreaterThan(evaluate(man, RED));
  });

  it('values an advanced man above one still at home', () => {
    const advanced = withPiece(empty(), 2, 3, RED_MAN);
    const home = withPiece(empty(), 6, 1, RED_MAN);
    expect(evaluate(advanced, RED)).toBeGreaterThan(evaluate(home, RED));
  });

  it('loses ground when a man is taken', () => {
    const even = empty();
    withPiece(even, 4, 3, RED_MAN);
    withPiece(even, 4, 7, BLACK_MAN);
    const downOne = empty();
    withPiece(downOne, 4, 3, RED_MAN);
    expect(evaluate(even, RED)).toBeLessThan(evaluate(downOne, RED));
  });
});

describe('checkers core — a full game plays out', () => {
  it('resolves in a legal result when hard plays hard from the opening', () => {
    let board = initialBoard();
    let side = RED;
    let quiet = 0;
    for (let plies = 0; plies < 200; plies++) {
      const result = outcome(board, other(side), quiet);
      if (result !== null) {
        expect([RED, BLACK, 'draw']).toContain(result);
        return;
      }
      const move = aiMove(board, side, 'hard', { maxNodes: 6000 });
      expect(move).not.toBeNull();
      quiet = advancesClock(board, side, move) ? 0 : quiet + 1;
      const r = applyMove(board, side, move);
      board = r.board;
      if (!r.chain) side = other(side);
    }
    // 200 plies without a result is a stuck game, not a slow one
    throw new Error('checkers did not resolve within 200 plies');
  });

  it('never returns an illegal move over a whole medium-vs-medium series', () => {
    let board = initialBoard();
    let side = RED;
    for (let plies = 0; plies < 120; plies++) {
      if (isStalemated(board, side)) return;
      const move = mediumMove(board, side);
      expect(legalMoves(board, side)).toContainEqual(move);
      const r = applyMove(board, side, move);
      board = r.board;
      if (!r.chain) side = other(side);
    }
  });
});
