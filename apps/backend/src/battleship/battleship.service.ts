import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { BattleshipMatch } from './entities/battleship-match.entity';

const TTL_MS = 45 * 60 * 1000; // placement + battle, one sitting
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0
const SIZE = 8;
const CELLS = SIZE * SIZE;
const FLEET = [4, 3, 2]; // ship lengths, in placement order

type Ship = { cells: number[] };

/** Validate a player-submitted fleet: 3 ships of 4/3/2, straight, in-bounds,
 *  no overlap — the server never trusts the client (plan §7). */
function isLegalFleet(fleet: unknown): fleet is Ship[] {
  if (!Array.isArray(fleet) || fleet.length !== FLEET.length) return false;
  const seen = new Set<number>();
  for (let i = 0; i < FLEET.length; i++) {
    const ship = fleet[i] as Ship;
    if (!ship || !Array.isArray(ship.cells) || ship.cells.length !== FLEET[i]) return false;
    // straight: same row (horizontal) or same column (vertical)
    const rows = new Set(ship.cells.map((c) => Math.floor(c / SIZE)));
    const cols = new Set(ship.cells.map((c) => c % SIZE));
    if (rows.size !== 1 && cols.size !== 1) return false;
    // contiguous
    const sorted = [...ship.cells].sort((a, b) => a - b);
    const step = rows.size === 1 ? 1 : SIZE;
    for (let k = 1; k < sorted.length; k++) {
      if (sorted[k] !== sorted[k - 1] + step) return false;
    }
    for (const c of ship.cells) {
      if (!Number.isInteger(c) || c < 0 || c >= CELLS || seen.has(c)) return false;
      seen.add(c);
    }
  }
  return true;
}

@Injectable()
export class BattleshipService {
  constructor(
    @InjectRepository(BattleshipMatch)
    private readonly matches: Repository<BattleshipMatch>
  ) {}

  async create(input: { playerName: string; guestId: string }): Promise<{ code: string }> {
    await this.expireStale();
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        status: 'placing',
        turn: 1,
        rShots: Array<number>(CELLS).fill(0),
        bShots: Array<number>(CELLS).fill(0),
        rIncoming: Array<number>(CELLS).fill(0),
        bIncoming: Array<number>(CELLS).fill(0),
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
    if (match.bGuestId && match.bGuestId !== input.guestId) {
      throw new ForbiddenException('This match is already full.');
    }
    if (!match.bGuestId) {
      await this.matches.update(match.id, { bGuestId: input.guestId, bName: input.playerName });
    }
    return this.view(code, input.guestId);
  }

  /** The poll — a per-player REDACTED view: you see your fleet, your shots and
   *  what landed on you; the enemy fleet NEVER crosses the API. */
  async view(code: string, guestId: string): Promise<unknown> {
    const match = await this.requireMatch(code);
    await this.expireStale();
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, guestId);
  }

  /** Submit YOUR fleet (player-created data); starts the battle once both are in. */
  async placeFleet(code: string, input: { guestId: string; fleet: Ship[] }): Promise<unknown> {
    const match = await this.requireMatch(code);
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (match.status !== 'placing')
      throw new BadRequestException('Both fleets are already placed.');
    if (!isLegalFleet(input.fleet))
      throw new BadRequestException('That fleet placement is not legal.');
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    // the fleet being placed NOW counts toward the check
    const rFleet = yourMark === 1 ? input.fleet : fresh.rFleet;
    const bFleet = yourMark === 2 ? input.fleet : fresh.bFleet;
    const bothPlaced = !!rFleet && !!bFleet;
    await this.matches.update(match.id, {
      ...(yourMark === 1 ? { rFleet: input.fleet } : { bFleet: input.fleet }),
      ...(bothPlaced ? { status: 'running' } : {}),
    });
    const after = await this.matches.findOne({ where: { id: match.id } });
    if (!after) throw new NotFoundException('Match not found.');
    return this.present(after, input.guestId);
  }

  /** Fire one shot at the enemy waters — server-resolved, strict alternation. */
  async fire(code: string, input: { guestId: string; cell: number }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') throw new BadRequestException('The battle is not running.');
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (match.turn !== yourMark) throw new BadRequestException('Not your turn.');
    const cell = Math.trunc(input.cell);
    if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS) {
      throw new BadRequestException('That cell does not exist.');
    }
    const myShots = yourMark === 1 ? match.rShots : match.bShots;
    if (myShots[cell] !== 0) throw new BadRequestException('You already fired there.');

    const enemyFleet = yourMark === 1 ? match.bFleet : match.rFleet;
    const enemyIncoming = yourMark === 1 ? match.bIncoming : match.rIncoming;
    const ship = (enemyFleet ?? []).find((s) => s && s.cells.includes(cell));
    const result = ship ? 'hit' : 'miss';

    const nextMyShots = [...myShots];
    nextMyShots[cell] = result === 'hit' ? 1 : 2; // 1 = hit, 2 = miss — fired cells stay non-zero
    const nextEnemyIncoming = [...enemyIncoming];
    nextEnemyIncoming[cell] = result === 'hit' ? 2 : 1;
    const sunk =
      ship && ship.cells.every((c) => nextEnemyIncoming[c] === 2) ? ship.cells.length : null;

    // did this shot sink the LAST enemy ship?
    const finished = !!(
      ship && enemyFleet?.every((s) => s.cells.every((c) => nextEnemyIncoming[c] === 2))
    );

    await this.matches.update(match.id, {
      ...(yourMark === 1 ? { rShots: nextMyShots } : { bShots: nextMyShots }),
      ...(yourMark === 1 ? { bIncoming: nextEnemyIncoming } : { rIncoming: nextEnemyIncoming }),
      turn: yourMark === 1 ? 2 : 1,
      ...(finished ? { status: 'finished', winner: yourMark } : {}),
    });
    const after = await this.matches.findOne({ where: { id: match.id } });
    if (!after) throw new NotFoundException('Match not found.');
    const view = (await this.present(after, input.guestId)) as Record<string, unknown>;
    return { ...view, lastShot: { cell, result, sunk } };
  }

  async leave(code: string, guestId: string): Promise<void> {
    const match = await this.requireMatch(code);
    if (match.status !== 'finished' && [match.rGuestId, match.bGuestId].includes(guestId)) {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- internals ------------------------------------------------------------

  private markOf(match: BattleshipMatch, guestId: string): number | null {
    if (match.rGuestId === guestId) return 1;
    if (match.bGuestId === guestId) return 2;
    return null;
  }

  /** Per-player view. REDACTION: the opponent's fleet and the shots that
   *  landed on THEIR waters are never included (plan §7). */
  private present(match: BattleshipMatch, guestId: string) {
    const you = this.markOf(match, guestId);
    const isRed = you === 1;
    const yourFleet = (isRed ? match.rFleet : match.bFleet) ?? null;
    const yourShots = isRed ? match.rShots : match.bShots;
    const yourIncoming = isRed ? match.rIncoming : match.bIncoming;
    // which of YOUR ships are sunk (you can know this)
    const sunkYours: number[] = yourFleet
      ? yourFleet
          .map((s, i) => (s.cells.every((c) => yourIncoming[c] === 2) ? i : -1))
          .filter((i) => i !== -1)
      : [];
    return {
      code: match.code,
      status: match.status,
      turn: match.turn,
      yourMark: you,
      yourFleet,
      yourFleetPlaced: !!yourFleet,
      enemyFleetPlaced: isRed ? !!match.bFleet : !!match.rFleet,
      yourShots, // where you fired (hit/miss)
      yourIncoming, // what landed on YOUR waters (0/1 miss/2 hit)
      sunkYours,
      rName: match.rName,
      bName: match.bGuestId ? match.bName : null,
      winner: match.winner,
    };
  }

  private async requireMatch(code: string): Promise<BattleshipMatch> {
    const match = await this.matches.findOne({ where: { code: code.toUpperCase() } });
    if (!match) throw new NotFoundException('Match not found.');
    return match;
  }

  private async expireStale(): Promise<void> {
    await this.matches.update(
      { status: In(['placing', 'running']), expiresAt: LessThan(new Date()) },
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
