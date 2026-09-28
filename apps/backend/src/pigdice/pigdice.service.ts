import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { In, LessThan, Repository } from 'typeorm';

import { PigDiceMatch } from './entities/pigdice-match.entity';

const TTL_MS = 45 * 60 * 1000; // one casual match
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0
const TARGETS = [50, 100];

/** The die is the SERVER's: crypto RNG, so neither client can influence a roll. */
const rollDie = (): number => randomInt(1, 7); // 1..6, unbiased

@Injectable()
export class PigDiceService {
  constructor(
    @InjectRepository(PigDiceMatch)
    private readonly matches: Repository<PigDiceMatch>
  ) {}

  async create(input: {
    playerName: string;
    guestId: string;
    target?: number;
  }): Promise<{ code: string }> {
    await this.expireStale();
    const target = TARGETS.includes(input.target ?? 100) ? (input.target ?? 100) : 100;
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        status: 'running',
        turn: 1,
        rScore: 0,
        yScore: 0,
        pot: 0,
        target,
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

  /** The poll — both banks, the live pot, whose turn, and the last roll. */
  async view(code: string, guestId: string): Promise<unknown> {
    const match = await this.requireMatch(code);
    await this.expireStale();
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, guestId);
  }

  /**
   * A move is roll | hold. On 'roll' the SERVER produces the pips: 2–6 join
   * the pot and the turn stays; a 1 wipes the pot and passes the turn. On
   * 'hold' the pot banks, the turn passes, and reaching the target finishes.
   */
  async move(code: string, input: { guestId: string; action: string }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') throw new BadRequestException('This match is over.');
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (match.turn !== yourMark) throw new BadRequestException('Not your turn.');

    const other = yourMark === 1 ? 2 : 1;
    const yourScore = yourMark === 1 ? match.rScore : match.yScore;

    if (input.action === 'roll') {
      const pips = rollDie();
      if (pips === 1) {
        await this.matches.update(match.id, { pot: 0, lastRoll: 1, turn: other });
      } else {
        await this.matches.update(match.id, { pot: match.pot + pips, lastRoll: pips });
      }
    } else if (input.action === 'hold') {
      const banked = yourScore + match.pot;
      const won = banked >= match.target;
      await this.matches.update(match.id, {
        ...(yourMark === 1 ? { rScore: banked } : { yScore: banked }),
        pot: 0,
        lastRoll: null,
        turn: other,
        ...(won ? { status: 'finished', winner: yourMark } : {}),
      });
    } else {
      throw new BadRequestException('That is not a move.');
    }

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

  // ---- internals ------------------------------------------------------------

  private markOf(match: PigDiceMatch, guestId: string): number | null {
    if (match.rGuestId === guestId) return 1;
    if (match.yGuestId === guestId) return 2;
    return null;
  }

  private present(match: PigDiceMatch, guestId: string) {
    const you = this.markOf(match, guestId);
    const isRed = you === 1;
    return {
      code: match.code,
      status: match.status,
      turn: match.turn,
      yourMark: you,
      yourScore: isRed ? match.rScore : match.yScore,
      theirScore: isRed ? match.yScore : match.rScore,
      pot: match.pot,
      target: match.target,
      lastRoll: match.lastRoll,
      rName: match.rName,
      bName: match.yGuestId ? match.yName : null,
      winner: match.winner,
    };
  }

  private async requireMatch(code: string): Promise<PigDiceMatch> {
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
