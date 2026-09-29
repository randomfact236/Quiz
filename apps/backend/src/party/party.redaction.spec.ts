import { PartyService } from './party.service';

describe('PartyService — hidden-state redaction on move responses', () => {
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

  it('memory-flip: move() response never carries deck or botMemory', async () => {
    const { code } = await service.create({
      gameSlug: 'memory-flip-mp',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    for (let i = 0; i < 8; i++) {
      const view = (await service.view(code, 'g1')) as any;
      if (view.status !== 'running') break;
      if (!view.yourTurn) continue;
      let cell = -1;
      for (let idx = 0; idx < view.state.claimed.length; idx++) {
        if (
          view.state.claimed[idx] === 0 &&
          !(view.state.revealed || []).some((r: any) => r.cell === idx)
        ) {
          cell = idx;
          break;
        }
      }
      const res = (await service.move(code, { guestId: 'g1', move: { cell } })) as any;
      // redactFor zeroes the deck and empties botMemory (keys remain)
      expect(res.state.deck.every((v: number) => v === 0)).toBe(true);
      expect(Object.keys(res.state.botMemory)).toHaveLength(0);
    }
  });

  it('code-race: move() response hides the code while racing', async () => {
    const { code } = await service.create({
      gameSlug: 'code-race',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    const res = (await service.move(code, { guestId: 'g1', move: { code: [3, 1, 4, 1] } })) as any;
    // setting the code races the bots — the lazy chain may finish the table;
    // while running the code MUST be null, after finish it is revealed
    if (res.state.phase === 'racing') expect(res.state.code).toBeNull();
    else expect(res.status).toBe('finished');
  });
});
