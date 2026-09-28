import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { GomokuMatch } from './entities/gomoku-match.entity';

const TTL_MS = 30 * 60 * 1000; // one casual match: 30 minutes, then it's gone
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0
const SIZES = [11, 15];
const WIN_LENGTH = 5; // freestyle: five or more in a row

const other = (mark: string): string => (mark === 'B' ? 'W' : 'B');

/** Server-authoritative five-in-a-row check through the last placed stone —
 *  the TS mirror of the game's core.js findWinFrom. */
function winFrom(
  board: (string | null)[],
  size: number,
  index: number
): { mark: string; line: number[] } | null {
  const mark = board[index];
  if (!mark) return null;
  const row = Math.floor(index / size);
  const col = index % size;
  const axes: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of axes) {
    const line = [index];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < size && c >= 0 && c < size && board[r * size + c] === mark) {
        line.push(r * size + c);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= WIN_LENGTH) return { mark, line };
  }
  return null;
}

@Injectable()
export class GomokuService {
  constructor(
    @InjectRepository(GomokuMatch)
    private readonly matches: Repository<GomokuMatch>
  ) {}

  async create(input: {
    playerName: string;
    guestId: string;
    size: number;
  }): Promise<{ code: string }> {
    await this.expireStale();
    const size = SIZES.includes(input.size) ? input.size : 15;
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        size,
        board: Array<string | null>(size * size).fill(null),
        turn: 'B',
        status: 'waiting',
        bGuestId: input.guestId,
        bName: input.playerName,
        expiresAt: new Date(Date.now() + TTL_MS),
      })
    );
    return { code: match.code };
  }

  async join(code: string, input: { playerName: string; guestId: string }): Promise<unknown> {
    await this.expireStale();
    const match = await this.requireMatch(code);
    if (match.bGuestId === input.guestId) return this.view(code, input.guestId);
    if (match.wGuestId && match.wGuestId !== input.guestId) {
      throw new ForbiddenException('This match is already full.');
    }
    if (!match.wGuestId) {
      await this.matches.update(match.id, {
        wGuestId: input.guestId,
        wName: input.playerName,
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

  /** A move is a CELL index — the server applies it and resolves the match. */
  async move(code: string, input: { guestId: string; cell: number }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') {
      throw new BadRequestException('This match is not running.');
    }
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (match.turn !== yourMark) throw new BadRequestException('Not your turn.');
    const cell = Math.trunc(input.cell);
    if (!Number.isInteger(cell) || cell < 0 || cell >= match.size * match.size) {
      throw new BadRequestException('That cell does not exist.');
    }
    if (match.board[cell] !== null) throw new BadRequestException('That cell is taken.');

    const board = [...match.board];
    board[cell] = yourMark;
    const win = winFrom(board, match.size, cell);
    const full = board.every((c) => c !== null);
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
    if (match.status !== 'finished' && [match.bGuestId, match.wGuestId].includes(guestId)) {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- internals ------------------------------------------------------------

  private markOf(match: GomokuMatch, guestId: string): string | null {
    if (match.bGuestId === guestId) return 'B';
    if (match.wGuestId === guestId) return 'W';
    return null;
  }

  private present(match: GomokuMatch, guestId: string) {
    return {
      code: match.code,
      status: match.status,
      size: match.size,
      board: match.board,
      turn: match.turn,
      yourMark: this.markOf(match, guestId),
      bName: match.bName,
      wName: match.wGuestId ? match.wName : null,
      winner: match.winner,
      winningLine: match.winningLine,
      draw: match.draw,
    };
  }

  private async requireMatch(code: string): Promise<GomokuMatch> {
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
