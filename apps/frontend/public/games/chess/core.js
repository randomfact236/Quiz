/**
 * ============================================================================
 * core.js — Chess (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/40-chess.md. The full ruleset: every piece, castling, en
 * passant, promotion, check, checkmate, stalemate and the draw conditions.
 *
 * BOARD — a 64-entry array, index 0 = a1, 63 = h8, so it survives JSON
 * untouched. A piece is a NUMBER, not a string: 1-6 are black P N B R Q K
 * and 9-14 are the same in white, with 0 empty. Small integers keep the
 * board cheap to copy in move generation and easy to compare for repetition.
 *
 * The STARTING ARRAY is a rules constant (like Go's empty board and
 * Othello's centre discs), not served content — every other piece is played.
 * ============================================================================
 */

export const WHITE = true;
export const BLACK = false;

export const EMPTY = 0;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

/** Piece numbers for white; black is the same type offset by 8. */
export const W_PAWN = 9, W_KNIGHT = 10, W_BISHOP = 11, W_ROOK = 12, W_QUEEN = 13, W_KING = 14;

export const FILES = 'abcdefgh';

export const CASTLE_WK = 1, CASTLE_WQ = 2, CASTLE_BK = 4, CASTLE_BQ = 8;

/** The standard opening array — a rules constant, not served content. */
export function initialBoard() {
  const b = new Array(64).fill(EMPTY);
  const back = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];
  for (let f = 0; f < 8; f++) {
    b[f] = back[f] + 8; // black back rank
    b[8 + f] = PAWN + 8; // black pawns
    b[48 + f] = PAWN; // white pawns
    b[56 + f] = back[f]; // white back rank
  }
  return b;
}

export function createGame() {
  return {
    board: initialBoard(),
    turn: WHITE,
    // castling rights as a bitmask, cleared as the king/rooks move
    castling: CASTLE_WK | CASTLE_WQ | CASTLE_BK | CASTLE_BQ,
    /** square a pawn may capture onto, for one ply only (en passant) */
    enPassant: -1,
    /** halfmove clock — 100 plies without a capture or pawn move is a draw */
    halfmoves: 0,
    /** fullmove number, starting at 1 */
    fullmove: 1,
    /** positions seen, for threefold repetition */
    history: [],
  };
}

/* ---- coordinates ------------------------------------------------------------- */

export function rowOf(sq) {
  return Math.floor(sq / 8);
}

export function fileOf(sq) {
  return sq % 8;
}

export function onBoard(sq) {
  return sq >= 0 && sq < 64;
}

export function squareName(sq) {
  return FILES[fileOf(sq)] + (rowOf(sq) + 1);
}

export function parseSquare(name) {
  const f = FILES.indexOf(name[0]);
  const r = Number(name[1]) - 1;
  return f >= 0 && r >= 0 && r < 8 ? r * 8 + f : -1;
}

/* ---- pieces -------------------------------------------------------------------- */

export function typeOf(piece) {
  const t = piece % 8;
  return t === 0 ? PAWN : t;
}

export function isWhite(piece) {
  return piece >= 9;
}

export function isBlack(piece) {
  return piece > 0 && piece < 9;
}

export function colourOf(piece) {
  return piece === EMPTY ? null : isWhite(piece);
}

/** A piece number for the given type and colour. */
export function make(type, white) {
  return white ? type + 8 : type;
}

const KNIGHT_DELTAS = [
  [1, 2], [2, 1], [2, -1], [1, -2],
  [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
const KING_DELTAS = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
];
const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/* ---- attacks (ignore pins — legality is decided separately) ---------------------- */

/**
 * Squares `piece` on `from` attacks. This is the "would it be capture-able"
 * question, which is what check detection and king moves both need — it is
 * NOT the same as the legal move list, because a pinned piece still attacks.
 */
export function attacksFrom(board, from) {
  const piece = board[from];
  if (piece === EMPTY) return [];
  const type = typeOf(piece);
  const white = isWhite(piece);
  const r = rowOf(from);
  const f = fileOf(from);
  const out = [];

  if (type === PAWN) {
    const dir = white ? 1 : -1;
    for (const df of [-1, 1]) {
      const nr = r + dir;
      const nf = f + df;
      if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) out.push(nr * 8 + nf);
    }
    return out;
  }
  if (type === KNIGHT || type === KING) {
    const deltas = type === KNIGHT ? KNIGHT_DELTAS : KING_DELTAS;
    for (const [dr, df] of deltas) {
      const nr = r + dr;
      const nf = f + df;
      if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) out.push(nr * 8 + nf);
    }
    return out;
  }
  const dirs = type === BISHOP ? BISHOP_DIRS : type === ROOK ? ROOK_DIRS : BISHOP_DIRS.concat(ROOK_DIRS);
  for (const [dr, df] of dirs) {
    let nr = r + dr;
    let nf = f + df;
    while (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) {
      const sq = nr * 8 + nf;
      out.push(sq);
      if (board[sq] !== EMPTY) break; // a piece blocks beyond it
      nr += dr;
      nf += df;
    }
  }
  return out;
}

export function findKing(board, white) {
  const king = make(KING, white);
  for (let sq = 0; sq < 64; sq++) if (board[sq] === king) return sq;
  return -1;
}

/** Is `side`'s king attacked on `board`? */
export function isInCheck(board, side) {
  const king = findKing(board, side);
  if (king < 0) return false;
  const foe = !side;
  for (let sq = 0; sq < 64; sq++) {
    if (colourOf(board[sq]) !== foe) continue;
    if (attacksFrom(board, sq).indexOf(king) !== -1) return true;
  }
  return false;
}

/* ---- move generation ------------------------------------------------------------- */

/** A move is `{ from, to, piece, captured, promotion, flags }`. */
function mv(from, to, piece, captured = EMPTY, extra = {}) {
  return { from, to, piece, captured, promotion: 0, ...extra };
}

/** Pseudo-legal moves: pieces that move legally EXCLUDING the king-safety rule. */
export function pseudoMoves(state) {
  const { board, turn, castling, enPassant } = state;
  const out = [];
  const forward = turn ? 1 : -1;
  // The array runs a1→h8, so white (starting on row 1) moves UP toward row 7
  // and crowns there; black starts on row 6 and crowns on row 0.
  const startRow = turn ? 1 : 6;
  const promoRow = turn ? 7 : 0;

  for (let from = 0; from < 64; from++) {
    const piece = board[from];
    if (piece === EMPTY || colourOf(piece) !== turn) continue;
    const type = typeOf(piece);

    if (type === PAWN) {
      const r = rowOf(from);
      const f = fileOf(from);
      // pushes
      const one = (r + forward) * 8 + f;
      if (onBoard(one) && board[one] === EMPTY) {
        if (r + forward === promoRow) {
          for (const p of [QUEEN, ROOK, BISHOP, KNIGHT]) out.push(mv(from, one, piece, EMPTY, { promotion: make(p, turn) }));
        } else {
          out.push(mv(from, one, piece));
          const start = startRow * 8 + f;
          if (from === start) {
            const two = (r + 2 * forward) * 8 + f;
            if (board[two] === EMPTY) out.push(mv(from, two, piece, EMPTY, { doublePawn: true }));
          }
        }
      }
      // captures
      for (const df of [-1, 1]) {
        const nr = r + forward;
        const nf = f + df;
        if (nr < 0 || nr > 7 || nf < 0 || nf > 7) continue;
        const to = nr * 8 + nf;
        if (board[to] !== EMPTY && colourOf(board[to]) !== turn) {
          if (nr === promoRow) {
            for (const p of [QUEEN, ROOK, BISHOP, KNIGHT]) out.push(mv(from, to, piece, board[to], { promotion: make(p, turn) }));
          } else {
            out.push(mv(from, to, piece, board[to]));
          }
        } else if (to === enPassant) {
          // the captured pawn sits BESIDE the moving one, not on the target
          out.push(mv(from, to, piece, make(PAWN, !turn), { enPassant: true }));
        }
      }
      continue;
    }

    if (type === KNIGHT || type === KING) {
      for (const to of attacksFrom(board, from)) {
        if (board[to] !== EMPTY && colourOf(board[to]) === turn) continue;
        out.push(mv(from, to, piece, board[to]));
      }
      continue;
    }

    for (const to of attacksFrom(board, from)) {
      if (board[to] !== EMPTY) {
        if (colourOf(board[to]) !== turn) out.push(mv(from, to, piece, board[to]));
        continue; // a friendly piece blocks, and everything beyond it
      }
      out.push(mv(from, to, piece));
    }
  }

  // castling — generated here, filtered by legality() for the safety rules.
  // The array runs a1→h8, so WHITE's king is on e1 = 4 and its back rank is
  // row 0; BLACK's is e8 = 60 and row 7. (Getting this pair the wrong way
  // round silently offered no castling at all.)
  const kingSq = turn ? 4 : 60;
  const canCastle =
    (turn ? castling & (CASTLE_WK | CASTLE_WQ) : castling & (CASTLE_BK | CASTLE_BQ)) !== 0;
  if (canCastle && board[kingSq] === make(KING, turn) && !isInCheck(board, turn)) {
    const rank = turn ? 0 : 7;
    const kSide = castling & (turn ? CASTLE_WK : CASTLE_BK);
    const qSide = castling & (turn ? CASTLE_WQ : CASTLE_BQ);
    const emptyBetween = (squares) => squares.every((s) => board[s] === EMPTY);
    if (kSide && board[rank * 8 + 7] === make(ROOK, turn) && emptyBetween([rank * 8 + 5, rank * 8 + 6])) {
      out.push(mv(kingSq, rank * 8 + 6, board[kingSq], EMPTY, { castle: turn ? 'K' : 'k' }));
    }
    if (qSide && board[rank * 8] === make(ROOK, turn) && emptyBetween([rank * 8 + 1, rank * 8 + 2, rank * 8 + 3])) {
      out.push(mv(kingSq, rank * 8 + 2, board[kingSq], EMPTY, { castle: turn ? 'Q' : 'q' }));
    }
  }
  return out;
}

/** Apply a pseudo-legal move to a board, returning the new board. */
export function applyToBoard(state, move) {
  const board = state.board.slice();
  board[move.from] = EMPTY;
  board[move.to] = move.promotion || move.piece;
  if (move.enPassant) {
    // the captured pawn sits on the MOVING pawn's rank, one file across —
    // (from + to) / 2 is a half-integer here, so it addressed no square at all
    board[rowOf(move.from) * 8 + fileOf(move.to)] = EMPTY;
  }
  if (move.castle) {
    // the rook jumps to the other side of the king
    const rank = rowOf(move.to);
    const kingSide = move.castle === 'K' || move.castle === 'k';
    const rookFrom = kingSide ? rank * 8 + 7 : rank * 8;
    const rookTo = kingSide ? rank * 8 + 5 : rank * 8 + 3;
    board[rookTo] = board[rookFrom];
    board[rookFrom] = EMPTY;
  }
  return board;
}

/** Would `side` be in check if this move were played? */
function leavesKingInCheck(state, move) {
  const next = { ...state, board: applyToBoard(state, move) };
  return isInCheck(next.board, state.turn);
}

/**
 * Castling has its own extra rule: the king may not pass THROUGH an attacked
 * square on the way, only land safely. Checking only the final position (as
 * the pin rule does) let the king walk straight through check.
 */
function castleIsSafe(state, move) {
  if (!move.castle) return true;
  const rank = rowOf(move.to);
  const pass = move.castle === 'K' || move.castle === 'k' ? rank * 8 + 5 : rank * 8 + 3;
  const board = state.board.slice();
  board[move.from] = EMPTY;
  board[pass] = make(KING, state.turn);
  return !isInCheck(board, state.turn);
}

/** Every LEGAL move: pseudo-legal, minus anything that exposes the king. */
export function legalMoves(state) {
  return pseudoMoves(state).filter(
    (m) => !leavesKingInCheck(state, m) && castleIsSafe(state, m)
  );
}

/* ---- playing --------------------------------------------------------------------- */

/**
 * Play a move and return the next state. Throws on an illegal move so the
 * server can reject rather than repair (the same contract as every other game
 * in the family).
 */
export function applyMove(state, move) {
  if (!isLegal(state, move)) throw new Error('Illegal chess move');
  const board = applyToBoard(state, move);

  let castling = state.castling;
  // the king moving, or a rook leaving or being captured on its home square,
  // permanently forfeits that right
  const type = typeOf(move.piece);
  if (type === KING) castling &= state.turn ? ~(CASTLE_WK | CASTLE_WQ) : ~(CASTLE_BK | CASTLE_BQ);
  // The array runs a1→h8, so black's rooks are on a8 = 56 and h8 = 63, NOT on
  // the same files as white's. Using rank-1 squares here meant a rook leaving
  // a8 never forfeited its castling right.
  if (move.from === 7 || move.to === 7) castling &= ~CASTLE_WK;
  if (move.from === 0 || move.to === 0) castling &= ~CASTLE_WQ;
  if (move.from === 63 || move.to === 63) castling &= ~CASTLE_BK;
  if (move.from === 56 || move.to === 56) castling &= ~CASTLE_BQ;

  const enPassant = move.doublePawn ? (move.from + move.to) / 2 : -1;
  const resetting = type === PAWN || move.captured !== EMPTY || move.enPassant;
  const halfmoves = resetting ? 0 : state.halfmoves + 1;

  const next = {
    board,
    turn: !state.turn,
    castling,
    enPassant,
    halfmoves,
    fullmove: state.turn === BLACK ? state.fullmove + 1 : state.fullmove,
    history: [],
  };
  // repetition is counted on position + turn + castling + ep
  next.history = [positionKey(next), ...state.history];
  return { state: next, move, captured: move.captured, check: isInCheck(board, next.turn) };
}

export function isLegal(state, move) {
  return legalMoves(state).some(
    (m) => m.from === move.from && m.to === move.to && m.promotion === (move.promotion || 0)
  );
}

/** A stable key for repetition detection. */
export function positionKey(state) {
  return [
    state.board.join(''),
    state.turn ? 'w' : 'b',
    state.castling,
    state.enPassant,
  ].join('|');
}

/* ---- ending the game ---------------------------------------------------------------- */

/** Neither side can legally castle and the bare king cannot mate — a draw. */
export function isInsufficientMaterial(board) {
  const pieces = [];
  for (let sq = 0; sq < 64; sq++) {
    if (board[sq] === EMPTY) continue;
    const t = typeOf(board[sq]);
    if (t === KING) continue;
    pieces.push(t);
  }
  if (pieces.length === 0) return true; // K v K
  // K+minor, K+minor, or K+B+K+N can never force mate
  if (pieces.length === 1) return true;
  if (pieces.length === 2 && pieces.every((p) => p === BISHOP || p === KNIGHT)) return true;
  if (
    pieces.length === 3 &&
    pieces.filter((p) => p === BISHOP).length === 1 &&
    pieces.filter((p) => p === KNIGHT).length === 1 &&
    pieces.includes(PAWN) === false
  ) {
    return true;
  }
  return false;
}

/** How many times the current position has appeared. */
export function repetitionCount(state) {
  const key = positionKey(state);
  let n = 0;
  for (const h of state.history) if (h === key) n++;
  return n;
}

/**
 * The result for the side that just moved: 'checkmate' | 'stalemate' |
 * 'fifty' | 'repetition' | 'material' | null while it is played.
 */
export function outcome(state) {
  const moves = legalMoves(state);
  if (moves.length === 0) {
    return isInCheck(state.board, state.turn) ? 'checkmate' : 'stalemate';
  }
  if (state.halfmoves >= 100) return 'fifty';
  if (repetitionCount(state) >= 3) return 'repetition';
  if (isInsufficientMaterial(state.board)) return 'material';
  return null;
}

/** The winner given an outcome, or null for a draw. */
export function winnerOf(result, mover) {
  if (result === 'checkmate') return mover;
  return null;
}

/* ---- evaluation --------------------------------------------------------------------- */

const PIECE_VALUE = { [PAWN]: 100, [KNIGHT]: 320, [BISHOP]: 330, [ROOK]: 500, [QUEEN]: 900, [KING]: 0 };

/** A simple material + development read, positive for `side`. */
export function evaluate(board, side) {
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq];
    if (piece === EMPTY) continue;
    const v = PIECE_VALUE[typeOf(piece)] || 0;
    score += colourOf(piece) === side ? v : -v;
  }
  return score;
}

/* ---- AI --------------------------------------------------------------------------------- */

/** Easy AI — a uniformly random legal move. */
export function easyMove(state) {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Medium AI — one ply: take a free queen, take a hanging piece, castle when
 * it is free and sensible, otherwise the best material swing.
 */
export function mediumMove(state) {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    const next = { ...state, board: applyToBoard(state, move) };
    let score = evaluate(next.board, state.turn) * 2;
    if (move.castle) score += 60;
    if (move.promotion) score += PIECE_VALUE[typeOf(move.promotion)] || 0;
    // a capture is worth more than its static value when it is undefended
    if (move.captured !== EMPTY) {
      const gain = PIECE_VALUE[typeOf(move.captured)] || 0;
      const replies = legalMoves({ ...next, turn: !state.turn });
      const defended = replies.some((r) => r.to === move.to);
      score += defended ? gain : gain * 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

/**
 * Hard AI — negamax with alpha-beta over a capped depth, ordered by the
 * static evaluation. Stated plainly: a solid club-amateur search at the
 * depths it can afford inside a click — it does not see deep endgames.
 */
export function search(state, options = {}) {
  const maxNodes = options.maxNodes ?? 30000;
  const depth = options.depth ?? (state.board ? 2 : 2);
  let nodes = 0;
  let aborted = false;

  function negamax(pos, side, remaining, alpha, beta) {
    nodes++;
    if (nodes > maxNodes) {
      aborted = true;
      return evaluate(pos.board, side);
    }
    if (remaining === 0) return evaluate(pos.board, side);
    const moves = legalMoves(pos);
    if (moves.length === 0) {
      // checkmate is worth a lot more than any material
      return isInCheck(pos.board, side) ? -100000 : 0;
    }
    const ordered = moves
      .map((m) => ({ m, hint: (PIECE_VALUE[typeOf(m.captured)] || 0) * 3 }))
      .sort((a, b) => b.hint - a.hint)
      .map((e) => e.m);
    let best = -Infinity;
    for (const move of ordered) {
      const next = applyMove(pos, move);
      const value = -negamax(next.state, !side, remaining - 1, -beta, -alpha);
      if (value > best) best = value;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
      if (aborted) break;
    }
    return best;
  }

  const moves = legalMoves(state);
  if (moves.length === 0) return null;
  let bestMove = moves[0];
  let bestValue = -Infinity;
  for (const move of moves) {
    const next = applyMove(state, move);
    const value = -negamax(next.state, !state.turn, depth - 1, -Infinity, -bestValue);
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
    if (aborted) break;
  }
  return { move: bestMove, value: bestValue, nodes, aborted };
}

export function aiMove(state, difficulty, options = {}) {
  if (difficulty === 'hard') {
    const found = search(state, options);
    return found ? found.move : null;
  }
  if (difficulty === 'medium') return mediumMove(state);
  return easyMove(state);
}

/* ---- safety --------------------------------------------------------------------------------- */

/** Sanitise an untrusted board into legal piece numbers. */
export function fromArray(cells) {
  const out = new Array(64).fill(EMPTY);
  for (let i = 0; i < 64; i++) {
    const p = Number(cells?.[i]) | 0;
    out[i] = p >= 1 && p <= 14 && p !== 7 && p !== 8 ? p : EMPTY;
  }
  return out;
}
