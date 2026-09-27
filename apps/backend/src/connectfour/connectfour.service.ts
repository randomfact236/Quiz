import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { ConnectFourMatch } from './entities/connectfour-match.entity';

const TTL_MS = 30 * 60 * 1000; // one casual round: 30 minutes, then it's gone
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0
const COLS = 7;
const ROWS = 6;
const CELLS = COLS * ROWS;

const other = (mark: string): string => (mark === 'R' ? 'Y' : 'R');

/** Server-authoritative win check through the last dropped cell — the TS
 *  mirror of the game's core.js findWinFrom. */
function winFrom(
  board: (string | null)[],
  row: number,
  col: number
): { mark: string; line: number[] } | null {
  const mark = board[row * COLS + col];
  if (!mark) return null;
  const axes = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of axes) {
    const line = [row * COLS + col];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === mark) {
        line.push(r * COLS + c);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= 4) return { mark, line };
  }
  return null;
}

/** Lowest empty row in a column (bottom-up), or -1 when full. */
function lowestRow(board: (string | null)[], col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row * COLS + col] === null) return row;
  }
  return -1;
}

@Injectable()
export class ConnectFourService {
  constructor(
    @InjectRepository(ConnectFourMatch)
    private readonly matches: Repository<ConnectFourMatch>
  ) {}

  async create(input: { playerName: string; guestId: string }): Promise<{ code: string }> {
    await this.expireStale();
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        board: Array<string | null>(CELLS).fill(null),
        turn: 'R',
        status: 'waiting',
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

  /** The poll — every player syncs the whole authoritative state through it. */
  async view(code: string, guestId: string): Promise<unknown> {
    const match = await this.requireMatch(code);
    await this.expireStale();
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, guestId);
  }

  /** A move is a COLUMN — the server applies gravity and resolves the round. */
  async move(code: string, input: { guestId: string; column: number }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') {
      throw new BadRequestException('This match is not running.');
    }
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (match.turn !== yourMark) throw new BadRequestException('Not your turn.');
    const col = Math.trunc(input.column);
    if (!Number.isInteger(col) || col < 0 || col >= COLS) {
      throw new BadRequestException('That column does not exist.');
    }
    const row = lowestRow(match.board, col);
    if (row === -1) throw new BadRequestException('That column is full.');

    const board = [...match.board];
    board[row * COLS + col] = yourMark;
    const win = winFrom(board, row, col);
    let full = true;
    for (let i = 0; i < CELLS; i++) {
      if (board[i] === null) {
        full = false;
        break;
      }
    }
    await this.matches.update(match.id, {
      board,
      turn: other(yourMark),
      ...(win || full
        ? {
            status: 'finished',
            winner: win ? win.mark : null,
            winningLine: win ? win.line : null,
            draw: !win,
          }
        : {}),
    });
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, input.guestId);
  }

  async leave(code: string, guestId: string): Promise<void> {
    const match = await this.requireMatch(code);
    if (match.status !== 'finished' && [match.rGuestId, match.yGuestId].includes(guestId)) {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- internals ------------------------------------------------------------

  private markOf(match: ConnectFourMatch, guestId: string): string | null {
    if (match.rGuestId === guestId) return 'R';
    if (match.yGuestId === guestId) return 'Y';
    return null;
  }

  private present(match: ConnectFourMatch, guestId: string) {
    return {
      code: match.code,
      status: match.status,
      board: match.board,
      turn: match.turn,
      yourMark: this.markOf(match, guestId),
      rName: match.rName,
      yName: match.yGuestId ? match.yName : null,
      winner: match.winner,
      winningLine: match.winningLine,
      draw: match.draw,
    };
  }

  private async requireMatch(code: string): Promise<ConnectFourMatch> {
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
