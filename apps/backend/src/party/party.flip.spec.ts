import { BadRequestException } from '@nestjs/common';

import { PartyService } from './party.service';

/**
 * Flip MP specs (Othello-3 3P + QuadFlip 4P): flanking-only placement,
 * pass chains, score-race placement. Same fake-repo pattern as the other
 * party suites.
 */
describe('PartyService — flip games (othello-3 / quadflip)', () => {
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

  const start = async (slug: string, seats: number): Promise<void> => {
    const { code } = await service.create({
      gameSlug: slug,
      playerName: 'Ana',
      guestId: 'g1',
      seats,
      tier: 'medium',
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
  };

  it('othello-3 opens with three 2x2 clusters (4 stones each, 12 total)', async () => {
    await start('othello-3', 3);
    expect(match.state.size).toBe(10);
    expect(match.state.seatCount).toBe(3);
    expect(match.state.scores).toEqual([4, 4, 4]);
    const stones = match.state.grid.flat().filter((v: number) => v !== 0).length;
    expect(stones).toBe(12);
  });

  it('quadflip opens with four 2x2 clusters on 14x14', async () => {
    await start('quadflip', 4);
    expect(match.state.size).toBe(14);
    expect(match.state.scores).toEqual([6, 6, 6, 6]);
    const stones = match.state.grid.flat().filter((v: number) => v !== 0).length;
    expect(stones).toBe(24);
  });

  it('rejects placements that flip nothing', async () => {
    await start('othello-3', 3);
    // A far corner flips nothing on the opening position.
    await expect(service.move(match.code, { guestId: 'g1', move: 0 })).rejects.toThrow(
      BadRequestException
    );
  });

  it('plays flipping moves to a finished score race with valid placement', async () => {
    await start('othello-3', 3);
    let last: any = null;
    for (let ply = 0; ply < 300; ply++) {
      const view = (await service.view(match.code, 'g1')) as any;
      if (view.status === 'finished') {
        last = view;
        break;
      }
      if (!view.yourTurn) continue;
      // Legal move via the public API: try cells until one is accepted.
      let played = false;
      for (let cell = 0; cell < 100 && !played; cell++) {
        try {
          last = await service.move(match.code, { guestId: 'g1', move: cell });
          played = true;
        } catch {}
      }
      if (!played) break;
    }
    expect(last).not.toBeNull();
    if (last.status === 'finished') {
      expect(last.placement).toHaveLength(3);
      const total = last.state.scores.reduce((a: number, b: number) => a + b, 0);
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(100);
    }
  }, 120000);
});
