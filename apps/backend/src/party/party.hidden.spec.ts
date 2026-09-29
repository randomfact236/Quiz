import { BadRequestException } from '@nestjs/common';

import { PartyService } from './party.service';

/**
 * Hidden-info + elimination specs: code-race (maker's secret never crosses
 * the API) and notakto-mp (line = elimination). Same fake-repo pattern.
 */
describe('PartyService — code-race', () => {
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
        if (!match) {
          match = x;
          match.id = 'row-1';
        }
        return x;
      }),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockImplementation(async (idOrCriteria: any, patch: any) => {
        if (match && typeof idOrCriteria === 'string') Object.assign(match, patch);
      }),
    };
    service = new PartyService(repo as never);
  });

  const start = async (): Promise<void> => {
    const { code } = await service.create({
      gameSlug: 'code-race',
      playerName: 'Maker',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    await service.join(code, { playerName: 'Bo', guestId: 'g2' });
    await service.join(code, { playerName: 'Cy', guestId: 'g3' });
    await service.start(code, { guestId: 'g1' });
  };

  it('maker sets the code; breakers cannot set it', async () => {
    await start();
    await expect(
      service.move(match.code, { guestId: 'g2', move: { code: [1, 2, 3, 4] } })
    ).rejects.toThrow(BadRequestException);
    await service.move(match.code, { guestId: 'g1', move: { code: [2, 4, 1, 3] } });
    expect(match.state.phase).toBe('racing');
    expect(match.state.code).toEqual([2, 4, 1, 3]);
  });

  it('REDACTION: the running state never contains the code', async () => {
    await start();
    await service.move(match.code, { guestId: 'g1', move: { code: [5, 1, 4, 2] } });
    const view = (await service.view(match.code, 'g1')) as any;
    expect(view.state.code).toBeNull(); // redacted even for the maker's own client
    expect(match.state.code).toEqual([5, 1, 4, 2]); // server still holds it
  });

  it('a correct guess finishes the table with the cracker 1st', async () => {
    await start();
    await service.move(match.code, { guestId: 'g1', move: { code: [3, 1, 4, 2] } });
    // seat 1 guesses exactly right on turn one
    const last = (await service.move(match.code, {
      guestId: 'g2',
      move: { guess: [3, 1, 4, 2] },
    })) as any;
    expect(last.status).toBe('finished');
    const first = last.placement.filter((p: any) => p.rank === 1);
    expect(first).toHaveLength(1);
    expect(first[0].seat).toBe(1);
  });

  it('wrong guesses score black/white feedback', async () => {
    await start();
    await service.move(match.code, { guestId: 'g1', move: { code: [1, 2, 3, 4] } });
    // seat 1 guesses [1,2,4,3]: 2 black, 2 white
    const view = (await service.move(match.code, {
      guestId: 'g2',
      move: { guess: [1, 2, 4, 3] },
    })) as any;
    const row = view.state.rows['1'][0];
    expect(row.black).toBe(2);
    expect(row.white).toBe(2);
  });
});

describe('PartyService — notakto-mp', () => {
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
        if (!match) {
          match = x;
          match.id = 'row-1';
        }
        return x;
      }),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockImplementation(async (idOrCriteria: any, patch: any) => {
        if (match && typeof idOrCriteria === 'string') Object.assign(match, patch);
      }),
    };
    service = new PartyService(repo as never);
  });

  const start = async (): Promise<void> => {
    const { code } = await service.create({
      gameSlug: 'notakto-mp',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    await service.join(code, { playerName: 'Bo', guestId: 'g2' });
    await service.join(code, { playerName: 'Cy', guestId: 'g3' });
    await service.start(code, { guestId: 'g1' });
  };

  it('opens with 27 empty cells and three boards', async () => {
    await start();
    expect(match.state.cells).toHaveLength(27);
    expect(match.state.cells.every((c: string | null) => c === null)).toBe(true);
  });

  it('an eliminated seat is skipped and the table finishes (bot-driven)', async () => {
    await start();
    // Ana leaves immediately: seat 0 converts to a bot. Three bots then play
    // notakto to completion via the lazy advance on every view().
    await service.leave(match.code, 'g1');
    await service.leave(match.code, 'g2');
    await service.leave(match.code, 'g3');
    expect(match.seats.every((s: any) => s.kind === 'bot')).toBe(true);
    let last: any = null;
    for (let ply = 0; ply < 200; ply++) {
      last = (await service.view(match.code, 'g2')) as any;
      if (last.status === 'finished') break;
    }
    expect(last.status).toBe('finished');
    expect(last.placement).toHaveLength(3);
    const ranks = last.placement.map((p: any) => p.rank).sort();
    expect(ranks).toEqual([1, 2, 3]);
  }, 120000);

  it('core: line completion eliminates the mover (pure-model proof)', async () => {
    // Pure-model proof independent of seat timing: seat 2 completes the top
    // row of board 0 and must be eliminated immediately.
    const core = require('./games/notakto-mp.core');
    const st = core.nkInitialState(3);
    const s1 = core.nkApplyMove(st, 0, 0);
    const s2 = core.nkApplyMove(s1, 1, 9);
    const s3 = core.nkApplyMove(s2, 0, 1);
    const s4 = core.nkApplyMove(s3, 1, 10);
    const s5 = core.nkApplyMove(s4, 0, 18);
    const s6 = core.nkApplyMove(s5, 2, 2); // seat 2 completes the line
    expect(s6.eliminated).toContain(2);
    expect(core.nkIsOver(s6)).toBe(false); // two players remain
    expect(core.nkPlacement(s6).find((p: any) => p.seat === 2).rank).toBe(3);
  });
});
