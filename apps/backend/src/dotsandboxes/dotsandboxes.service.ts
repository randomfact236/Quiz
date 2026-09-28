import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { DotsAndBoxesMatch } from './entities/dotsandboxes-match.entity';

const TTL_MS = 30 * 60 * 1000; // one casual match: 30 minutes
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0
const SIZES = [3, 4, 5];

const edgeCount = (n: number): number => 2 * n * (n + 1);
/** The four edges of a box, mirroring core.js boxEdges. */
function boxEdges(n: number, box: number): number[] {
  const r = Math.floor(box / n);
  const c = box % n;
  return [
    r * n + c,
    (r + 1) * n + c,
    n * (n + 1) + r * (n + 1) + c,
    n * (n + 1) + r * (n + 1) + c + 1,
  ];
}
const vIndex = (n: number, r: number, c: number): number => n * (n + 1) + r * (n + 1) + c;

/** Which boxes touch an edge — mirrors core.js adjacentBoxes. */
function adjacentBoxes(n: number, edge: number): number[] {
  const hCount = n * (n + 1);
  if (edge < hCount) {
    const r = Math.floor(edge / n);
    const c = edge % n;
    const out: number[] = [];
    if (r > 0) out.push((r - 1) * n + c);
    if (r < n) out.push(r * n + c);
    return out;
  }
  const k = edge - hCount;
  const r = Math.floor(k / (n + 1));
  const c = k % (n + 1);
  const out: number[] = [];
  if (c > 0) out.push(r * n + (c - 1));
  if (c < n) out.push(r * n + c);
  return out;
}

@Injectable()
export class DotsAndBoxesService {
  constructor(
    @InjectRepository(DotsAndBoxesMatch)
    private readonly matches: Repository<DotsAndBoxesMatch>
  ) {}

  async create(input: {
    playerName: string;
    guestId: string;
    size: number;
  }): Promise<{ code: string }> {
    await this.expireStale();
    const n = SIZES.includes(input.size) ? input.size : 4;
    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        size: n,
        edges: Array<number>(edgeCount(n)).fill(0),
        owners: Array<number>(n * n).fill(0),
        turn: 1,
        status: 'waiting',
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
      await this.matches.update(match.id, {
        bGuestId: input.guestId,
        bName: input.playerName,
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

  /**
   * A move is an EDGE index. The server resolves the box claims AND the
   * extra turn — the turn does not simply flip when a box is claimed.
   */
  async move(code: string, input: { guestId: string; edge: number }): Promise<unknown> {
    const match = await this.requireMatch(code);
    if (match.status !== 'running') throw new BadRequestException('This match is not running.');
    const yourMark = this.markOf(match, input.guestId);
    if (!yourMark) throw new ForbiddenException('You are not part of this match.');
    if (match.turn !== yourMark) throw new BadRequestException('Not your turn.');

    const n = match.size;
    const edge = Math.trunc(input.edge);
    if (!Number.isInteger(edge) || edge < 0 || edge >= edgeCount(n)) {
      throw new BadRequestException('That line does not exist.');
    }
    if (match.edges[edge] !== 0) throw new BadRequestException('That line is taken.');

    const edges = [...match.edges];
    const owners = [...match.owners];
    edges[edge] = yourMark;
    let claimed = 0;
    for (const box of adjacentBoxes(n, edge)) {
      if (owners[box] !== 0) continue;
      const missing = boxEdges(n, box).filter((e) => edges[e] === 0).length;
      if (missing === 0) {
        owners[box] = yourMark;
        claimed++;
      }
    }
    const score = yourMark === 1 ? match.rScore + claimed : match.bScore + claimed;
    const full = edges.every((e) => e !== 0);
    const finished = full;
    const winner = finished
      ? match.rScore + (yourMark === 1 ? claimed : 0) >
        match.bScore + (yourMark === 2 ? claimed : 0)
        ? 1
        : 2
      : null;
    const draw = finished && winner === null ? true : false;

    await this.matches.update(match.id, {
      edges,
      owners,
      // the extra turn: a claim keeps the turn with the mover
      turn: claimed > 0 ? yourMark : yourMark === 1 ? 2 : 1,
      ...(yourMark === 1 ? { rScore: score } : { bScore: score }),
      ...(finished ? { status: 'finished', winner, draw } : {}),
    });
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh) throw new NotFoundException('Match not found.');
    return this.present(fresh, input.guestId);
  }

  async leave(code: string, guestId: string): Promise<void> {
    const match = await this.requireMatch(code);
    if (match.status !== 'finished' && [match.rGuestId, match.bGuestId].includes(guestId)) {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- internals ------------------------------------------------------------

  private markOf(match: DotsAndBoxesMatch, guestId: string): number | null {
    if (match.rGuestId === guestId) return 1;
    if (match.bGuestId === guestId) return 2;
    return null;
  }

  private present(match: DotsAndBoxesMatch, guestId: string) {
    return {
      code: match.code,
      status: match.status,
      size: match.size,
      edges: match.edges,
      owners: match.owners,
      turn: match.turn,
      yourMark: this.markOf(match, guestId),
      rName: match.rName,
      bName: match.bGuestId ? match.bName : null,
      scores: [match.rScore, match.bScore],
      winner: match.winner,
      draw: match.draw,
    };
  }

  private async requireMatch(code: string): Promise<DotsAndBoxesMatch> {
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
