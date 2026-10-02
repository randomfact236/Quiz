import { PartyService } from './party.service';
import { rpApplyMove, rpInitialState, rpValidateMove } from './games/row-prison.core';
import { trApplyMove, trInitialState, trLayout, trSides } from './games/trinity-hex.core';
import { mlApplyMove, mlInitialState, mlValidateMove } from './games/morris-mp.core';
import {
  abApplyMove,
  abInitialState,
  abLayout,
  abResolve,
  abValidateMove,
} from './games/abalone-mp.core';

describe('PartyService — row-prison / trinity-hex / morris / abalone bot playthroughs', () => {
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
    match = null as unknown as Record<string, any>;
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

  it('row-prison 3P/4P: rows fill, prison breaks, fours land', async () => {
    for (const seats of [3, 4]) {
      const last = await playOut('row-prison', seats, 300);
      expect(last.status).toBe('finished');
      expect(last.placement.length).toBe(seats);
      if (last.state.winnerSeat !== null) {
        expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(last.state.winnerSeat);
      }
    }
  }, 300000);

  it('row-prison core: the prison pins, a full row frees, four wins', () => {
    let st = rpInitialState(3);
    st = rpApplyMove(st, 0, { cell: 0 }); // row 0
    expect(st.prisonRow).toBe(0);
    expect(rpValidateMove(st, 1, { cell: 10 })).toContain('prison');
    expect(rpValidateMove(st, 1, { cell: 5 })).toBeNull();
    // script a four for seat 0 in row 1
    let w = rpInitialState(3);
    const seq: Array<[number, number]> = [
      [0, 10],
      [1, 15],
      [2, 16],
      [0, 11],
      [1, 17],
      [2, 18],
      [0, 12],
      [1, 19],
      [2, 14],
      [0, 13], // four in a row (row 1, cols 0-3)
    ];
    for (const [seat, cell] of seq) {
      w = rpApplyMove(w, seat, { cell });
    }
    expect(w.phase).toBe('finished');
    expect(w.winnerSeat).toBe(0);
  });

  it('trinity-hex 3P: a chain crosses the great hexagon', async () => {
    const last = await playOut('trinity-hex', 3, 200);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
  }, 300000);

  it('trinity core: opposite sides connect', () => {
    const L = trLayout();
    expect(L.cells.length).toBe(61);
    expect(trSides(0).a.length).toBe(5);
    expect(trSides(1).b.length).toBe(5);
    let st = trInitialState(3);
    // seat 0 chains straight up the q=0 column from (0,-4) to (0,4)
    for (let r = -4; r <= 4; r++) {
      st = trApplyMove(st, 0, { cell: L.idx(0, r) });
    }
    expect(st.phase).toBe('finished');
    expect(st.winnerSeat).toBe(0);
  });

  it('morris 3P: mills pull stones until one colour stands', async () => {
    const last = await playOut('morris-mp', 3, 700);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    if (last.state.winnerSeat !== null) {
      expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(last.state.winnerSeat);
    }
  }, 300000);

  it('morris core: mills, protected mills, and removal duty', () => {
    let st = mlInitialState(3);
    expect(st.points.length).toBe(32);
    expect(st.hand).toEqual([9, 9, 9]);
    st = mlApplyMove(st, 0, { place: 0 });
    st = mlApplyMove(st, 1, { place: 10 });
    st = mlApplyMove(st, 2, { place: 20 });
    st = mlApplyMove(st, 0, { place: 1 });
    st = mlApplyMove(st, 1, { place: 11 });
    st = mlApplyMove(st, 2, { place: 21 });
    st = mlApplyMove(st, 0, { place: 2 }); // mill on ring 0 (0,1,2)
    expect(st.pending).toBe(1);
    expect(mlValidateMove(st, 0, { place: 3 })).toContain('remove');
    expect(mlValidateMove(st, 0, { remove: 10 })).toBeNull();
    st = mlApplyMove(st, 0, { remove: 10 });
    expect(st.points[10]).toBe(0);
    expect(st.pending).toBe(0);
    // a protected mill: give seat 1 the (10,11,12) mill with all stones in it
    let p = mlInitialState(3);
    p.points[10] = 2;
    p.points[11] = 2;
    p.points[12] = 2;
    p.points[3] = 1;
    p.points[4] = 1;
    p.turn = 0;
    p.pending = 1;
    p.points[30] = 2; // seat 1 now has something outside the mill
    expect(mlValidateMove(p, 0, { remove: 10 })).toContain('mill');
    expect(mlValidateMove(p, 0, { remove: 30 })).toBeNull();
    // if EVERYTHING they own sits in a mill, a mill stone is fair game
    const q2 = mlInitialState(3);
    q2.points[10] = 2;
    q2.points[11] = 2;
    q2.points[12] = 2;
    q2.turn = 0;
    q2.pending = 1;
    expect(mlValidateMove(q2, 0, { remove: 10 })).toBeNull();
  });

  it('abalone 3P/4P: pushes and ejections to the target', async () => {
    for (const seats of [3, 4]) {
      const last = await playOut('abalone-mp', seats, 500);
      expect(last.status).toBe('finished');
      expect(last.placement.length).toBe(seats);
      const target = seats >= 4 ? 3 : 4;
      const w = last.state.winnerSeat;
      if (last.state.moveCount <= 300) {
        expect(last.state.ejected[w]).toBeGreaterThanOrEqual(target);
      } else {
        // cap finish (rare): the ejections leader takes it
        for (let s = 0; s < seats; s++) {
          expect(last.state.ejected[w]).toBeGreaterThanOrEqual(last.state.ejected[s]);
        }
      }
    }
  }, 300000);

  it('abalone core: sumo rules and edge ejections', () => {
    const st = abInitialState(3);
    const counts = [0, 0, 0];
    for (const v of st.cells) if (v !== 0) counts[v - 1] += 1;
    expect(counts).toEqual([5, 5, 5]);
    // craft: single marble pushes a single enemy; two enemies refuse the push
    const L = abLayout();
    const a = abInitialState(3);
    a.cells = new Array(a.cells.length).fill(0) as number[];
    a.cells[L.idx(2, 0)] = 1;
    a.cells[L.idx(3, 0)] = 2;
    const res = abResolve(a, 0, [L.idx(2, 0)], 0); // dir 0 = (1,0)
    expect('err' in res).toBe(false);
    if (!('err' in res)) {
      expect(res.kind).toBe('push');
      expect(res.ejected).toEqual([L.idx(3, 0)]); // pushed straight off the edge
    }
    const applied = abApplyMove(a, 0, { marbles: [L.idx(2, 0)], dir: 0 });
    expect(applied.ejected[0]).toBe(1);
    // a single marble cannot dislodge a supported pair
    const b = abInitialState(3);
    b.cells = new Array(b.cells.length).fill(0) as number[];
    b.cells[L.idx(0, 0)] = 1;
    b.cells[L.idx(1, 0)] = 2;
    b.cells[L.idx(2, 0)] = 2;
    expect(abValidateMove(b, 0, { marbles: [L.idx(0, 0)], dir: 0 })).toContain('support');
    // two-vs-two: sumo refuses an equal group
    const b3 = abInitialState(3);
    b3.cells = new Array(b3.cells.length).fill(0) as number[];
    b3.cells[L.idx(0, 0)] = 1;
    b3.cells[L.idx(1, -1)] = 1;
    b3.cells[L.idx(2, -2)] = 2;
    b3.cells[L.idx(3, -3)] = 2;
    expect(abValidateMove(b3, 0, { marbles: [L.idx(0, 0), L.idx(1, -1)], dir: 1 })).toContain(
      'sumo'
    );
    // broadside needs space
    expect(abValidateMove(b, 0, { marbles: [L.idx(0, 0)], dir: 2 })).toBeNull();
  });
});
