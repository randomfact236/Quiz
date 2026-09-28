import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { CheckersMatch } from './entities/checkers-match.entity';

const TTL_MS = 30 * 60 * 1000; // a full game, not a quickfire
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SQUARES = 32;
const BOARD_ROWS = 8;

const EMPTY = 0;
const RED_MAN = 1;
const RED_KING = 2;
const BLACK_MAN = 3;
const BLACK_KING = 4;
const RED = 1;
const BLACK = 2;

const CROWN_ROW: Record<number, number> = { [RED]: 0, [BLACK]: 7 };

/** plan §2: 40 moves with no capture and no man advancement is a draw. */
const DRAW_QUIET_PLIES = 80;

/* ---- the rules (the TS mirror of the game's core.js) ------------------------ */

/** Even rows sit on odd files, odd rows on even files — never both. */
function squareAt(row: number, file: number): number {
  if (row < 0 || row >= BOARD_ROWS || file < 0 || file >= BOARD_ROWS) return -1;
  if (file % 2 !== (row % 2 === 0 ? 1 : 0)) return -1;
  return row * 4 + (file >> 1);
}

function rowOf(sq: number): number {
  return (sq / 4) | 0;
}

function fileOf(sq: number): number {
  return 2 * (sq % 4) + (rowOf(sq) % 2 === 0 ? 1 : 0);
}

function sideOf(piece: number): number {
  if (piece === RED_MAN || piece === RED_KING) return RED;
  if (piece === BLACK_MAN || piece === BLACK_KING) return BLACK;
  return 0;
}

function isKing(piece: number): boolean {
  return piece === RED_KING || piece === BLACK_KING;
}

function other(side: number): number {
  return side === RED ? BLACK : RED;
}

function forwardOf(side: number): number {
  return side === RED ? -1 : 1;
}

function kingOf(side: number): number {
  return side === RED ? RED_KING : BLACK_KING;
}

export function initialBoard(): number[] {
  const board = new Array<number>(SQUARES).fill(EMPTY);
  for (let sq = 0; sq < SQUARES; sq++) {
    const row = rowOf(sq);
    if (row <= 2) board[sq] = BLACK_MAN;
    else if (row >= 5) board[sq] = RED_MAN;
  }
  return board;
}

function directionsFor(piece: number): Array<[number, number]> {
  if (isKing(piece)) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }
  const f = forwardOf(sideOf(piece));
  return [
    [f, -1],
    [f, 1],
  ];
}

function jumpTargetsFrom(board: number[], sq: number, side: number) {
  const piece = board[sq];
  if (sideOf(piece) !== side) return [];
  const row = rowOf(sq);
  const file = fileOf(sq);
  const targets: Array<{ from: number; to: number; over: number }> = [];
  for (const [dr, df] of directionsFor(piece)) {
    const over = squareAt(row + dr, file + df);
    const to = squareAt(row + 2 * dr, file + 2 * df);
    if (over < 0 || to < 0) continue;
    const victim = board[over];
    if (victim === EMPTY || sideOf(victim) === side) continue;
    if (board[to] !== EMPTY) continue;
    targets.push({ from: sq, to, over });
  }
  return targets;
}

function slideTargetsFrom(board: number[], sq: number, side: number) {
  const piece = board[sq];
  if (sideOf(piece) !== side) return [];
  const row = rowOf(sq);
  const file = fileOf(sq);
  const targets: Array<{ from: number; to: number }> = [];
  for (const [dr, df] of directionsFor(piece)) {
    const to = squareAt(row + dr, file + df);
    if (to < 0 || board[to] !== EMPTY) continue;
    targets.push({ from: sq, to });
  }
  return targets;
}

/**
 * The legal steps for `side`, with `chainSquare` set when a multi-jump is in
 * progress (then ONLY that piece may jump). Without a chain, the classic
 * forced-capture rule applies: if any jump exists, slides are not legal.
 */
export function legalMoves(
  board: number[],
  side: number,
  chainSquare: number | null = null
): Array<{ from: number; to: number; over?: number }> {
  if (chainSquare !== null && chainSquare !== undefined) {
    return jumpTargetsFrom(board, chainSquare, side);
  }
  const jumps: Array<{ from: number; to: number; over: number }> = [];
  for (let sq = 0; sq < SQUARES; sq++) {
    if (sideOf(board[sq]) !== side) continue;
    jumps.push(...jumpTargetsFrom(board, sq, side));
  }
  if (jumps.length > 0) return jumps;
  const slides: Array<{ from: number; to: number }> = [];
  for (let sq = 0; sq < SQUARES; sq++) {
    if (sideOf(board[sq]) !== side) continue;
    slides.push(...slideTargetsFrom(board, sq, side));
  }
  return slides;
}

function isStalemated(board: number[], side: number): boolean {
  let hasPiece = false;
  for (let sq = 0; sq < SQUARES; sq++) {
    if (sideOf(board[sq]) === side) {
      hasPiece = true;
      break;
    }
  }
  if (!hasPiece) return true; // wiped out
  return legalMoves(board, side).length === 0; // or every piece is blocked
}

function advancesClock(
  board: number[],
  side: number,
  move: { from: number; to: number; over?: number }
): boolean {
  if (move.over !== undefined) return true; // a capture
  const piece = board[move.from];
  if (isKing(piece)) return false;
  const forward = forwardOf(side);
  return rowOf(move.to) === rowOf(move.from) + forward;
}

/**
 * Play one step. Returns the new board plus the capture/crown/chain flags.
 * The capture is DERIVED from the legal move, never taken from the request —
 * a client that posts {from, to} for a jump cannot skip the capture.
 */
function applyStep(
  board: number[],
  side: number,
  chainSquare: number | null,
  move: { from: number; to: number }
): {
  board: number[];
  step: { from: number; to: number; over?: number; crowned: boolean };
  chainSquare: number | null;
} {
  const legal = legalMoves(board, side, chainSquare).find(
    (m) => m.from === move.from && m.to === move.to
  );
  if (!legal) throw new BadRequestException('Illegal step');

  const next = board.slice();
  const piece = next[legal.from];
  const captured = legal.over;
  const capture = captured !== undefined;
  next[legal.from] = EMPTY;
  if (capture) next[captured] = EMPTY;
  next[legal.to] = piece;

  const crowned = !isKing(piece) && rowOf(legal.to) === CROWN_ROW[side];
  if (crowned) next[legal.to] = kingOf(side);
  // crowning ends the chain (English draughts)
  const chain = capture && !crowned && jumpTargetsFrom(next, legal.to, side).length > 0;

  return {
    board: next,
    step: {
      from: legal.from,
      to: legal.to,
      ...(capture ? { over: captured } : {}),
      crowned,
    },
    chainSquare: chain ? legal.to : null,
  };
}

/* ---- the service -------------------------------------------------------------- */

@Injectable()
export class CheckersService {
  constructor(
    @InjectRepository(CheckersMatch)
    private readonly matches: Repository<CheckersMatch>
  ) {}

  async create(input: { playerName: string; guestId: string }): Promise<{ code: string }> {
    await this.expireStale();
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        status: 'waiting',
        board: initialBoard(),
        turn: RED,
        chainSquare: null,
        quietPlies: 0,
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
        // the creator's seat is only real once a challenger arrives
        status: 'running',
      });
    }
    return this.view(code, input.guestId);
  }

  /** The poll — 3-second cadence, redacted to the caller's own seat. */
  async view(code: string, guestId: string): Promise<unknown> {
    const match = await this.requireMatch(code);
    await this.expireStale();
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, guestId);
  }

  /**
   * Play ONE step. The server owns the rules: forced captures, chain
   * continuation, crowning and the draw clock are all decided here, so a
   * client cannot skip a capture, swap the piece mid-chain, or shorten a jump.
   */
  async step(code: string, input: { guestId: string; from: number; to: number }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') throw new BadRequestException('This match is over.');
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (yourMark !== match.turn) throw new BadRequestException('It is not your turn.');

    const from = Number(input.from);
    const to = Number(input.to);
    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to < 0 ||
      from >= SQUARES ||
      to >= SQUARES
    ) {
      throw new BadRequestException('Illegal step');
    }

    const played = applyStep(match.board, match.turn, match.chainSquare, { from, to });
    const turn = played.chainSquare === null ? other(match.turn) : match.turn;
    const quietPlies = advancesClock(match.board, match.turn, played.step)
      ? 0
      : match.quietPlies + 1;

    // the game is only decided when the turn actually passes
    let patch: Partial<CheckersMatch> = {
      board: played.board,
      turn,
      chainSquare: played.chainSquare,
      quietPlies,
      lastMove: played.step,
    };
    if (played.chainSquare === null) {
      if (isStalemated(played.board, turn)) {
        Object.assign(patch, { status: 'finished', winner: match.turn });
      } else if (quietPlies >= DRAW_QUIET_PLIES) {
        Object.assign(patch, { status: 'finished', draw: true });
      }
    }

    await this.matches.update(match.id, patch);
    const after = await this.matches.findOne({ where: { id: match.id } });
    if (!after) throw new NotFoundException('Match not found.');
    return this.present(after, input.guestId);
  }

  async leave(code: string, guestId: string): Promise<void> {
    const match = await this.requireMatch(code);
    if (match.status !== 'finished' && [match.rGuestId, match.yGuestId].includes(guestId)) {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- internals -----------------------------------------------------------------

  private markOf(match: CheckersMatch, guestId: string): number | null {
    if (match.rGuestId === guestId) return RED;
    if (match.yGuestId === guestId) return BLACK;
    return null;
  }

  private present(match: CheckersMatch, guestId: string) {
    return {
      code: match.code,
      status: match.status,
      yourMark: this.markOf(match, guestId),
      board: match.board,
      turn: match.turn,
      // null means "you may pick any piece" — a number means the chain owns it
      chainSquare: match.chainSquare ?? null,
      quietPlies: match.quietPlies,
      lastMove: match.lastMove,
      rName: match.rName,
      bName: match.yGuestId ? match.yName : null,
      winner: match.winner,
      draw: match.draw,
    };
  }

  private async requireMatch(code: string): Promise<CheckersMatch> {
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
