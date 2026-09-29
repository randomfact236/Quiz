import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { GoMatch } from './entities/go-match.entity';

const TTL_MS = 40 * 60 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SIZE = 9;
const CELLS = SIZE * SIZE;
const KOMIS = [0, 5.5];

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

function other(side: number): number {
  return side === BLACK ? WHITE : BLACK;
}

function idxAt(row: number, file: number): number {
  if (row < 0 || row >= SIZE || file < 0 || file >= SIZE) return -1;
  return row * SIZE + file;
}

function neighbours(idx: number): number[] {
  const row = Math.floor(idx / SIZE);
  const file = idx % SIZE;
  return [idxAt(row - 1, file), idxAt(row + 1, file), idxAt(row, file - 1), idxAt(row, file + 1)].filter(
    (n) => n >= 0
  );
}

export function emptyBoard(): number[] {
  return new Array<number>(CELLS).fill(EMPTY);
}

/** Liberties of the group containing `idx`. */
function libertiesAt(cells: number[], idx: number): number {
  const colour = cells[idx];
  if (colour === EMPTY) return 0;
  const seen = new Set<number>([idx]);
  const stack = [idx];
  const libs = new Set<number>();
  while (stack.length) {
    const at = stack.pop() as number;
    for (const n of neighbours(at)) {
      if (cells[n] === EMPTY) libs.add(n);
      else if (cells[n] === colour && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return libs.size;
}

function stonesOfGroup(cells: number[], idx: number): number[] {
  const colour = cells[idx];
  const seen = new Set<number>([idx]);
  const stack = [idx];
  const out: number[] = [];
  while (stack.length) {
    const at = stack.pop() as number;
    out.push(at);
    for (const n of neighbours(at)) {
      if (!seen.has(n) && cells[n] === colour) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return out;
}

export function samePosition(a: number[] | null, b: number[] | null): boolean {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Play a stone: capture first, then refuse suicide. Returns null when the
 * placement is illegal (occupied, or a suicide that captures nothing).
 */
export function playOn(
  cells: number[],
  side: number,
  idx: number
): { cells: number[]; captured: number[] } | null {
  if (idx < 0 || idx >= cells.length || cells[idx] !== EMPTY) return null;
  const next = cells.slice();
  next[idx] = side;
  const foe = other(side);

  const captured: number[] = [];
  for (const n of neighbours(idx)) {
    if (next[n] !== foe) continue;
    if (libertiesAt(next, n) === 0) captured.push(...stonesOfGroup(next, n));
  }
  for (const stone of captured) next[stone] = EMPTY;

  // suicide: legal only if the move captured something
  if (libertiesAt(next, idx) === 0) {
    if (captured.length === 0) return null;
    next[idx] = EMPTY; // a snapback: the capturing stone comes off too
  }
  return { cells: next, captured };
}

/** Chinese AREA scoring: stones plus empty points only your colour touches. */
export function areaScore(cells: number[], komi: number) {
  const blackStones: number[] = [];
  const whiteStones: number[] = [];
  const blackArea: number[] = [];
  const whiteArea: number[] = [];
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] === BLACK) blackStones.push(idx);
    else if (cells[idx] === WHITE) whiteStones.push(idx);
  }
  for (let idx = 0; idx < cells.length; idx++) {
    if (cells[idx] !== EMPTY) continue;
    const around = neighbours(idx).map((n) => cells[n]);
    if (around.every((c) => c === BLACK)) blackArea.push(idx);
    else if (around.every((c) => c === WHITE)) whiteArea.push(idx);
  }
  const black = blackStones.length + blackArea.length;
  const whiteRaw = whiteStones.length + whiteArea.length;
  const white = Math.round((whiteRaw + komi) * 10) / 10;
  return {
    blackArea: black,
    whiteArea: whiteRaw,
    total: { black, white },
    komi,
    winner: Math.abs(black - white) < 0.05 ? null : black > white ? BLACK : WHITE,
    margin: Math.round(Math.abs(black - white) * 10) / 10,
    dame: cells.length - blackStones.length - whiteStones.length - blackArea.length - whiteArea.length,
  };
}

@Injectable()
export class GoService {
  constructor(
    @InjectRepository(GoMatch)
    private readonly matches: Repository<GoMatch>
  ) {}

  async create(input: { playerName: string; guestId: string; komi?: number }): Promise<{ code: string }> {
    await this.expireStale();
    const komi = KOMIS.indexOf(input.komi ?? 5.5) !== -1 ? (input.komi as number) : 5.5;
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        status: 'waiting',
        cells: emptyBoard(),
        turn: BLACK,
        captures: [0, 0],
        passes: 0,
        previous: null,
        lastMove: null,
        komi,
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
   * Play a stone, or pass when `idx` is null. The server resolves the capture,
   * enforces the ko ban, counts the passes and computes the score — a client
   * supplies nothing but the point it wants and whether it is passing.
   */
  async move(code: string, input: { guestId: string; idx: number | null }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') throw new BadRequestException('This match is over.');
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (yourMark !== match.turn) throw new BadRequestException('It is not your turn.');

    // ---- a pass -------------------------------------------------------------
    if (input.idx === null || input.idx === undefined) {
      const passes = (match.passes || 0) + 1;
      const patch: Partial<GoMatch> = {
        cells: match.cells.slice(),
        turn: other(yourMark),
        passes,
        previous: match.cells.slice(),
      };
      if (passes >= 2) {
        const s = areaScore(match.cells, match.komi);
        Object.assign(patch, {
          status: 'finished',
          winner: s.winner,
          draw: !s.winner,
          score: s,
        });
      }
      await this.matches.update(match.id, patch);
      const after = await this.requireMatch(code);
      return this.present(after, input.guestId);
    }

    // ---- a stone ------------------------------------------------------------
    const idx = Number(input.idx);
    if (!Number.isInteger(idx) || idx < 0 || idx >= CELLS) {
      throw new BadRequestException('Illegal move');
    }
    const result = playOn(match.cells, yourMark, idx);
    if (!result) throw new BadRequestException('Illegal move');
    // the simple ko ban: a move may not recreate the position before the last
    if (match.previous && samePosition(result.cells, match.previous)) {
      throw new BadRequestException('Illegal move');
    }

    const captures = [match.captures?.[0] || 0, match.captures?.[1] || 0];
    captures[yourMark === BLACK ? 0 : 1] += result.captured.length;

    // if the placed stone itself was removed (a snapback) the ko ban lifts
    const placedSurvives = result.cells[idx] === yourMark;
    const patch: Partial<GoMatch> = {
      cells: result.cells,
      turn: other(yourMark),
      captures,
      passes: 0,
      previous: placedSurvives ? match.cells.slice() : null,
      lastMove: { idx, captured: result.captured },
    };

    // a player with no legal stone must pass, and two passes score the game
    const opponentStuck = !this.hasAnyMove(result.cells, other(yourMark));
    if (opponentStuck) {
      const s = areaScore(result.cells, match.komi);
      Object.assign(patch, {
        status: 'finished',
        winner: s.winner,
        draw: !s.winner,
        score: s,
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

  // ---- internals ------------------------------------------------------------

  private hasAnyMove(cells: number[], side: number): boolean {
    for (let idx = 0; idx < cells.length; idx++) {
      if (cells[idx] !== EMPTY) continue;
      if (playOn(cells, side, idx)) return true;
    }
    return false;
  }

  private markOf(match: GoMatch, guestId: string): number | null {
    if (match.rGuestId === guestId) return BLACK;
    if (match.yGuestId === guestId) return WHITE;
    return null;
  }

  private present(match: GoMatch, guestId: string) {
    const you = this.markOf(match, guestId);
    return {
      code: match.code,
      status: match.status,
      yourMark: you,
      size: SIZE,
      komi: match.komi,
      cells: match.cells,
      turn: match.turn,
      captures: [match.captures?.[0] || 0, match.captures?.[1] || 0],
      passes: match.passes || 0,
      previous: match.previous,
      lastMove: match.lastMove,
      score: match.score ?? areaScore(match.cells, match.komi),
      rName: match.rName,
      lName: match.yGuestId ? match.yName : null,
      winner: match.winner,
      draw: match.draw,
    };
  }

  private async requireMatch(code: string): Promise<GoMatch> {
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
