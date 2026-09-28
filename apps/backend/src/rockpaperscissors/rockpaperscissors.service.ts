import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { RpsMatch } from './entities/rockpaperscissors-match.entity';

const TTL_MS = 30 * 60 * 1000; // a quickfire match
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PICKS = ['R', 'P', 'S'];
const WIN_TARGET = 3;

/** Does `a` beat `b`? — the TS mirror of the game's core.js. */
function beats(a: string, b: string): boolean {
  return (a === 'R' && b === 'S') || (a === 'P' && b === 'R') || (a === 'S' && b === 'P');
}

@Injectable()
export class RpsService {
  constructor(
    @InjectRepository(RpsMatch)
    private readonly matches: Repository<RpsMatch>
  ) {}

  async create(input: { playerName: string; guestId: string }): Promise<{ code: string }> {
    await this.expireStale();
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        status: 'running',
        rWins: 0,
        yWins: 0,
        rPick: null,
        yPick: null,
        roundNo: 1,
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
      await this.matches.update(match.id, { yGuestId: input.guestId, yName: input.playerName });
    }
    return this.view(code, input.guestId);
  }

  /**
   * The poll. Redacted per player: while a round is pending you see only
   * WHETHER the opponent has picked, never what they picked — the reveal
   * arrives with the round result once both are in.
   */
  async view(code: string, guestId: string): Promise<unknown> {
    const match = await this.requireMatch(code);
    await this.expireStale();
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, guestId);
  }

  /**
   * Lock your throw for this round. When BOTH are in, the server resolves
   * the round and reveals both picks together.
   */
  async pick(code: string, input: { guestId: string; pick: string }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') throw new BadRequestException('This match is over.');
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (!PICKS.includes(input.pick)) throw new BadRequestException('That is not a throw.');
    if (yourMark === 1 && match.rPick)
      throw new BadRequestException('You already threw this round.');
    if (yourMark === 2 && match.yPick)
      throw new BadRequestException('You already threw this round.');

    const rPick = yourMark === 1 ? input.pick : match.rPick;
    const yPick = yourMark === 2 ? input.pick : match.yPick;
    const patch: Partial<RpsMatch> = { rPick, yPick };

    let round = null;
    if (rPick && yPick) {
      // both in — the server decides and reveals together
      const result = rPick === yPick ? 'tie' : beats(rPick, yPick) ? 'R' : 'Y';
      const rWins = match.rWins + (result === 'R' ? 1 : 0);
      const yWins = match.yWins + (result === 'Y' ? 1 : 0);
      const over = rWins >= WIN_TARGET || yWins >= WIN_TARGET;
      Object.assign(patch, {
        rWins,
        yWins,
        rPick: null,
        yPick: null,
        roundNo: match.roundNo + 1,
        lastRound: { r: rPick, y: yPick, result },
        ...(over ? { status: 'finished', winner: rWins >= WIN_TARGET ? 1 : 2 } : {}),
      });
      round = { r: rPick, y: yPick, result, rWins, yWins, over };
    }
    await this.matches.update(match.id, patch);

    const after = await this.matches.findOne({ where: { id: match.id } });
    if (!after) throw new NotFoundException('Match not found.');
    const view = (await this.present(after, input.guestId)) as Record<string, unknown>;
    return { ...view, round };
  }

  async leave(code: string, guestId: string): Promise<void> {
    const match = await this.requireMatch(code);
    if (match.status !== 'finished' && [match.rGuestId, match.yGuestId].includes(guestId)) {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- internals ------------------------------------------------------------

  private markOf(match: RpsMatch, guestId: string): number | null {
    if (match.rGuestId === guestId) return 1;
    if (match.yGuestId === guestId) return 2;
    return null;
  }

  private present(match: RpsMatch, guestId: string) {
    const you = this.markOf(match, guestId);
    const isRed = you === 1;
    const last = match.lastRound;
    return {
      code: match.code,
      status: match.status,
      yourMark: you,
      yourWins: isRed ? match.rWins : match.yWins,
      theirWins: isRed ? match.yWins : match.rWins,
      round: match.roundNo,
      // pending flags only — never the opponent's throw before the reveal
      yourPending: isRed ? !!match.rPick : !!match.yPick,
      theirPending: isRed ? !!match.yPick : !!match.rPick,
      lastRound: last
        ? { you: isRed ? last.r : last.y, them: isRed ? last.y : last.r, result: last.result }
        : null,
      rName: match.rName,
      bName: match.yGuestId ? match.yName : null,
      winner: match.winner,
      target: WIN_TARGET,
    };
  }

  private async requireMatch(code: string): Promise<RpsMatch> {
    const match = await this.matches.findOne({ where: { code: code.toUpperCase() } });
    if (!match) throw new NotFoundException('Match not found.');
    return match;
  }

  private async expireStale(): Promise<void> {
    await this.matches.update(
      { status: In(['running']), expiresAt: LessThan(new Date()) },
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
