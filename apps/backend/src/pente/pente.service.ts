import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { PenteMatch } from './entities/pente-match.entity';

const TTL_MS = 40 * 60 * 1000; // a full game
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SIZES = [15, 19];
const TARGETS = [3, 5];

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const WIN_LENGTH = 5;

const DIRS: Array<[number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function other(side: number): number {
  return side === BLACK ? WHITE : BLACK;
}

/** The compulsory centre stone — a rules constant, not served content. */
export function initialCells(size: number): number[] {
  const cells = new Array<number>(size * size).fill(EMPTY);
  const mid = Math.floor(size / 2);
  cells[mid * size + mid] = BLACK;
  return cells;
}

/** Runs of EXACTLY two enemy stones bracketed by one of `side`'s own. */
export function capturesAt(cells: number[], idx: number, side: number, size: number): number[] {
  if (idx < 0 || idx >= cells.length || cells[idx] !== EMPTY) return [];
  const foe = other(side);
  const row = Math.floor(idx / size);
  const file = idx % size;
  const taken: number[] = [];

  for (const [dr, df] of DIRS) {
    let r = row + dr;
    let f = file + df;
    let run = 0;
    while (r >= 0 && r < size && f >= 0 && f < size) {
      const square = r * size + f;
      if (cells[square] === foe) {
        run++;
        r += dr;
        f += df;
      } else {
        break;
      }
    }
    if (run !== 2) continue; // one or three captures nothing
    if (r >= 0 && r < size && f >= 0 && f < size && cells[r * size + f] === side) {
      let br = row + dr;
      let bf = file + df;
      for (let i = 0; i < 2; i++) {
        taken.push(br * size + bf);
        br += dr;
        bf += df;
      }
    }
  }
  return taken;
}

export function makesFive(cells: number[], idx: number, side: number, size: number): boolean {
  if (cells[idx] !== side) return false;
  const row = Math.floor(idx / size);
  const file = idx % size;
  for (const [dr, df] of DIRS) {
    let count = 1;
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let f = file + df * sign;
      while (r >= 0 && r < size && f >= 0 && f < size && cells[r * size + f] === side) {
        count++;
        r += dr * sign;
        f += df * sign;
      }
    }
    if (count >= WIN_LENGTH) return true;
  }
  return false;
}

export function hasLine(cells: number[], side: number, size: number): boolean {
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] === side && makesFive(cells, idx, side, size)) return true;
  }
  return false;
}

@Injectable()
export class PenteService {
  constructor(
    @InjectRepository(PenteMatch)
    private readonly matches: Repository<PenteMatch>
  ) {}

  async create(input: {
    playerName: string;
    guestId: string;
    size?: number;
    target?: number;
  }): Promise<{ code: string }> {
    await this.expireStale();
    const size = SIZES.indexOf(input.size ?? 19) !== -1 ? (input.size as number) : 19;
    const target = TARGETS.indexOf(input.target ?? 5) !== -1 ? (input.target as number) : 5;
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        status: 'waiting',
        size,
        target,
        cells: initialCells(size),
        turn: WHITE, // black opened with the centre stone
        captures: [0, 0],
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
   * Place one stone. The SERVER resolves the capture and both win conditions —
   * a client cannot claim a pair it did not flank, nor decide that it won.
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
    if (match.cells[idx] !== EMPTY) throw new BadRequestException('Illegal move');

    const captured = capturesAt(match.cells, idx, yourMark, size);
    const cells = match.cells.slice();
    cells[idx] = yourMark;
    for (const square of captured) cells[square] = EMPTY;

    const index = yourMark === BLACK ? 0 : 1;
    const captures = [match.captures[0] || 0, match.captures[1] || 0];
    captures[index] += captured.length / 2;

    const line = makesFive(cells, idx, yourMark, size);
    const won = line || captures[index] >= match.target;
    const full = cells.every((c) => c !== EMPTY);

    const patch: Partial<PenteMatch> = {
      cells,
      captures,
      turn: other(yourMark),
      lastMove: { idx, captured },
    };
    if (won) {
      Object.assign(patch, { status: 'finished', winner: yourMark });
    } else if (full) {
      Object.assign(patch, { status: 'finished', draw: true });
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

  // ---- internals ----------------------------------------------------------------

  private markOf(match: PenteMatch, guestId: string): number | null {
    if (match.rGuestId === guestId) return BLACK;
    if (match.yGuestId === guestId) return WHITE;
    return null;
  }

  private present(match: PenteMatch, guestId: string) {
    const black = match.cells.filter((c) => c === BLACK).length;
    const white = match.cells.filter((c) => c === WHITE).length;
    const you = this.markOf(match, guestId);
    return {
      code: match.code,
      status: match.status,
      yourMark: you,
      size: match.size,
      target: match.target,
      cells: match.cells,
      turn: match.turn,
      captures: [match.captures?.[0] || 0, match.captures?.[1] || 0],
      // your own tally first, so the client needs no side knowledge
      yourCaptures: you ? (you === BLACK ? match.captures[0] : match.captures[1]) || 0 : 0,
      theirCaptures: you ? (you === BLACK ? match.captures[1] : match.captures[0]) || 0 : 0,
      lastMove: match.lastMove,
      stones: { black, white, empty: match.cells.length - black - white },
      rName: match.rName,
      lName: match.yGuestId ? match.yName : null,
      winner: match.winner,
      draw: match.draw,
      line: !!(match.lastMove && match.winner && !match.draw),
    };
  }

  private async requireMatch(code: string): Promise<PenteMatch> {
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
