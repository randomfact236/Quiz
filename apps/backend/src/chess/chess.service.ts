import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { ChessMatch } from './entities/chess-match.entity';

const TTL_MS = 60 * 60 * 1000; // chess takes its time
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const EMPTY = 0;
const PAWN = 1;
const KNIGHT = 2;
const BISHOP = 3;
const ROOK = 4;
const QUEEN = 5;
const KING = 6;

const CASTLE_WK = 1, CASTLE_WQ = 2, CASTLE_BK = 4, CASTLE_BQ = 8;

function other(side: number): number {
  return side === 1 ? 2 : 1;
}

function typeOf(piece: number): number {
  const t = piece % 8;
  return t === 0 ? PAWN : t;
}

function isWhite(piece: number): boolean {
  return piece >= 9;
}

function colourOf(piece: number): number | null {
  if (piece === EMPTY) return null;
  return isWhite(piece) ? 1 : 2;
}

function make(type: number, side: number): number {
  return side === 1 ? type + 8 : type;
}

function idxAt(row: number, file: number): number {
  if (row < 0 || row > 7 || file < 0 || file > 7) return -1;
  return row * 8 + file;
}

function neighbours(idx: number): number[] {
  const row = Math.floor(idx / 8);
  const file = idx % 8;
  return [idxAt(row - 1, file), idxAt(row + 1, file), idxAt(row, file - 1), idxAt(row, file + 1)].filter(
    (n) => n >= 0
  );
}

export function initialBoard(): number[] {
  const b = new Array<number>(64).fill(EMPTY);
  const back = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];
  // The array runs a1→h8, so WHITE is on rows 0-1 and BLACK on rows 6-7.
  // (Flipping this puts black's back rank on row 0, and the opening then
  // offers only the two knight moves.)
  for (let f = 0; f < 8; f++) {
    b[f] = back[f] + 8; // white back rank (rank 1)
    b[8 + f] = PAWN + 8; // white pawns (rank 2)
    b[48 + f] = PAWN; // black pawns (rank 7)
    b[56 + f] = back[f]; // black back rank (rank 8)
  }
  return b;
}

const KNIGHT_DELTAS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KING_DELTAS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function attacksFrom(board: number[], from: number): number[] {
  const piece = board[from];
  if (piece === EMPTY) return [];
  const type = typeOf(piece);
  const r = Math.floor(from / 8);
  const f = from % 8;
  const out: number[] = [];
  if (type === PAWN) {
    const dir = isWhite(piece) ? 1 : -1;
    for (const df of [-1, 1]) {
      const nr = r + dir;
      const nf = f + df;
      if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) out.push(nr * 8 + nf);
    }
    return out;
  }
  if (type === KNIGHT || type === KING) {
    for (const [dr, df] of type === KNIGHT ? KNIGHT_DELTAS : KING_DELTAS) {
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
      if (board[sq] !== EMPTY) break;
      nr += dr;
      nf += df;
    }
  }
  return out;
}

export function findKing(board: number[], side: number): number {
  const king = make(KING, side);
  for (let sq = 0; sq < 64; sq++) if (board[sq] === king) return sq;
  return -1;
}

export function isInCheck(board: number[], side: number): boolean {
  const king = findKing(board, side);
  if (king < 0) return false;
  const foe = other(side);
  for (let sq = 0; sq < 64; sq++) {
    if (colourOf(board[sq]) !== foe) continue;
    if (attacksFrom(board, sq).indexOf(king) !== -1) return true;
  }
  return false;
}

export type Move = {
  from: number;
  to: number;
  piece: number;
  captured: number;
  promotion: number;
  castle?: string;
  enPassant?: boolean;
  doublePawn?: boolean;
};

function mv(from: number, to: number, piece: number, captured = EMPTY, extra: Partial<Move> = {}): Move {
  return { from, to, piece, captured, promotion: 0, ...extra };
}

export function legalMoves(state: {
  board: number[];
  turn: number;
  castling: number;
  enPassant: number;
}): Move[] {
  const { board, turn, castling, enPassant } = state;
  const pseudo: Move[] = [];
  const forward = turn === 1 ? 1 : -1;
  // the array runs a1→h8, so white (rank 1) moves up toward row 7
  const startRow = turn === 1 ? 1 : 6;
  const promoRow = turn === 1 ? 7 : 0;

  for (let from = 0; from < 64; from++) {
    const piece = board[from];
    if (piece === EMPTY || colourOf(piece) !== turn) continue;
    const type = typeOf(piece);

    if (type === PAWN) {
      const r = Math.floor(from / 8);
      const f = from % 8;
      const one = (r + forward) * 8 + f;
      if (one >= 0 && one < 64 && board[one] === EMPTY) {
        if (r + forward === promoRow) {
          for (const p of [QUEEN, ROOK, BISHOP, KNIGHT]) {
            pseudo.push(mv(from, one, piece, EMPTY, { promotion: make(p, turn) }));
          }
        } else {
          pseudo.push(mv(from, one, piece));
          if (from === startRow * 8 + f) {
            const two = (r + 2 * forward) * 8 + f;
            if (two >= 0 && two < 64 && board[two] === EMPTY) pseudo.push(mv(from, two, piece, EMPTY, { doublePawn: true }));
          }
        }
      }
      for (const df of [-1, 1]) {
        const nr = r + forward;
        const nf = f + df;
        if (nr < 0 || nr > 7 || nf < 0 || nf > 7) continue;
        const to = nr * 8 + nf;
        if (board[to] !== EMPTY && colourOf(board[to]) !== turn) {
          if (nr === promoRow) {
            for (const p of [QUEEN, ROOK, BISHOP, KNIGHT]) {
              pseudo.push(mv(from, to, piece, board[to], { promotion: make(p, turn) }));
            }
          } else {
            pseudo.push(mv(from, to, piece, board[to]));
          }
        } else if (to === enPassant) {
          // the captured pawn sits BESIDE the moving one, not on the target
          pseudo.push(mv(from, to, piece, make(PAWN, other(turn)), { enPassant: true }));
        }
      }
      continue;
    }

    if (type === KNIGHT || type === KING) {
      for (const to of attacksFrom(board, from)) {
        if (board[to] !== EMPTY && colourOf(board[to]) === turn) continue;
        pseudo.push(mv(from, to, piece, board[to]));
      }
      continue;
    }

    for (const to of attacksFrom(board, from)) {
      if (board[to] !== EMPTY) {
        if (colourOf(board[to]) !== turn) pseudo.push(mv(from, to, piece, board[to]));
        continue;
      }
      pseudo.push(mv(from, to, piece));
    }
  }

  // castling: king not in check, squares between empty, not through check
  const kingSq = turn === 1 ? 4 : 60;
  const rank = turn === 1 ? 0 : 7;
  const rights = turn === 1 ? CASTLE_WK | CASTLE_WQ : CASTLE_BK | CASTLE_BQ;
  if ((castling & rights) !== 0 && board[kingSq] === make(KING, turn) && !isInCheck(board, turn)) {
    const kSide = castling & (turn === 1 ? CASTLE_WK : CASTLE_BK);
    const qSide = castling & (turn === 1 ? CASTLE_WQ : CASTLE_BQ);
    const emptyBetween = (squares: number[]) => squares.every((s) => board[s] === EMPTY);
    if (kSide && board[rank * 8 + 7] === make(ROOK, turn) && emptyBetween([rank * 8 + 5, rank * 8 + 6])) {
      pseudo.push(mv(kingSq, rank * 8 + 6, board[kingSq], EMPTY, { castle: turn === 1 ? 'K' : 'k' }));
    }
    if (qSide && board[rank * 8] === make(ROOK, turn) && emptyBetween([rank * 8 + 1, rank * 8 + 2, rank * 8 + 3])) {
      pseudo.push(mv(kingSq, rank * 8 + 2, board[kingSq], EMPTY, { castle: turn === 1 ? 'Q' : 'q' }));
    }
  }

  return pseudo.filter((m) => {
    const after = applyToBoard(state, m);
    if (isInCheck(after, turn)) return false;
    // the king may not pass THROUGH an attacked square
    if (m.castle) {
      const pass = m.castle === 'K' || m.castle === 'k' ? rank * 8 + 5 : rank * 8 + 3;
      const board2 = after.slice();
      board2[m.to] = EMPTY;
      board2[pass] = make(KING, turn);
      if (isInCheck(board2, turn)) return false;
    }
    return true;
  });
}

export function applyToBoard(
  state: { board: number[]; turn: number },
  move: Move
): number[] {
  const board = state.board.slice();
  board[move.from] = EMPTY;
  board[move.to] = move.promotion || move.piece;
  if (move.enPassant) {
    // the victim is on the MOVER's rank, one file across
    board[Math.floor(move.from / 8) * 8 + (move.to % 8)] = EMPTY;
  }
  if (move.castle) {
    const rank = Math.floor(move.to / 8);
    const kingSide = move.castle === 'K' || move.castle === 'k';
    const rookFrom = kingSide ? rank * 8 + 7 : rank * 8;
    const rookTo = kingSide ? rank * 8 + 5 : rank * 8 + 3;
    board[rookTo] = board[rookFrom];
    board[rookFrom] = EMPTY;
  }
  return board;
}

export function isInsufficientMaterial(board: number[]): boolean {
  const pieces: number[] = [];
  for (let sq = 0; sq < 64; sq++) {
    if (board[sq] === EMPTY) continue;
    const t = typeOf(board[sq]);
    if (t === KING) continue;
    pieces.push(t);
  }
  if (pieces.length <= 1) return true;
  if (pieces.length === 2 && pieces.every((p) => p === BISHOP || p === KNIGHT)) return true;
  if (
    pieces.length === 3 &&
    pieces.filter((p) => p === BISHOP).length === 1 &&
    pieces.filter((p) => p === KNIGHT).length === 1
  ) {
    return true;
  }
  return false;
}

/** The result for the side to move, or null while it is played. */
export function resultFor(state: {
  board: number[];
  turn: number;
  castling: number;
  enPassant: number;
  halfmoves: number;
}): string | null {
  if (legalMoves(state).length === 0) {
    return isInCheck(state.board, state.turn) ? 'checkmate' : 'stalemate';
  }
  if (state.halfmoves >= 100) return 'fifty';
  if (isInsufficientMaterial(state.board)) return 'material';
  return null;
}

@Injectable()
export class ChessService {
  constructor(
    @InjectRepository(ChessMatch)
    private readonly matches: Repository<ChessMatch>
  ) {}

  async create(input: { playerName: string; guestId: string }): Promise<{ code: string }> {
    await this.expireStale();
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        status: 'waiting',
        board: initialBoard(),
        turn: 1,
        castling: CASTLE_WK | CASTLE_WQ | CASTLE_BK | CASTLE_BQ,
        enPassant: -1,
        halfmoves: 0,
        fullmove: 1,
        lastMove: null,
        rGuestId: input.guestId,
        rName: input.playerName,
        expiresAt: new Date(Date.now() + TTL_MS),
      })
    );
    return { code: match.code };
  }

  async join(code: string, input: { playerName: string; guestId: string }): Promise<unknown> {
    await this.expireStale();
    const match = await this.requireMatch(code);
    if (match.rGuestId === input.guestId) return this.view(code, input.guestId);
    if (match.yGuestId && match.yGuestId !== input.guestId) {
      throw new ForbiddenException('This match is already full.');
    }
    if (!match.yGuestId) {
      await this.matches.update(match.id, {
        yGuestId: input.guestId,
        yName: input.playerName,
        status: 'running',
      });
    }
    return this.view(code, input.guestId);
  }

  async view(code: string, guestId: string): Promise<unknown> {
    const match = await this.requireMatch(code);
    await this.expireStale();
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, guestId);
  }

  /**
   * Play a move. The client sends only from/to (and a promotion choice): the
   * server looks the move up in ITS OWN legal list, so a client cannot castle
   * illegally, capture a pinned piece, or invent a move.
   */
  async move(
    code: string,
    input: { guestId: string; from: number; to: number; promotion?: number | null }
  ): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') throw new BadRequestException('This match is over.');
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (yourMark !== match.turn) throw new BadRequestException('It is not your turn.');

    const from = Number(input.from);
    const to = Number(input.to);
    if (
      !Number.isInteger(from) || !Number.isInteger(to) ||
      from < 0 || from > 63 || to < 0 || to > 63
    ) {
      throw new BadRequestException('Illegal move');
    }

    const options = legalMoves(match).filter((m) => m.from === from && m.to === to);
    if (options.length === 0) throw new BadRequestException('Illegal move');
    // a promotion square has four candidate moves — the client picks one
    const move = input.promotion
      ? options.find((m) => m.promotion === Number(input.promotion))
      : options.find((m) => !m.promotion) || options[0];
    if (!move) throw new BadRequestException('Illegal move');

    const board = applyToBoard(match, move);
    const type = typeOf(move.piece);
    let castling = match.castling;
    if (type === KING) castling &= yourMark === 1 ? ~(CASTLE_WK | CASTLE_WQ) : ~(CASTLE_BK | CASTLE_BQ);
    if (move.from === 7 || move.to === 7) castling &= ~CASTLE_WK;
    if (move.from === 0 || move.to === 0) castling &= ~CASTLE_WQ;
    if (move.from === 63 || move.to === 63) castling &= ~CASTLE_BK;
    if (move.from === 56 || move.to === 56) castling &= ~CASTLE_BQ;

    const enPassant = move.doublePawn ? (move.from + move.to) / 2 : -1;
    const resetting = type === PAWN || move.captured !== EMPTY || move.enPassant;
    const next = {
      board,
      turn: other(yourMark),
      castling,
      enPassant,
      halfmoves: resetting ? 0 : match.halfmoves + 1,
      fullmove: yourMark === 2 ? match.fullmove + 1 : match.fullmove,
    };

    const patch: Partial<ChessMatch> = {
      board: next.board,
      turn: next.turn,
      castling: next.castling,
      enPassant: next.enPassant,
      halfmoves: next.halfmoves,
      fullmove: next.fullmove,
      lastMove: {
        from: move.from,
        to: move.to,
        ...(move.promotion ? { promotion: move.promotion } : {}),
        ...(move.castle ? { castle: move.castle } : {}),
      },
    };
    // resultFor checks for mate/stalemate, which only needs the board and the
    // side to move — the draw checks read the clock the same way
    const ending = resultFor({
      board: next.board,
      turn: next.turn,
      castling: next.castling,
      enPassant: next.enPassant,
      halfmoves: next.halfmoves,
    });
    if (ending) {
      Object.assign(patch, {
        status: 'finished',
        result: ending,
        winner: ending === 'checkmate' ? yourMark : null,
        draw: ending !== 'checkmate',
      });
    }

    await this.matches.update(match.id, patch);
    const after = await this.requireMatch(code);
    return this.present(after, input.guestId);
  }

  async leave(code: string, guestId: string): Promise<void> {
    const match = await this.requireMatch(code);
    if (match.status !== 'finished' && [match.rGuestId, match.yGuestId].includes(guestId)) {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- internals ---------------------------------------------------------------

  private markOf(match: ChessMatch, guestId: string): number | null {
    if (match.rGuestId === guestId) return 1;
    if (match.yGuestId === guestId) return 2;
    return null;
  }

  private present(match: ChessMatch, guestId: string) {
    return {
      code: match.code,
      status: match.status,
      yourMark: this.markOf(match, guestId),
      board: match.board,
      turn: match.turn,
      castling: match.castling,
      enPassant: match.enPassant,
      halfmoves: match.halfmoves,
      fullmove: match.fullmove,
      lastMove: match.lastMove,
      wName: match.rName,
      bName: match.yGuestId ? match.yName : null,
      winner: match.winner,
      draw: match.draw,
      result: match.result,
    };
  }

  private async requireMatch(code: string): Promise<ChessMatch> {
    const match = await this.matches.findOne({ where: { code: code.toUpperCase() } });
    if (!match) throw new NotFoundException('Match not found.');
    return match;
  }

  private async expireStale(): Promise<void> {
    await this.matches.update(
      { status: In(['waiting', 'running']), expiresAt: LessThan(new Date()) },
      { status: 'abandoned' }
    );
  }

  private async generateCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      let code = '';
      for (let i = 0; i < 6; i += 1) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
      const clash = await this.matches.findOne({ where: { code } });
      if (!clash) return code;
    }
    throw new Error('Could not allocate a match code.');
  }
}
