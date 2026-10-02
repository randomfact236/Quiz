import { PartyService } from './party.service';
import {
  btApplyMove,
  btInitialState,
  btMovesFrom,
  btValidateMove,
} from './games/breakthrough-mp.core';
import {
  simApplyMove,
  simInitialState,
  simLayout,
  simPlacement,
  simValidateMove,
} from './games/sim-mp.core';
import {
  fcApplyMove,
  fcBotMove,
  fcHasMove,
  fcInitialState,
  fcIsOver,
  fcValidateMove,
} from './games/focus-mp.core';

describe('PartyService — breakthrough / sim / focus bot playthroughs', () => {
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

  it('breakthrough 3P: a corner army reaches the far block', async () => {
    const last = await playOut('breakthrough-mp', 3, 600);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    const w = last.state.winnerSeat;
    expect(w).not.toBeNull();
    const to = last.state.lastMove.to;
    const r = Math.floor(to / 8);
    const c = to % 8;
    const inGoal =
      (w === 0 && r <= 1 && c >= 4) ||
      (w === 1 && r >= 6 && c <= 3) ||
      (w === 2 && r <= 1 && c <= 3);
    expect(inGoal).toBe(true);
    expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(w);
  }, 300000);

  it('breakthrough 4P: four armies, one finish', async () => {
    const last = await playOut('breakthrough-mp', 4, 600);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    expect(last.state.winnerSeat).not.toBeNull();
  }, 300000);

  it('breakthrough core: forward-only moves, captures, goal entry wins', () => {
    let st = btInitialState(3);
    // seat 0 starts in the bottom-left block of 8 pawns
    expect(st.cells[6 * 8 + 0]).toBe(1);
    expect(st.cells[0 * 8 + 4]).toBe(2);
    // forward means toward the goal: no backward moves
    const mid = btInitialState(3);
    mid.cells[6 * 8 + 0] = 0;
    mid.cells[4 * 8 + 3] = 1;
    const dests = btMovesFrom(mid, 0, 4 * 8 + 3);
    expect(dests).toContain(3 * 8 + 3); // up
    expect(dests).toContain(3 * 8 + 4); // up-right
    expect(dests).toContain(4 * 8 + 4); // right
    expect(dests).not.toContain(5 * 8 + 3); // never back
    expect(btValidateMove(mid, 0, { from: 4 * 8 + 3, to: 5 * 8 + 3 })).toContain('cannot go');
    // capture mid-board
    mid.cells[3 * 8 + 3] = 2;
    const after = btApplyMove(mid, 0, { from: 4 * 8 + 3, to: 3 * 8 + 3 });
    expect(after.cells[3 * 8 + 3]).toBe(1);
    expect(after.cells[4 * 8 + 3]).toBe(0);
    expect(after.phase).toBe('playing');
    // entering the goal block wins
    const win = btInitialState(3);
    win.cells[1 * 8 + 4] = 1;
    const done = btApplyMove(win, 0, { from: 1 * 8 + 4, to: 0 * 8 + 4 });
    expect(done.phase).toBe('finished');
    expect(done.winnerSeat).toBe(0);
  });

  it('sim 3P: dots get connected until the table resolves', async () => {
    const last = await playOut('sim-mp', 3, 300);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    expect(last.state.out.length).toBeLessThanOrEqual(2);
    if (last.state.winnerSeat !== null) {
      expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(last.state.winnerSeat);
    }
  }, 300000);

  it('sim 4P: seven dots, four colours', async () => {
    const last = await playOut('sim-mp', 4, 300);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    expect(last.state.out.length).toBeLessThanOrEqual(3);
  }, 300000);

  it('sim core: closing your own triangle takes you out', () => {
    const layout = simLayout(3);
    expect(layout.edges.length).toBe(15);
    expect(layout.dots).toBe(6);
    const idx = (u: number, v: number): number => {
      const a = Math.min(u, v);
      const b = Math.max(u, v);
      return layout.edges.findIndex((e) => e[0] === a && e[1] === b);
    };
    let st = simInitialState(3);
    st = simApplyMove(st, 0, { edge: idx(0, 1) });
    st = simApplyMove(st, 0, { edge: idx(1, 2) });
    expect(st.out.length).toBe(0);
    st = simApplyMove(st, 0, { edge: idx(0, 2) }); // closes the (0,1,2) triangle for seat 0
    expect(st.out).toEqual([0]);
    expect(st.turn).toBe(1); // eliminated seat is skipped
    expect(simValidateMove(st, 0, { edge: idx(0, 3) })).toContain('turn');
    expect(simValidateMove(st, 1, { edge: idx(0, 2) })).toContain('already');
    // if seat 1 also closes a triangle, only seat 2 remains — game over
    st.edgeColor[idx(2, 3)] = 1;
    st.edgeColor[idx(3, 4)] = 1;
    const done = simApplyMove(st, 1, { edge: idx(2, 4) });
    expect(done.out).toEqual([0, 1]);
    expect(done.phase).toBe('finished');
    expect(done.winnerSeat).toBe(2);
    const placement = simPlacement(done);
    expect(placement.find((p) => p.rank === 1)?.seat).toBe(2);
    expect(placement.find((p) => p.rank === 3)?.seat).toBe(0); // first out ranks last
  });

  it('focus 3P: stacks merge, capture by height, last with pieces wins', async () => {
    const last = await playOut('focus-mp', 3, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    const w = last.state.winnerSeat;
    if (w !== null) {
      expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(w);
    }
  }, 300000);

  it('focus 4P: four hands, four stacks', async () => {
    const last = await playOut('focus-mp', 4, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
  }, 300000);

  it('focus core: place, move the top, move the stack, capture and merge rules', () => {
    const idx = (r: number, c: number): number => r * 6 + c;
    let st = fcInitialState(3);
    expect(st.hand).toEqual([12, 12, 12]);
    // enter a piece
    st = fcApplyMove(st, 0, { place: idx(2, 2) });
    expect(st.cells[idx(2, 2)]).toEqual([0]);
    expect(st.hand[0]).toBe(11);
    // merge own pieces onto a stack
    st = fcApplyMove(st, 0, { place: idx(2, 3) });
    st = fcApplyMove(st, 0, { from: idx(2, 3), to: idx(2, 2) });
    expect(st.cells[idx(2, 2)]).toEqual([0, 0]);
    expect(st.cells[idx(2, 3)]).toEqual([]);
    // top-piece move leaves the rest behind
    st = fcApplyMove(st, 0, { from: idx(2, 2), to: idx(2, 3) });
    expect(st.cells[idx(2, 2)]).toEqual([0]);
    expect(st.cells[idx(2, 3)]).toEqual([0]);
    // capture: equal height removes the victim
    st = fcApplyMove(st, 1, { place: idx(1, 3) });
    const cap = fcApplyMove(st, 0, { from: idx(2, 3), to: idx(1, 3) });
    expect(cap.cells[idx(1, 3)]).toEqual([0]);
    // taller cannot be captured by a single piece
    const tall = fcInitialState(3);
    tall.cells[idx(3, 3)] = [1, 1];
    tall.cells[idx(3, 4)] = [0];
    expect(fcValidateMove(tall, 0, { from: idx(3, 4), to: idx(3, 3) })).toContain('shorter');
    // whole-stack capture works
    const big = fcInitialState(3);
    big.cells[idx(3, 3)] = [1, 1];
    big.cells[idx(3, 4)] = [0, 0];
    const bigDone = fcApplyMove(big, 0, { from: idx(3, 4), to: idx(3, 3), stack: true });
    expect(bigDone.cells[idx(3, 3)]).toEqual([0, 0]);
    // cap at five
    const five = fcInitialState(3);
    five.cells[idx(4, 4)] = [0, 0, 0, 0, 0];
    five.cells[idx(4, 5)] = [0];
    expect(fcValidateMove(five, 0, { from: idx(4, 5), to: idx(4, 4) })).toContain('five');
    // fresh state has moves; bots keep a game running
    expect(fcHasMove(fcInitialState(3), 0)).toBe(true);
    let botSt = fcInitialState(3);
    let guard = 0;
    while (!fcIsOver(botSt) && guard < 900) {
      botSt = fcApplyMove(botSt, botSt.turn, fcBotMove(botSt, botSt.turn, 'easy'));
      guard += 1;
    }
    expect(fcIsOver(botSt)).toBe(true);
  }, 300000);
});
