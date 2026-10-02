import { PartyService } from './party.service';
import { tdpApplyMove, tdpInitialState, tdpValidateMove } from './games/two-dice-pig.core';
import { srApplyMove, srInitialState, srValidateMove } from './games/streak-race.core';
import { qnApplyMove, qnInitialState, qnPlacement, qnValidateMove } from './games/quad-nim.core';
import { fkApplyMove, fkInitialState, fkScore, fkValidateMove } from './games/farkle-lite.core';

describe('PartyService — two-dice-pig / streak-race / quad-nim / farkle bot playthroughs', () => {
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
    match = null as unknown as Record<string, any>; // fresh table per call
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

  it('two-dice-pig 3P/4P: bots roll and bank to 100', async () => {
    for (const seats of [3, 4]) {
      const last = await playOut('two-dice-pig', seats, 400);
      expect(last.status).toBe('finished');
      expect(last.placement.length).toBe(seats);
      expect(last.state.bank[last.state.winnerSeat]).toBeGreaterThanOrEqual(100);
      expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(last.state.winnerSeat);
    }
  }, 300000);

  it('two-dice-pig core: bust drops the pot, the pig eats the trough, holds bank', () => {
    const spy = jest.spyOn(Math, 'random');
    // roll: 1 + 6 -> single 1: bust, pot gone, turn passes
    let st = tdpInitialState(3);
    st.pot = 30;
    spy.mockReturnValueOnce(0).mockReturnValueOnce(0.9);
    st = tdpApplyMove(st, 0, { roll: true });
    expect(st.lastRoll).toEqual([1, 6]);
    expect(st.pot).toBe(0);
    expect(st.turn).toBe(1);
    expect(st.bank[0]).toBe(0);
    // roll: 1 + 1 -> PIG: bank reset too
    st.bank[1] = 50;
    st.pot = 20;
    spy.mockReturnValueOnce(0).mockReturnValueOnce(0);
    st = tdpApplyMove(st, 1, { roll: true });
    expect(st.lastEvent).toBe('pig');
    expect(st.bank[1]).toBe(0);
    // doubles pay double: 6 + 6 -> pot 24
    st.turn = 2;
    st.pot = 0;
    spy.mockReturnValueOnce(0.99).mockReturnValueOnce(0.99);
    st = tdpApplyMove(st, 2, { roll: true });
    expect(st.pot).toBe(24);
    // hold banks and wins at 100+
    st.bank[2] = 80;
    st.pot = 24;
    st = tdpApplyMove(st, 2, { hold: true });
    expect(st.bank[2]).toBe(104);
    expect(st.phase).toBe('finished');
    expect(st.winnerSeat).toBe(2);
    spy.mockRestore();
    // validators
    const v = tdpInitialState(3);
    expect(tdpValidateMove(v, 0, { hold: true })).toContain('nothing to bank');
    expect(tdpValidateMove(v, 1, { roll: true })).toContain('turn');
  });

  it('streak-race 3P/4P: runs break and the longest survives', async () => {
    for (const seats of [3, 4]) {
      const last = await playOut('streak-race', seats, 400);
      expect(last.status).toBe('finished');
      expect(last.placement.length).toBe(seats);
    }
  }, 300000);

  it('streak-race core: correct extends, wrong ends the run, all-missed decides', () => {
    const spy = jest.spyOn(Math, 'random');
    let st = srInitialState(3);
    st.value = 5;
    // next roll 12 (rand 0.9): call 'h' -> correct
    spy.mockReturnValueOnce(0.9);
    st = srApplyMove(st, 0, { call: 'h' });
    expect(st.lastCorrect).toBe(true);
    expect(st.streak[0]).toBe(1);
    expect(st.value).toBe(12);
    // call 'h' again but roll 3 (rand 0.15) -> wrong: run ends
    spy.mockReturnValueOnce(0.15);
    st = srApplyMove(st, 1, { call: 'h' });
    expect(st.lastCorrect).toBe(false);
    expect(st.missed[1]).toBe(true);
    expect(st.best[1]).toBe(0);
    // remaining players keep calling
    spy.mockReturnValueOnce(0.2).mockReturnValueOnce(0.9).mockReturnValueOnce(0.5);
    st = srApplyMove(st, 2, { call: 'l' });
    st = srApplyMove(st, 0, { call: 'h' });
    st = srApplyMove(st, 2, { call: 'h' });
    // seat 0 misses -> and seat 2 misses -> all missed -> finish
    if (st.phase === 'playing') {
      let guard = 0;
      while (st.phase === 'playing' && guard < 500) {
        const active = st.turn;
        st = srApplyMove(st, active, { call: 'l' });
        guard += 1;
      }
    }
    expect(st.phase).toBe('finished');
    expect(st.winnerSeat).not.toBeUndefined();
    spy.mockRestore();
    const v = srInitialState(3);
    expect(srValidateMove(v, 0, { call: 'x' })).toContain('call');
    expect(srValidateMove(v, 1, { call: 'h' })).toContain('turn');
  });

  it('quad-nim 4P: the forced sequence crowns the forcer', async () => {
    const last = await playOut('quad-nim', 4, 200);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(last.state.winnerSeat);
  }, 300000);

  it('quad-nim core: the last taker is last, the forcer is 1st', () => {
    let st = qnInitialState(4);
    expect(st.sticks).toBe(22);
    // script: seat0 takes 1, then 3s: last (22nd) stick falls to seat3
    st = qnApplyMove(st, 0, { take: 1 }); // 21
    st = qnApplyMove(st, 1, { take: 3 }); // 18
    st = qnApplyMove(st, 2, { take: 3 }); // 15
    st = qnApplyMove(st, 3, { take: 3 }); // 12
    st = qnApplyMove(st, 0, { take: 3 }); // 9
    st = qnApplyMove(st, 1, { take: 3 }); // 6
    st = qnApplyMove(st, 2, { take: 3 }); // 3
    st = qnApplyMove(st, 3, { take: 3 }); // 0 — seat 3 ate the last stick
    expect(st.phase).toBe('finished');
    expect(st.loserSeat).toBe(3);
    expect(st.winnerSeat).toBe(2); // the forcer moved right before
    const placement = qnPlacement(st);
    expect(placement.find((p) => p.rank === 1)?.seat).toBe(2);
    expect(placement.find((p) => p.rank === 4)?.seat).toBe(3);
    // validators
    const v = qnInitialState(4);
    expect(qnValidateMove(v, 0, { take: 0 })).toContain('one, two or three');
    expect(qnValidateMove(v, 0, { take: 4 })).toContain('one, two or three');
  });

  it('farkle-lite 4P: six dice to 5,000', async () => {
    const last = await playOut('farkle-lite', 4, 800);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    expect(last.state.bank[last.state.winnerSeat]).toBeGreaterThanOrEqual(5000);
  }, 300000);

  it('farkle core: lite scoring table and the farkle burn', () => {
    expect(fkScore([1])).toEqual({ score: 100, used: 1 });
    expect(fkScore([5])).toEqual({ score: 50, used: 1 });
    expect(fkScore([1, 1, 1])).toEqual({ score: 1000, used: 3 });
    expect(fkScore([2, 2, 2])).toEqual({ score: 200, used: 3 });
    expect(fkScore([4, 4, 4, 4])).toEqual({ score: 800, used: 4 });
    expect(fkScore([1, 1, 1, 1, 1])).toEqual({ score: 4000, used: 5 });
    expect(fkScore([1, 2, 3, 4, 5, 6])).toEqual({ score: 1500, used: 6 });
    expect(fkScore([2, 2, 3, 3, 4, 4])).toEqual({ score: 1500, used: 6 });
    expect(fkScore([2, 3, 4, 6, 2, 3])).toEqual({ score: 0, used: 0 });
    const spy = jest.spyOn(Math, 'random');
    // six 1s: 8000 -> bank wins instantly
    let st = fkInitialState(3);
    for (let i = 0; i < 6; i++) spy.mockReturnValueOnce(0);
    st = fkApplyMove(st, 0, { roll: true });
    expect(st.pot).toBe(8000);
    st = fkApplyMove(st, 0, { bank: true });
    expect(st.phase).toBe('finished');
    expect(st.winnerSeat).toBe(0);
    // a farkle roll burns the pot and passes the turn
    let st2 = fkInitialState(3);
    st2.pot = 700;
    st2.phaseTurn = 'decide';
    [0.2, 0.35, 0.5, 0.9, 0.2, 0.35].forEach((v) => spy.mockReturnValueOnce(v));
    st2 = fkApplyMove(st2, 0, { roll: true });
    expect(st2.lastEvent).toBe('farkle');
    expect(st2.pot).toBe(0);
    expect(st2.turn).toBe(1);
    spy.mockRestore();
    const v = fkInitialState(3);
    expect(fkValidateMove(v, 0, { bank: true })).toContain('Roll first');
    expect(fkValidateMove(v, 1, { roll: true })).toContain('turn');
  });
});
