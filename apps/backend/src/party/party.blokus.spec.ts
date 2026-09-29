import { PartyService } from './party.service';

describe('PartyService — blokus-4p', () => {
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

  it('opens with 4 full hands (21 pieces) and an empty 20x20', async () => {
    const { code } = await service.create({
      gameSlug: 'blokus-4p',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 4,
    });
    match.code = code;
    expect(match.state.grid.length).toBe(20);
    expect(match.state.hands).toHaveLength(4);
    expect(match.state.hands[0]).toHaveLength(21);
    expect(match.state.grid.flat().every((v: number) => v === 0)).toBe(true);
  });

  it('corner rule: first placement must cover the seat corner', async () => {
    const { code } = await service.create({
      gameSlug: 'blokus-4p',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 4,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    // Ana (seat 0, corner 0,0) tries the far side — rejected
    await expect(
      service.move(code, { guestId: 'g1', move: { piece: 0, rot: 0, r: 10, c: 10 } })
    ).rejects.toThrow();
    // corner placement accepted
    const view = (await service.move(code, {
      guestId: 'g1',
      move: { piece: 0, rot: 0, r: 0, c: 0 },
    })) as any;
    expect(view.state.grid[0][0]).toBe(1);
  });

  it('bot-only table plays to completion (all pass) with valid placement', async () => {
    const { code } = await service.create({
      gameSlug: 'blokus-4p',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 4,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    await service.leave(code, 'g1');
    let last: any = null;
    for (let ply = 0; ply < 400; ply++) {
      try {
        last = (await service.view(code, 'g1')) as any;
      } catch (e) {
        console.log(
          'DEBUG view threw at ply',
          ply,
          (e as Error).message,
          'turn=',
          last && last.turn,
          'state.turn=',
          last && last.state.turn,
          'hands lens=',
          last && last.state.hands.map((h: number[]) => h.length).join(',')
        );
        throw e;
      }
      if (last.status === 'finished') break;
    }
    expect(last.status).toBe('finished');
    expect(last.placement).toHaveLength(4);
    const totalPlaced = last.state.placements.reduce((a: number, b: number) => a + b, 0);
    expect(totalPlaced).toBeGreaterThan(0);
  }, 300000);
});
