import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GameChallenge } from './entities/game-challenge.entity';

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0
const TOKEN_LENGTH = 20;
const TTL_MS = 14 * 24 * 60 * 60 * 1000; // challenges are links: two weeks
const MAX_RUNS = 50;

export interface GameRunInput {
  score?: number;
  durationMs?: number;
  moves?: number;
  detail?: string;
}

@Injectable()
export class GameChallengesService {
  constructor(
    @InjectRepository(GameChallenge)
    private readonly challenges: Repository<GameChallenge>
  ) {}

  /** Create a challenge from a finished run. */
  async create(input: {
    gameSlug: string;
    payload: Record<string, unknown>;
    run: GameRunInput;
    playerName: string;
    guestId: string;
  }): Promise<{ token: string }> {
    const challenge = await this.challenges.save(
      this.challenges.create({
        token: await this.generateToken(),
        gameSlug: input.gameSlug,
        payload: this.sanitizePayload(input.payload),
        challengerName: input.playerName,
        challengerGuestId: input.guestId,
        challengeRun: this.sanitizeRun(input.run),
        runs: [],
        expiresAt: new Date(Date.now() + TTL_MS),
      })
    );
    return { token: challenge.token };
  }

  /** The challenge view — guest ids never leave the server. */
  async view(token: string): Promise<unknown> {
    const challenge = await this.requireLive(token);
    return {
      gameSlug: challenge.gameSlug,
      payload: challenge.payload,
      challengerName: challenge.challengerName,
      challengeRun: challenge.challengeRun,
      runs: challenge.runs.map((run) => this.publicRun(run)),
      expiresAt: challenge.expiresAt,
    };
  }

  /** Accept: post your own run. One run per guest — a replay replaces it. */
  async submitRun(
    token: string,
    input: { playerName: string; guestId: string; run: GameRunInput }
  ): Promise<{ recorded: boolean }> {
    const challenge = await this.requireLive(token);
    const rest = challenge.runs.filter((r) => r['guestId'] !== input.guestId);
    challenge.runs = [
      ...rest.slice(-MAX_RUNS + 1),
      {
        ...this.sanitizeRun(input.run),
        guestId: input.guestId,
        at: new Date().toISOString(),
        playerName: input.playerName,
      },
    ];
    await this.challenges.save(challenge);
    return { recorded: true };
  }

  /** The acceptor's own previous run (so the game can say "beat YOUR best"). */
  async myRun(token: string, guestId: string): Promise<unknown> {
    const challenge = await this.requireLive(token);
    const mine = challenge.runs.find((r) => r['guestId'] === guestId);
    return mine ? this.publicRun(mine) : null;
  }

  // ---- internals ------------------------------------------------------------

  private async requireLive(token: string): Promise<GameChallenge> {
    const challenge = await this.challenges.findOne({
      where: { token: token.toUpperCase() },
    });
    if (!challenge) throw new NotFoundException('Challenge not found.');
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This challenge has expired.');
    }
    return challenge;
  }

  private async generateToken(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      let token = '';
      for (let i = 0; i < TOKEN_LENGTH; i += 1) {
        token += TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)];
      }
      const clash = await this.challenges.findOne({ where: { token } });
      if (!clash) return token;
    }
    throw new Error('Could not allocate a challenge token.');
  }

  /** Numbers/strings only, bounded — the payload rides public links. */
  private sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload ?? {})) {
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
      else if (typeof value === 'boolean') out[key] = value;
      else if (typeof value === 'string' && value.length <= 64) out[key] = value;
    }
    return out;
  }

  private sanitizeRun(run: GameRunInput): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (typeof run?.score === 'number' && Number.isFinite(run.score)) {
      out['score'] = Math.round(run.score);
    }
    if (typeof run?.durationMs === 'number' && Number.isFinite(run.durationMs)) {
      out['durationMs'] = Math.max(0, Math.round(run.durationMs));
    }
    if (typeof run?.moves === 'number' && Number.isFinite(run.moves)) {
      out['moves'] = Math.max(0, Math.round(run.moves));
    }
    if (typeof run?.detail === 'string') out['detail'] = run.detail.slice(0, 64);
    return out;
  }

  private publicRun(run: Record<string, unknown>): Record<string, unknown> {
    const { guestId: _omit, ...rest } = run;
    void _omit;
    return rest;
  }
}
