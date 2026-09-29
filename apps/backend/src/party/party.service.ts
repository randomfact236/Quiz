import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { PartyMatch, PartySeat } from './entities/party-match.entity';
import { partyAdapterFor } from './party-adapters';
import { blkApplyPass } from './games/blokus-mp.core';

const TTL_MS = 60 * 60 * 1000; // party tables run longer: 60 minutes, then gone
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0
const MAX_SEATS = 4;

export interface CreatePartyInput {
  gameSlug: string;
  playerName: string;
  guestId: string;
  /** Seat count 3 or 4 (default 4). */
  seats?: number;
  /** Lobby-wide bot tier (default medium). */
  tier?: 'easy' | 'medium' | 'hard';
}

export interface JoinPartyInput {
  playerName: string;
  guestId: string;
}

export interface PartyMoveInput {
  guestId: string;
  move: unknown;
}

@Injectable()
export class PartyService {
  constructor(
    @InjectRepository(PartyMatch)
    private readonly matches: Repository<PartyMatch>
  ) {}

  /** Create a table: host is seat 0; every other seat DEFAULTS TO A BOT. */
  async create(input: CreatePartyInput): Promise<{ code: string }> {
    await this.expireStale();
    const seatCount = Math.min(Math.max(input.seats ?? MAX_SEATS, 2), MAX_SEATS);
    const tier = input.tier ?? 'medium';
    const seats: PartySeat[] = [
      { kind: 'human', guestId: input.guestId, name: input.playerName, tier: 'medium' },
    ];
    for (let i = 1; i < seatCount; i++) {
      // Owner rule 2026-09-28: empty seats are bots (host may close them later
      // via config before start).
      seats.push({ kind: 'bot', guestId: null, name: `Bot ${i}`, tier });
    }
    const adapter = partyAdapterFor(input.gameSlug);
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        gameSlug: input.gameSlug,
        seats,
        turn: 0,
        state: adapter.initialState(seatCount),
        status: 'waiting',
        expiresAt: new Date(Date.now() + TTL_MS),
      })
    );
    return { code: match.code };
  }

  /** A human claims the first open bot seat (bots stay only if seats remain). */
  async join(code: string, input: JoinPartyInput): Promise<unknown> {
    await this.expireStale();
    const match = await this.requireMatch(code);
    const seatIdx = match.seats.findIndex((s) => s.kind === 'human' && s.guestId === input.guestId);
    if (seatIdx >= 0) return this.present(match, input.guestId);
    const open = match.seats.findIndex((s) => s.kind === 'bot');
    if (open < 0) throw new ForbiddenException('This table is full.');
    const seats = match.seats.map((s, i) =>
      i === open
        ? { ...s, kind: 'human' as const, guestId: input.guestId, name: input.playerName }
        : s
    );
    await this.matches.update(match.id, { seats });
    const fresh = await this.requireMatch(code);
    return this.present(fresh, input.guestId);
  }

  /** Host flips empty seats between bot and closed (before start). */
  async configure(
    code: string,
    input: { guestId: string; seat: number; kind: 'bot' | 'closed' }
  ): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'waiting') throw new BadRequestException('Table already started.');
    if (match.seats[0].guestId !== input.guestId) {
      throw new ForbiddenException('Only the host can configure seats.');
    }
    const seat = match.seats[input.seat];
    if (!seat || input.seat === 0) throw new BadRequestException('That seat cannot be changed.');
    if (seat.kind === 'human') throw new BadRequestException('A human sits there.');
    const seats = match.seats.map((s, i) =>
      i === input.seat
        ? {
            ...s,
            kind: input.kind,
            guestId: null,
            name: input.kind === 'bot' ? `Bot ${input.seat}` : 'Closed',
          }
        : s
    );
    await this.matches.update(match.id, { seats });
    const fresh = await this.requireMatch(code);
    return this.present(fresh, input.guestId);
  }

  /** Host starts the table: humans keep seats, bots/closed stand or play. */
  async start(code: string, input: { guestId: string }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'waiting') throw new BadRequestException('Table already started.');
    if (match.seats[0].guestId !== input.guestId) {
      throw new ForbiddenException('Only the host can start.');
    }
    const humanSeats = match.seats.filter((s) => s.kind === 'human').length;
    if (humanSeats < 1) throw new BadRequestException('At least one human is required.');
    await this.matches.update(match.id, { status: 'running' });
    const fresh = await this.requireMatch(code);
    return this.advanceBots(fresh, input.guestId);
  }

  /** Play a move — only the active HUMAN seat may act (server validates). */
  async move(code: string, input: PartyMoveInput): Promise<unknown> {
    let match = await this.requireMatch(code);
    if (match.status === 'waiting') throw new BadRequestException('Table has not started.');
    if (match.status !== 'running') throw new BadRequestException('This table is not running.');

    // Lazy bot advance first: if bots hold the turn, resolve them up to the
    // first human turn (or the end of the game).
    match = await this.advanceBots(match, input.guestId);
    if (match.status !== 'running') return this.present(match, input.guestId);

    const seatIdx = match.seats.findIndex((s) => s.kind === 'human' && s.guestId === input.guestId);
    if (seatIdx < 0) throw new ForbiddenException('You are not part of this table.');
    if (match.turn !== seatIdx) throw new BadRequestException('Not your turn.');

    const adapter = partyAdapterFor(match.gameSlug);
    // pass move (Blokus): record the pass, advance, bots follow
    if (
      input.move &&
      typeof input.move === 'object' &&
      'pass' in (input.move as Record<string, unknown>)
    ) {
      const passed = blkApplyPass(match.state as never) as unknown as Record<string, unknown>;
      const overP = adapter.isOver(passed);
      const placementP = overP ? adapter.placement(passed, adapter.winner(passed)) : null;
      const nextSeat = adapter.resolveTurn
        ? adapter.resolveTurn(match.state, passed, seatIdx, match.turn, match.seats.length)
        : adapter.nextTurn(passed, seatIdx, match.seats.length);
      await this.matches.update(match.id, {
        state: passed as never,
        turn: nextSeat,
        status: overP ? 'finished' : 'running',
        placement: placementP,
      });
      const freshP = await this.requireMatch(code);
      return this.advanceBots(freshP, input.guestId);
    }
    const err = adapter.validate(match.state, seatIdx, input.move);
    if (err) throw new BadRequestException(err);

    const prevState = match.state;
    const state = adapter.apply(match.state, seatIdx, input.move);
    const over = adapter.isOver(state);
    const placement = over ? adapter.placement(state, adapter.winner(state)) : null;
    const turn = adapter.resolveTurn
      ? adapter.resolveTurn(prevState, state, seatIdx, match.turn, match.seats.length)
      : adapter.nextTurn(state, seatIdx, match.seats.length);
    await this.matches.update(match.id, {
      state: state as never,
      turn,
      status: over ? 'finished' : 'running',
      placement,
    });

    const fresh = await this.requireMatch(code);
    return this.advanceBots(fresh, input.guestId);
  }

  /** The poll — every seat syncs the whole authoritative state through it. */
  async view(code: string, guestId: string): Promise<unknown> {
    await this.expireStale();
    let match = await this.requireMatch(code);
    if (match.status === 'running') {
      match = await this.advanceBots(match, guestId);
    }
    return this.present(match, guestId);
  }

  async leave(code: string, guestId: string): Promise<void> {
    const match = await this.requireMatch(code);
    if (match.status === 'finished' || match.status === 'abandoned') return;
    const seatIdx = match.seats.findIndex((s) => s.kind === 'human' && s.guestId === guestId);
    if (seatIdx < 0) return;
    // Owner rule: an abandoning human converts to a bot so the table finishes.
    if (match.status === 'running') {
      const seats = match.seats.map((s, i) =>
        i === seatIdx ? { ...s, kind: 'bot' as const, guestId: null, name: `Bot ${seatIdx}` } : s
      );
      await this.matches.update(match.id, { seats });
    } else {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- internals ------------------------------------------------------------

  /** Play out bot turns until a human's turn or the game ends. */
  private async advanceBots(match: PartyMatch, guestId: string): Promise<PartyMatch> {
    if (match.status !== 'running') return match;
    const adapter = partyAdapterFor(match.gameSlug);
    let current = match;
    for (let guard = 0; guard < 16; guard++) {
      const seat = current.seats[current.turn];
      if (!seat || seat.kind !== 'bot') break;
      if (adapter.isOver(current.state)) break;
      const mv = adapter.botMove(current.state, current.turn, seat.tier);
      const err = adapter.validate(current.state, current.turn, mv);
      if (err) {
        // defensive: treat residual bot illegality as a pass (bots already
        // self-filter; this keeps tables finishing if an adapter drifts).
        const passed = blkApplyPass(current.state as never) as unknown as Record<string, unknown>;
        const overX = adapter.isOver(passed);
        await this.matches.update(current.id, {
          state: passed as never,
          turn: adapter.resolveTurn
            ? adapter.resolveTurn(
                current.state,
                passed,
                current.turn,
                current.turn,
                current.seats.length
              )
            : adapter.nextTurn(passed, current.turn, current.seats.length),
          status: overX ? 'finished' : 'running',
          placement: overX ? adapter.placement(passed, adapter.winner(passed)) : null,
        });
        current = await this.requireMatch(current.code);
        continue;
      }
      const prevState = current.state;
      const state = adapter.apply(current.state, current.turn, mv);
      const over = adapter.isOver(state);
      const placement = over ? adapter.placement(state, adapter.winner(state)) : null;
      const turn = adapter.resolveTurn
        ? adapter.resolveTurn(prevState, state, current.turn, current.turn, current.seats.length)
        : adapter.nextTurn(state, current.turn, current.seats.length);
      await this.matches.update(current.id, {
        state: state as never,
        turn,
        status: over ? 'finished' : 'running',
        placement,
      });
      const fresh = await this.requireMatch(current.code);
      current = fresh;
      if (over) break;
    }
    return current;
  }

  private present(match: PartyMatch, guestId: string) {
    const yourSeat = match.seats.findIndex((s) => s.kind === 'human' && s.guestId === guestId);
    // Hidden-info games: strip per-seat secrets BEFORE state crosses the API
    // (Code Race: the maker's code stays server-side until the table ends).
    let state = match.state;
    try {
      const adapter = partyAdapterFor(match.gameSlug);
      if (adapter.redactFor)
        state = adapter.redactFor(match.state, yourSeat >= 0 ? yourSeat : null);
    } catch {
      /* unknown slug (shouldn't happen) — fall through with raw state */
    }
    return {
      code: match.code,
      gameSlug: match.gameSlug,
      status: match.status,
      seats: match.seats.map((s) => ({
        kind: s.kind,
        name: s.name,
        tier: s.kind === 'bot' ? s.tier : null,
      })),
      turn: match.turn,
      state,
      placement: match.placement,
      yourSeat: yourSeat >= 0 ? yourSeat : null,
      yourTurn: yourSeat >= 0 && match.status === 'running' && match.turn === yourSeat,
    };
  }

  private async requireMatch(code: string): Promise<PartyMatch> {
    const match = await this.matches.findOne({ where: { code: code.toUpperCase() } });
    if (!match) throw new NotFoundException('Party table not found.');
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
    throw new Error('Could not allocate a party code.');
  }
}
