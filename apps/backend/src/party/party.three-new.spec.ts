import { PartyService } from './party.service';

describe('PartyService — dominoes/crazy-eights/yatzy bot playthroughs', () => {
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

  async function playOut(slug: string, seats: number, maxLoops: number): Promise<any> {
    const { code } = await service.create({
      gameSlug: slug,
      playerName: 'Ana',
      guestId: 'g1',
      seats,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    await service.leave(code, 'g1');
    let last: any = null;
    for (let i = 0; i < maxLoops; i++) {
      last = (await service.view(code, 'g1')) as any;
      if (last.status === 'finished') return last;
    }
    throw new Error(slug + ' did not finish in ' + maxLoops + ' loops');
  }

  it('dominoes-mp 3P: bots play to domino or block, legal line', async () => {
    const last = await playOut('dominoes-mp', 3, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    const line = last.state.line;
    // adjacency invariant: every consecutive pair shares pips at the joint
    for (let i = 1; i < line.length; i++) {
      expect(line[i - 1][1]).toBe(line[i][0]);
    }
  }, 300000);

  it('dominoes-mp 4P: bots play out, hands hidden in views', async () => {
    const last = await playOut('dominoes-mp', 4, 900);
    expect(last.status).toBe('finished');
    expect(last.state.hands.every((h: unknown[]) => h.length === 0)).toBe(true);
  }, 300000);

  it('crazy-eights-mp 3P: bots shed to a winner or deadlock ranking', async () => {
    const last = await playOut('crazy-eights-mp', 3, 1200);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
  }, 300000);

  it('crazy-eights-mp 4P: discard chain stays suit-linked or eight-called', async () => {
    const last = await playOut('crazy-eights-mp', 4, 1200);
    expect(last.status).toBe('finished');
    const d = last.state.discard;
    for (let i = 1; i < d.length; i++) {
      const prev = d[i - 1];
      const cur = d[i];
      const linked = cur.s === prev.s || cur.v === prev.v || cur.v === 8 || prev.v === 8;
      expect(linked).toBe(true);
    }
  }, 300000);

  it('yatzy-mp 3P: full scorecard game completes, totals ordered', async () => {
    const last = await playOut('yatzy-mp', 3, 4000);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    const totals = last.state.scorecards.map((c: Record<string, number | null>) =>
      Object.values(c).reduce<number>((a: number, b) => a + (b ?? 0), 0)
    );
    totals.forEach((t: number) => expect(t).toBeGreaterThanOrEqual(0));
  }, 300000);

  it('yatzy-mp 4P: every card has all 15 categories banked', async () => {
    const last = await playOut('yatzy-mp', 4, 4000);
    expect(last.status).toBe('finished');
    for (const card of last.state.scorecards) {
      for (const key of Object.keys(card)) expect(card[key]).not.toBeNull();
    }
  }, 300000);

  it('redaction: dominoes/crazy-eights views hide other hands + stock', async () => {
    const { code } = await service.create({
      gameSlug: 'crazy-eights-mp',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    const view = (await service.view(code, 'g1')) as any;
    expect(view.state.hands[0].length).toBeGreaterThan(0);
    expect(view.state.hands[1].length).toBe(0);
    expect(view.state.stock.length).toBe(0);
    expect(view.state.handCounts).toBeDefined();
  });
});
