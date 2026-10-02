import { PartyService } from './party.service';
import { quApplyMove, quInitialState, quPawnDests, quValidateMove } from './games/quadwall-mp.core';
import { c6ApplyMove, c6InitialState, c6ValidateMove } from './games/connect6-mp.core';
import { qpApplyMove, qpAttrs, qpInitialState, qpValidateMove } from './games/quarto-pass-mp.core';

describe('PartyService — quadwall / connect6 / quarto-pass bot playthroughs', () => {
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

  it('quadwall 3P: bots race and wall until a pawn is home', async () => {
    const last = await playOut('quadwall', 3, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    const w = last.state.winnerSeat;
    expect(w).not.toBeNull();
    const pawn = last.state.pawns[w];
    const home =
      (w === 0 && pawn[0] === 0) || (w === 1 && pawn[0] === 8) || (w === 2 && pawn[1] === 8);
    expect(home).toBe(true);
    expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(w);
  }, 300000);

  it('quadwall 4P: four pawns, five walls each', async () => {
    const last = await playOut('quadwall', 4, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    const w = last.state.winnerSeat;
    expect(w).not.toBeNull();
    const pawn = last.state.pawns[w];
    const home =
      (w === 0 && pawn[0] === 0) ||
      (w === 1 && pawn[0] === 8) ||
      (w === 2 && pawn[1] === 8) ||
      (w === 3 && pawn[1] === 0);
    expect(home).toBe(true);
  }, 300000);

  it('quadwall core: walls cross/overlap rules, jumps, and the trap guard', () => {
    let st = quInitialState(3);
    expect(st.left).toEqual([6, 6, 6]);
    expect(quInitialState(4).left).toEqual([5, 5, 5, 5]);
    // pawn moves from the bottom start
    const dests = quPawnDests(st, 0);
    expect(dests.some((d) => d[0] === 7 && d[1] === 4)).toBe(true);
    expect(dests.some((d) => d[0] === 8 && d[1] === 3)).toBe(true);
    // wall placement + overlap/crossing guards
    expect(quValidateMove(st, 0, { wall: 'h', r: 0, c: 0 })).toBeNull();
    st = quApplyMove(st, 0, { wall: 'h', r: 0, c: 0 });
    expect(st.left[0]).toBe(5);
    expect(quValidateMove(st, 1, { wall: 'h', r: 0, c: 0 })).toContain('already');
    expect(quValidateMove(st, 1, { wall: 'h', r: 0, c: 1 })).toContain('already'); // overlap
    expect(quValidateMove(st, 1, { wall: 'v', r: 0, c: 0 })).toContain('already'); // crossing
    // jumps: adjacent pawn -> straight jump, then diagonals when blocked
    const jumpy = quInitialState(3);
    jumpy.pawns = [
      [4, 4],
      [4, 5],
      [8, 8],
    ];
    const d1 = quPawnDests(jumpy, 0);
    expect(d1.some((d) => d[0] === 4 && d[1] === 6)).toBe(true); // straight jump
    jumpy.vw[4 * 8 + 5] = true; // block the straight jump's landing edge
    const d2 = quPawnDests(jumpy, 0);
    expect(d2.some((d) => d[0] === 4 && d[1] === 6)).toBe(false);
    expect(d2.some((d) => d[0] === 5 && d[1] === 5)).toBe(true); // diagonal
    expect(d2.some((d) => d[0] === 3 && d[1] === 5)).toBe(true);
    // trap guard: walls can seal a pocket — the final wall is refused
    const t = quInitialState(3);
    t.pawns = [
      [1, 0],
      [0, 4],
      [4, 0],
    ];
    const t1 = quApplyMove(t, 0, { wall: 'h', r: 0, c: 0 }); // closes the up door of the pocket
    const t2 = quApplyMove(t1, 1, { wall: 'v', r: 1, c: 1 }); // closes the right door
    expect(quValidateMove(t2, 2, { wall: 'h', r: 1, c: 0 })).toContain('trap'); // would seal it
    expect(quValidateMove(t2, 2, { wall: 'h', r: 0, c: 2 })).toBeNull(); // unrelated — fine
  });

  it('connect6 3P: two stones a turn, first six in a row', async () => {
    const last = await playOut('connect6-mp', 3, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    if (last.state.winnerSeat === null) {
      // a draw is only legitimate when the whole board is filled
      expect(last.state.cells.every((v: number) => v !== 0)).toBe(true);
    } else {
      expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(last.state.winnerSeat);
    }
  }, 300000);

  it('connect6 4P: four colours, six in a row', async () => {
    const last = await playOut('connect6-mp', 4, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
  }, 300000);

  it('connect6 core: placing counters + win detection', () => {
    let st = c6InitialState(3);
    expect(st.placing).toBe(1);
    st = c6ApplyMove(st, 0, { r: 7, c: 7 });
    expect(st.turn).toBe(1);
    expect(st.placing).toBe(2);
    st = c6ApplyMove(st, 1, { r: 0, c: 0 });
    expect(st.turn).toBe(1); // still seat 1 — one stone to go
    expect(st.placing).toBe(1);
    st = c6ApplyMove(st, 1, { r: 0, c: 1 });
    expect(st.turn).toBe(2);
    expect(st.placing).toBe(2);
    expect(c6ValidateMove(st, 1, { r: 5, c: 5 })).toContain('turn');
    expect(c6ValidateMove(st, 2, { r: 0, c: 0 })).toContain('taken');
    expect(c6ValidateMove(st, 2, { r: 99, c: 0 })).toContain('off the board');
    // six in a row wins mid-turn
    const win = c6InitialState(3);
    for (let c = 0; c <= 4; c++) win.cells[0 * 15 + c] = 1;
    const done = c6ApplyMove(win, 0, { r: 0, c: 5 });
    expect(done.phase).toBe('finished');
    expect(done.winnerSeat).toBe(0);
  });

  it('quarto-pass 3P: place what you were handed, hand to the next', async () => {
    const last = await playOut('quarto-pass', 3, 500);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    if (last.state.winnerSeat !== null) {
      expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(last.state.winnerSeat);
    }
  }, 300000);

  it('quarto-pass 4P: the circle of passers', async () => {
    const last = await playOut('quarto-pass', 4, 500);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
  }, 300000);

  it('quarto core: hand/place flow, unique pieces, line win', () => {
    let st = qpInitialState(3);
    expect(qpValidateMove(st, 0, { place: 0 })).toContain('Hand');
    expect(qpValidateMove(st, 0, { hand: 5 })).toBeNull();
    st = qpApplyMove(st, 0, { hand: 5 });
    expect(st.hand).toBe(5);
    expect(st.turn).toBe(1);
    expect(qpValidateMove(st, 1, { hand: 7 })).toContain('Place');
    st = qpApplyMove(st, 1, { place: 0 });
    expect(st.board[0]).toBe(5);
    expect(st.hand).toBe(0);
    expect(st.turn).toBe(1); // seat 1 still acts: must hand now
    st = qpApplyMove(st, 1, { hand: 9 });
    expect(st.hand).toBe(9);
    expect(st.turn).toBe(2);
    expect(qpValidateMove(st, 2, { place: 0 })).toContain('taken');
    st = qpApplyMove(st, 2, { place: 1 });
    expect(qpValidateMove(st, 2, { hand: 5 })).toContain('already');
    // win: craft three pieces sharing colour bit 0, place the fourth
    const win = qpInitialState(3);
    win.board[0] = 2;
    win.board[1] = 4;
    win.board[2] = 6;
    win.hand = 8;
    win.turn = 0;
    const done = qpApplyMove(win, 0, { place: 3 });
    expect(done.phase).toBe('finished');
    expect(done.winnerSeat).toBe(0);
    expect(qpAttrs(2)[0]).toBe(1);
    expect(qpAttrs(8)[0]).toBe(1);
  });
});
