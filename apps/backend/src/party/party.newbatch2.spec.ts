import { PartyService } from './party.service';
import { partyAdapterFor } from './party-adapters';
import { chInitialState, chApplyMove, chValidateMove } from './games/chomp-mp.core';
import {
  frValidFleet,
  frApplyMove,
  frInitialState,
  frRedactFor,
} from './games/fleet-royale-mp.core';

describe('PartyService — chomp-elimination / fleet-royale bot playthroughs', () => {
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

  it('chomp-elimination 3P: bots eliminate down to one survivor', async () => {
    const last = await playOut('chomp-elimination', 3, 400);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    expect(last.state.eliminated.length).toBe(2);
    expect(new Set(last.placement.map((p: any) => p.rank)).size).toBe(3);
  }, 300000);

  it('chomp-elimination 4P: three eliminations, survivor ranks 1st', async () => {
    const last = await playOut('chomp-elimination', 4, 600);
    expect(last.status).toBe('finished');
    expect(last.state.eliminated.length).toBe(3);
    const first = last.placement.find((p: any) => p.rank === 1);
    expect(last.state.eliminated).not.toContain(first.seat);
  }, 300000);

  it('chomp core: safe bites cut the quadrant, poison resets and eliminates', () => {
    let st = chInitialState(3);
    st = chApplyMove(st, 0, { cell: [1, 1] });
    expect(st.open[0][0]).toBe(true); // poison untouched
    expect(st.open[0][5]).toBe(true); // col 5 of row 0 stays
    expect(st.open[5][0]).toBe(true); // row 5 of col 0 stays
    expect(st.open[1][1]).toBe(false);
    expect(st.turn).toBe(1);
    st = chApplyMove(st, 1, { cell: [0, 5] }); // takes only (0,5)
    expect(st.open[0][5]).toBe(false);
    expect(st.open[0][4]).toBe(true);
    st = chApplyMove(st, 2, { cell: [0, 0] }); // poison — seat 2 out
    expect(st.eliminated).toEqual([2]);
    expect(st.open.every((row) => row.every((v) => v))).toBe(true); // fresh tray
    expect(st.round).toBe(2);
    expect(st.turn).toBe(0);
    expect(chValidateMove(st, 1, { cell: [0, 0] })).toContain('turn');
    expect(chValidateMove(st, 0, { cell: [9, 9] })).toContain('off the tray');
    expect(chValidateMove(st, 0, { nope: true })).toContain('cell');
  });

  it('fleet-royale 3P: bots lay fleets and fight until one is afloat', async () => {
    const last = await playOut('fleet-royale', 3, 500);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    last.state.fleets.forEach((f: any) => {
      if (f) expect(frValidFleet(f)).toBeNull();
    });
    const elim = last.state.eliminated.length;
    if (last.state.winnerSeat === null) {
      expect(elim).toBe(3); // mutual destruction: no fleet left afloat
    } else {
      expect(elim).toBe(2);
      const first = last.placement.find((p: any) => p.rank === 1);
      expect(first.seat).toBe(last.state.winnerSeat);
    }
  }, 300000);

  it('fleet-royale 4P: full placement + battle to the finish', async () => {
    const last = await playOut('fleet-royale', 4, 700);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    expect(last.state.fleets.every((f: any) => f && frValidFleet(f) === null)).toBe(true);
  }, 300000);

  it('fleet-royale redaction: live fleets hidden, segmentsLeft public', () => {
    const ad = partyAdapterFor('fleet-royale');
    let st: any = ad.initialState(3);
    const f0 = [{ cells: [0, 1, 2] }, { cells: [8, 9] }, { cells: [16, 17] }];
    const f1 = [{ cells: [3, 4, 5] }, { cells: [11, 12] }, { cells: [19, 20] }];
    const f2 = [{ cells: [6, 7, 8] }, { cells: [14, 15] }, { cells: [22, 23] }];
    st = ad.apply(st, 0, { fleet: f0 });
    st = ad.apply(st, 1, { fleet: f1 });
    st = ad.apply(st, 2, { fleet: f2 });
    expect(st.phase).toBe('battle');
    const v0 = ad.redactFor!(st, 0) as any;
    expect(v0.fleets[0]).toEqual(f0);
    expect(v0.fleets[1]).toBeNull();
    expect(v0.fleets[2]).toBeNull();
    expect(v0.segmentsLeft).toEqual([7, 7, 7]);
    // seat 0's turn (st.turn === 0): fire at cell 3 — seat 1's ship
    expect(ad.validate(st, 0, { shot: 3 })).toBeNull();
    st = ad.apply(st, 0, { shot: 3 });
    expect(st.fired[3]).toBe(2);
    expect(st.hitsBySeat[1]).toEqual([3]);
    // seat 1's turn now: own waters are legal too (overlap deadlock fix),
    // repeated cells are not
    expect(ad.validate(st, 1, { shot: 11 })).toBeNull(); // own waters allowed
    expect(ad.validate(st, 1, { shot: 23 })).toBeNull();
    expect(ad.validate(st, 1, { shot: 3 })).toContain('already');
  });

  it('fleet core: overlapping cells double-wound, validators bite', () => {
    let st = frInitialState(2);
    const f0 = [{ cells: [38, 39, 40] }, { cells: [0, 1] }, { cells: [7, 8] }];
    const f1 = [{ cells: [40, 41, 42] }, { cells: [2, 3] }, { cells: [9, 10] }];
    st = frApplyMove(st, 0, { fleet: f0 });
    st = frApplyMove(st, 1, { fleet: f1 });
    expect(st.phase).toBe('battle');
    st = frApplyMove(st, 0, { shot: 40 }); // shared cell
    expect(st.hitsBySeat[0]).toEqual([40]);
    expect(st.hitsBySeat[1]).toEqual([40]);
    expect(frValidFleet([{ cells: [0, 1, 2] }, { cells: [3] }, { cells: [4, 5] }])).toContain(
      '2 cells'
    );
    expect(frValidFleet([{ cells: [0, 1, 2] }, { cells: [8, 15] }, { cells: [16, 17] }])).toContain(
      'unbroken'
    );
    expect(frValidFleet([{ cells: [0, 1, 2] }, { cells: [1, 9] }, { cells: [16, 17] }])).toContain(
      'overlap'
    );
  });
});
