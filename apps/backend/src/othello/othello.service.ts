import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { OthelloMatch } from './entities/othello-match.entity';

const TTL_MS = 30 * 60 * 1000; // a full game
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SIZES = [6, 8, 10];

const EMPTY = 0;
const DARK = 1;
const LIGHT = 2;

const DIRS: Array<[number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function other(side: number): number {
  return side === DARK ? LIGHT : DARK;
}

/** The standard centre opening for this size — a rules constant. */
export function initialCells(size: number): number[] {
  const cells = new Array<number>(size * size).fill(EMPTY);
  const mid = Math.floor(size / 2);
  cells[(mid - 1) * size + (mid - 1)] = LIGHT;
  cells[(mid - 1) * size + mid] = DARK;
  cells[mid * size + (mid - 1)] = DARK;
  cells[mid * size + mid] = LIGHT;
  return cells;
}

/** The discs `side` outflanks by playing at `idx` — a straight run of enemy
 *  discs closed by one of its own. [] for an illegal square. */
export function flipsFor(cells: number[], idx: number, side: number, size: number): number[] {
  if (idx < 0 || idx >= cells.length) return [];
  if (cells[idx] !== EMPTY) return [];
  const row = Math.floor(idx / size);
  const file = idx % size;
  const foe = other(side);
  const flipped: number[] = [];

  for (const [dr, df] of DIRS) {
    const run: number[] = [];
    let r = row + dr;
    let f = file + df;
    while (r >= 0 && r < size && f >= 0 && f < size) {
      const square = r * size + f;
      if (cells[square] === foe) {
        run.push(square);
      } else if (cells[square] === side) {
        if (run.length > 0) flipped.push(...run);
        break;
      } else {
        break; // an empty square ends the line — no bracket
      }
      r += dr;
      f += df;
    }
  }
  return flipped;
}

export function legalMoves(cells: number[], side: number, size: number): number[] {
  const moves: number[] = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] === EMPTY && flipsFor(cells, idx, side, size).length > 0) moves.push(idx);
  }
  return moves;
}

function isOver(cells: number[], size: number): boolean {
  return legalMoves(cells, DARK, size).length === 0 && legalMoves(cells, LIGHT, size).length === 0;
}

export function discCount(cells: number[]) {
  let dark = 0;
  let light = 0;
  for (const cell of cells) {
    if (cell === DARK) dark++;
    else if (cell === LIGHT) light++;
  }
  return { dark, light };
}

@Injectable()
export class OthelloService {
  constructor(
    @InjectRepository(OthelloMatch)
    private readonly matches: Repository<OthelloMatch>
  ) {}

  async create(input: {
    playerName: string;
    guestId: string;
    size?: number;
  }): Promise<{ code: string }> {
    await this.expireStale();
    const size = SIZES.indexOf(input.size ?? 8) !== -1 ? (input.size as number) : 8;
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        status: 'waiting',
        size,
        cells: initialCells(size),
        turn: DARK,
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
        status: 'running', // the seat only exists once a challenger arrives
      });
    }
    return this.view(code, input.guestId);
  }

  /** The poll — 3-second cadence. */
  async view(code: string, guestId: string): Promise<unknown> {
    const match = await this.requireMatch(code);
    await this.expireStale();
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, guestId);
  }

  /**
   * Place one disc. The server recomputes the flips — a client cannot claim
   * discs it did not actually outflank — and owns the pass rule: when the side
   * to move has no placement the turn is handed straight back.
   */
  async move(code: string, input: { guestId: string; idx: number }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') throw new BadRequestException('This match is over.');
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (yourMark !== match.turn) throw new BadRequestException('It is not your turn.');

    const size = match.size;
    const idx = Number(input.idx);
    if (!Number.isInteger(idx) || idx < 0 || idx >= size * size) {
      throw new BadRequestException('Illegal move');
    }

    const flipped = flipsFor(match.cells, idx, match.turn, size);
    if (flipped.length === 0) throw new BadRequestException('Illegal move');

    const cells = match.cells.slice();
    cells[idx] = match.turn;
    for (const square of flipped) cells[square] = match.turn;

    // the pass rule, resolved server-side so both players see the same turn
    let turn = other(match.turn);
    if (legalMoves(cells, turn, size).length === 0) {
      if (legalMoves(cells, match.turn, size).length === 0) {
        const { dark, light } = discCount(cells);
        await this.matches.update(match.id, {
          cells,
          lastMove: { idx, flipped },
          status: 'finished',
          winner: dark === light ? null : dark > light ? DARK : LIGHT,
          draw: dark === light,
        });
        const done = await this.requireMatch(code);
        return this.present(done, input.guestId);
      }
      turn = match.turn; // the opponent was stuck — hand it back
    }

    await this.matches.update(match.id, {
      cells,
      turn,
      lastMove: { idx, flipped },
    });
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

  // ---- internals ----------------------------------------------------------------

  private markOf(match: OthelloMatch, guestId: string): number | null {
    if (match.rGuestId === guestId) return DARK;
    if (match.yGuestId === guestId) return LIGHT;
    return null;
  }

  private present(match: OthelloMatch, guestId: string) {
    const counts = discCount(match.cells);
    return {
      code: match.code,
      status: match.status,
      yourMark: this.markOf(match, guestId),
      size: match.size,
      cells: match.cells,
      turn: match.turn,
      lastMove: match.lastMove,
      rName: match.rName,
      lName: match.yGuestId ? match.yName : null,
      dark: counts.dark,
      light: counts.light,
      winner: match.winner,
      draw: match.draw,
    };
  }

  private async requireMatch(code: string): Promise<OthelloMatch> {
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
