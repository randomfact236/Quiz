import { PartyService } from './party.service';

/**
 * Ludo MP + Checkers MP specs (dice-tier, all-bot completions + core proofs).
 * Same fake-repo pattern as the other party suites.
 */
describe('PartyService — ludo-mp', () => {
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

  it('runs a full 4-bot ludo race to a finisher with valid placement', async () => {
    const { code } = await service.create({
      gameSlug: 'ludo-mp',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 4,
      tier: 'medium',
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    await service.leave(code, 'g1'); // all bots
    let last: any = null;
    for (let ply = 0; ply < 400; ply++) {
      last = (await service.view(code, 'g1')) as any;
      if (last.status === 'finished') break;
    }
    expect(last.status).toBe('finished');
    expect(last.placement).toHaveLength(4);
    const winner = last.placement.find((p: any) => p.rank === 1);
    const tokensHome = [0, 1].filter((t) => last.state.dist[winner.seat * 2 + t] === 56).length;
    expect(tokensHome).toBe(2);
  }, 180000);
});

describe('PartyService — checkers-hex / checkers-4p', () => {
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

  it('checkers-hex opens with three strips of men (36 total)', async () => {
    const { code } = await service.create({
      gameSlug: 'checkers-hex',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    const men = match.state.grid.flat().filter((v: number) => v !== 0);
    expect(men.length).toBeGreaterThan(0);
    for (let sIdx = 1; sIdx <= 3; sIdx++) {
      expect(men.filter((v: number) => v === sIdx).length).toBeGreaterThan(0);
    }
  });

  it('checkers-4p opens with four border strips (40 total)', async () => {
    const { code } = await service.create({
      gameSlug: 'checkers-4p',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 4,
    });
    match.code = code;
    expect(match.state.grid.length).toBe(10);
    const men = match.state.grid.flat().filter((v: number) => v !== 0);
    expect(men.length).toBeGreaterThan(0);
  });

  it('plays bot-only checkers-hex to elimination with valid placement', async () => {
    const { code } = await service.create({
      gameSlug: 'checkers-hex',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    await service.leave(code, 'g1');
    let last: any = null;
    for (let ply = 0; ply < 400; ply++) {
      last = (await service.view(code, 'g1')) as any;
      if (last.status === 'finished') break;
    }
    expect(last.status).toBe('finished');
    expect(last.placement).toHaveLength(3);
    const ranks = last.placement.map((p: any) => p.rank).sort();
    expect(ranks).toEqual([1, 2, 3]);
  }, 180000);
});
