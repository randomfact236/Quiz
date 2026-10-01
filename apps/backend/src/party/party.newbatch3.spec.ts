import { PartyService } from './party.service';
import {
  sprAllMoves,
  sprApplyMove,
  sprCheck,
  sprInitialState,
  sprIsOver,
  sprPlacement,
  sprValidateMove,
} from './games/sprouts-mp.core';
import { p3ApplyMove, p3CapturesAt, p3InitialState, p3ValidateMove } from './games/pente3-mp.core';

describe('PartyService — sprouts / pente-3 bot playthroughs', () => {
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

  it('sprouts 3P: bots draw until the board runs dry, last mover first', async () => {
    const last = await playOut('sprouts', 3, 400);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    expect(new Set(last.placement.map((p: any) => p.rank)).size).toBe(3);
    const moves = last.state.moves;
    expect(moves.length).toBeGreaterThanOrEqual(3);
    expect(moves.length).toBeLessThanOrEqual(8); // 3 dots -> at most 3*3-1 lines
    const first = last.placement.find((p: any) => p.rank === 1);
    expect(first.seat).toBe(moves[moves.length - 1].seat);
  }, 300000);

  it('sprouts 4P: four-handed drawing to a finish', async () => {
    const last = await playOut('sprouts', 4, 400);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    expect(last.state.moves.length).toBeLessThanOrEqual(11); // 4 dots -> at most 11
  }, 300000);

  it('sprouts core: lines burn lives, loops need two free ends, tight lines are blocked', () => {
    let st = sprInitialState(3);
    expect(st.dots.length).toBe(3);
    st = sprApplyMove(st, 0, { a: 0, b: 1 });
    expect(st.dots.length).toBe(4);
    expect(st.dots[3].deg).toBe(2); // the new dot is on the line
    expect(st.dots[0].deg).toBe(1);
    expect(st.dots[1].deg).toBe(1);
    expect(st.moves.length).toBe(1);
    expect(st.turn).toBe(1);
    expect(st.edges[0].poly.length).toBe(3); // split into two sub-lines
    // straight through the new dot is blocked (it grazes a dot)
    expect(sprCheck(st, 0, 1).err).toBeTruthy();
    // loop rules: dot 3 has one free end -> no loop, but a line is fine
    expect(sprValidateMove(st, 1, { a: 3, b: 3 })).toContain('two free line-ends');
    // while dot 2 (untouched) can loop to itself
    expect(sprValidateMove(st, 1, { a: 2, b: 2 })).toBeNull();
    st = sprApplyMove(st, 1, { a: 2, b: 2 });
    expect(st.dots.length).toBe(5);
    expect(st.dots[2].deg).toBe(2); // loop burns two ends of the dot
    expect(st.dots[4].deg).toBe(2);
    // turn order + bad input
    expect(sprValidateMove(st, 0, { a: 0, b: 0 })).toContain('turn');
    expect(sprValidateMove(st, 2, { nope: 1 })).toContain('a, b');
    expect(sprValidateMove(st, 2, { a: 99, b: 0 })).toContain('dots');
    // a hand-run game always terminates by the slot bound
    let s = sprInitialState(3);
    let guard = 0;
    while (s.phase === 'playing' && guard < 20) {
      const all = sprAllMoves(s);
      if (!all.length) break;
      s = sprApplyMove(s, s.turn, { a: all[0].a, b: all[0].b });
      guard += 1;
    }
    expect(sprIsOver(s)).toBe(true);
    expect(s.moves.length).toBeLessThanOrEqual(8);
    expect(sprPlacement(s)[0].seat).toBe(s.moves[s.moves.length - 1].seat);
  });

  it('pente-3 3P: bots race to five in a row or five captured pairs', async () => {
    const last = await playOut('pente-3', 3, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    if (last.state.winnerSeat !== null) {
      const first = last.placement.find((p: any) => p.rank === 1);
      expect(first.seat).toBe(last.state.winnerSeat);
    }
  }, 300000);

  it('pente-3 4P: four colours on one board', async () => {
    const last = await playOut('pente-3', 4, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    expect(new Set(last.placement.map((p: any) => p.rank)).size).toBe(4);
  }, 300000);

  it('pente core: sandwiches capture exactly two, five in a row wins', () => {
    // capture: O O bracketed between own stones, new stone closes the right end
    let st = p3InitialState(3);
    st.cells[6 * 13 + 4] = 1; // own
    st.cells[6 * 13 + 5] = 2; // enemy
    st.cells[6 * 13 + 6] = 2; // enemy
    const nx = p3ApplyMove(st, 0, { r: 6, c: 7 });
    expect(nx.cells[6 * 13 + 5]).toBe(0);
    expect(nx.cells[6 * 13 + 6]).toBe(0);
    expect(nx.captured[0]).toBe(1);
    expect(nx.lastCaptured.length).toBe(2);
    expect(nx.phase).toBe('playing');
    // capture helper: exact window X-O-O-X
    const cells = p3InitialState(2).cells;
    cells[6 * 13 + 5] = 2;
    cells[6 * 13 + 4] = 2;
    cells[6 * 13 + 3] = 1;
    expect(p3CapturesAt(cells, 1, 6 * 13 + 6)).toEqual([6 * 13 + 5, 6 * 13 + 4]);
    // a lone stone does not capture
    expect(p3CapturesAt(cells, 1, 6 * 13 + 2)).toEqual([]);
    // five in a row ends it
    let five = p3InitialState(3);
    for (let c = 3; c <= 6; c++) five.cells[6 * 13 + c] = 1;
    const done = p3ApplyMove(five, 0, { r: 6, c: 7 });
    expect(done.phase).toBe('finished');
    expect(done.winnerSeat).toBe(0);
    // validators
    expect(p3ValidateMove(p3InitialState(3), 0, { r: -1, c: 0 })).toContain('off the board');
    expect(p3ValidateMove(p3InitialState(3), 0, { r: 0.5, c: 0 })).toContain('{ r, c }');
    const wrongTurn = p3InitialState(3);
    wrongTurn.turn = 1;
    expect(p3ValidateMove(wrongTurn, 0, { r: 3, c: 3 })).toContain('turn');
    const taken = p3ApplyMove(wrongTurn, 1, { r: 3, c: 3 });
    expect(p3ValidateMove(taken, 2, { r: 3, c: 3 })).toContain('taken');
  });
});
