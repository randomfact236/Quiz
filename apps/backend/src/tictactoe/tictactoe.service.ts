import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { TttMatch } from './entities/ttt-match.entity';

const TTL_MS = 30 * 60 * 1000; // one casual round: 30 minutes, then it's gone
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const other = (mark: string): string => (mark === 'X' ? 'O' : 'X');

/** Server-authoritative outcome — mirrors the game's core.js roundOutcome
 *  (misère flips the winner: completing a line LOSES). */
function outcomeOf(
  board: (string | null)[],
  misere: boolean
): { finished: boolean; winner: string | null; line: number[] | null; draw: boolean } {
  for (const line of LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { finished: true, winner: misere ? other(v) : v, line, draw: false };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { finished: true, winner: null, line: null, draw: true };
  }
  return { finished: false, winner: null, line: null, draw: false };
}

@Injectable()
export class TictactoeService {
  constructor(
    @InjectRepository(TttMatch)
    private readonly matches: Repository<TttMatch>
  ) {}

  async create(input: {
    playerName: string;
    guestId: string;
    misere: boolean;
  }): Promise<{ code: string }> {
    await this.expireStale();
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        board: Array<string | null>(9).fill(null),
        turn: 'X',
        status: 'waiting',
        misere: input.misere,
        xGuestId: input.guestId,
        xName: input.playerName,
        expiresAt: new Date(Date.now() + TTL_MS),
      })
    );
    return { code: match.code };
  }

  async join(code: string, input: { playerName: string; guestId: string }): Promise<unknown> {
    await this.expireStale();
    const match = await this.requireMatch(code);
    if (match.xGuestId === input.guestId) return this.view(code, input.guestId);
    if (match.oGuestId && match.oGuestId !== input.guestId) {
      throw new ForbiddenException('This match is already full.');
    }
    if (!match.oGuestId) {
      await this.matches.update(match.id, {
        oGuestId: input.guestId,
        oName: input.playerName,
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

  async move(code: string, input: { guestId: string; cell: number }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') {
      throw new BadRequestException('This match is not running.');
    }
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (match.turn !== yourMark) throw new BadRequestException('Not your turn.');
    const cell = Math.trunc(input.cell);
    if (!Number.isInteger(cell) || cell < 0 || cell > 8 || match.board[cell] !== null) {
      throw new BadRequestException('That cell is not available.');
    }

    const board = [...match.board];
    board[cell] = yourMark;
    const outcome = outcomeOf(board, match.misere);
    await this.matches.update(match.id, {
      board,
      turn: other(yourMark),
      ...(outcome.finished
        ? {
            status: 'finished',
            winner: outcome.winner,
            winningLine: outcome.line,
            draw: outcome.draw,
          }
        : {}),
    });
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, input.guestId);
  }

  async leave(code: string, guestId: string): Promise<void> {
    const match = await this.requireMatch(code);
    if (match.status !== 'finished' && [match.xGuestId, match.oGuestId].includes(guestId)) {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- internals ------------------------------------------------------------

  private markOf(match: TttMatch, guestId: string): string | null {
    if (match.xGuestId === guestId) return 'X';
    if (match.oGuestId === guestId) return 'O';
    return null;
  }

  private present(match: TttMatch, guestId: string) {
    return {
      code: match.code,
      status: match.status,
      board: match.board,
      turn: match.turn,
      misere: match.misere,
      yourMark: this.markOf(match, guestId),
      xName: match.xName,
      oName: match.oGuestId ? match.oName : null,
      winner: match.winner,
      winningLine: match.winningLine,
      draw: match.draw,
    };
  }

  private async requireMatch(code: string): Promise<TttMatch> {
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
