import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { PartyService } from './party.service';
import { QUAD_LINES, quadAiMove } from './games/quad-oxo.core';

/**
 * MP1 party engine specs (owner decision 2026-09-28): empty seats default to
 * bots, server-authoritative moves, lazy bot advance, placement resolution.
 * Direct construction with a faked repository (the ttt spec pattern).
 */
describe('PartyService (quad-oxo)', () => {
  let repo: Record<string, jest.Mock>;
  let service: PartyService;
  let match: Record<string, any>;

  beforeEach(() => {
    match = null as unknown as Record<string, any>;
    repo = {
      findOne: jest.fn().mockImplementation(async ({ where }: any) => {
        if (!match) return null;
        if (where?.code && match.code !== where.code) return null;
        return match;
      }),
      save: jest.fn().mockImplementation(async (x: any) => {
        // First save = row creation: adopt the object and give it an id
        // the way the real DB would (updates address rows by this id).
        if (!match) {
          match = x;
          match.id = 'row-1';
        }
        return x;
      }),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockImplementation(async (idOrCriteria: any, patch: any) => {
        // expireStale() issues a bulk update (criteria object) - skip it;
        // row updates always come through the row id.
        if (match && typeof idOrCriteria === 'string') Object.assign(match, patch);
      }),
    };
    service = new PartyService(repo as never);
  });

  const create = async (
    opts: { seats?: number; tier?: 'easy' | 'medium' | 'hard' } = {}
  ): Promise<void> => {
    const { code } = await service.create({
      gameSlug: 'quad-oxo',
      playerName: 'Ana',
      guestId: 'g1',
      seats: opts.seats,
      tier: opts.tier,
    });
    match.code = code;
  };

  it('creates a 4-seat table with EMPTY SEATS AS BOTS (owner rule)', async () => {
    await create();
    expect(match.seats).toHaveLength(4);
    expect(match.seats[0]).toMatchObject({ kind: 'human', name: 'Ana' });
    expect(match.seats.slice(1).every((s: any) => s.kind === 'bot')).toBe(true);
    expect(match.seats[1].tier).toBe('medium');
    expect(match.state.cells).toHaveLength(25);
    expect(match.state.cells.every((c: string | null) => c === null)).toBe(true);
    expect(match.status).toBe('waiting');
  });

  it('join converts the first bot seat to the joining human; further bots remain', async () => {
    await create();
    await service.join(match.code, { playerName: 'Bo', guestId: 'g2' });
    expect(match.seats[1]).toMatchObject({ kind: 'human', guestId: 'g2', name: 'Bo' });
    expect(match.seats[2].kind).toBe('bot');
    expect(match.seats[3].kind).toBe('bot');
  });

  it('host closes an empty seat; host-only and human-seat guards hold', async () => {
    await create();
    await service.configure(match.code, { guestId: 'g1', seat: 3, kind: 'closed' });
    expect(match.seats[3].kind).toBe('closed');
    await expect(
      service.configure(match.code, { guestId: 'g2', seat: 2, kind: 'closed' })
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.configure(match.code, { guestId: 'g1', seat: 0, kind: 'closed' })
    ).rejects.toThrow(BadRequestException);
  });

  it('start runs the table; 2 humans + 2 bots is the default shape', async () => {
    await create();
    await service.join(match.code, { playerName: 'Bo', guestId: 'g2' });
    await service.start(match.code, { guestId: 'g1' });
    expect(match.status).toBe('running');
    const view = (await service.view(match.code, 'g2')) as any;
    expect(view.seats.filter((s: any) => s.kind === 'human')).toHaveLength(2);
    expect(view.seats.filter((s: any) => s.kind === 'bot')).toHaveLength(2);
    expect(view.yourSeat).toBe(1);
  });

  /** Drive the guest via the game's own medium AI until the table finishes. */
  const driveToFinish = async (guestId: string, maxPlies = 60): Promise<any> => {
    let last: any = null;
    for (let ply = 0; ply < maxPlies; ply++) {
      const view = (await service.view(match.code, guestId)) as any;
      if (view.status === 'finished') return view;
      if (!view.yourTurn) continue;
      const cell = quadAiMove(view.state, view.yourSeat, 'medium');
      last = await service.move(match.code, { guestId, move: cell });
    }
    return last;
  };

  it('plays humans + bots to a finished line with server-resolved placement', async () => {
    await create();
    await service.join(match.code, { playerName: 'Bo', guestId: 'g2' });
    await service.start(match.code, { guestId: 'g1' });

    // A human who never acts correctly stalls the table (bots never act for a
    // human seat) â€” Bo leaves, his seat converts to a bot, the table finishes.
    await service.move(match.code, { guestId: 'g1', move: 12 });
    await service.leave(match.code, 'g2');
    expect(match.seats[1].kind).toBe('bot');
    const last = await driveToFinish('g1', 120);
    expect(last.status).toBe('finished');
    expect(last.placement).not.toBeNull();
    const firsts = last.placement.filter((p: any) => p.rank === 1);
    expect(firsts.length).toBeGreaterThanOrEqual(1);
    expect(last.placement.length).toBe(4);
    if (firsts.length === 1) {
      const sym = ['A', 'B', 'C', 'D'][firsts[0].seat];
      const line = QUAD_LINES.find((l) => l.every((c) => last.state.cells[c] === sym));
      expect(line).toBeDefined();
    } else {
      // Shared finish: board full without any line — every seat rank 1.
      expect(last.state.cells.every((c: string | null) => c !== null)).toBe(true);
    }
  });

  it('rejects out-of-turn and illegal moves', async () => {
    await create();
    await service.join(match.code, { playerName: 'Bo', guestId: 'g2' });
    await service.start(match.code, { guestId: 'g1' });
    await expect(service.move(match.code, { guestId: 'g2', move: 0 })).rejects.toThrow(
      'Not your turn.'
    );
    await service.move(match.code, { guestId: 'g1', move: 0 });
    // After Ana + bots advance, Bo's turn arrives; cell 0 is taken.
    await expect(service.move(match.code, { guestId: 'g2', move: 0 })).rejects.toThrow();
  });

  it('leave during play converts the seat to a bot; the table still finishes', async () => {
    await create();
    await service.join(match.code, { playerName: 'Bo', guestId: 'g2' });
    await service.start(match.code, { guestId: 'g1' });
    await service.move(match.code, { guestId: 'g1', move: 0 });
    await service.leave(match.code, 'g2');
    expect(match.seats[1].kind).toBe('bot');
    // Ana plays alone against three bots; the table must still reach a finish.
    const last = await driveToFinish('g1');
    expect(last.status).toBe('finished');
    expect(last.placement).not.toBeNull();
  });

  it('3-seat tables work the same way (bots fill the remaining seats)', async () => {
    await create({ seats: 3 });
    await service.start(match.code, { guestId: 'g1' });
    const last = await driveToFinish('g1');
    expect(last.status).toBe('finished');
    expect(last.seats).toHaveLength(3);
  });
});
