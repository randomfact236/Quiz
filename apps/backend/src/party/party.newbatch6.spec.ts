import { PartyService } from './party.service';
import { qtApplyMove, qtInitialState, qtLayout, qtValidateMove } from './games/quads-mp.core';
import {
  pgApplyMove,
  pgHasFive,
  pgInitialState,
  pgRotateQuad,
  pgValidateMove,
} from './games/pentago-mp.core';
import { atApplyMove, atDests, atInitialState, atValidateMove } from './games/corners-mp.core';

describe('PartyService — quads-trips / pentago / corners bot playthroughs', () => {
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

  it('quads-trips 3P: fours, trips or a full board — always resolves', async () => {
    const last = await playOut('quads-trips', 3, 300);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    if (last.state.winnerSeat !== null) {
      expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(last.state.winnerSeat);
    }
  }, 300000);

  it('quads-trips 4P: four colours dodging triples', async () => {
    const last = await playOut('quads-trips', 4, 300);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
  }, 300000);

  it('quads core: three in a row trips you out, four wins', () => {
    const L = qtLayout(3);
    const c = (q: number, r: number): number => L.idx(q, r);
    let st = qtInitialState(3);
    st = qtApplyMove(st, 0, { cell: c(0, 0) });
    st = qtApplyMove(st, 0, { cell: c(1, 0) });
    expect(st.out.length).toBe(0);
    st = qtApplyMove(st, 0, { cell: c(2, 0) }); // exactly three — seat 0 is out
    expect(st.out).toEqual([0]);
    expect(st.turn).toBe(1); // skips the eliminated seat
    // bridge: X X _ X then the gap stone wins
    let w = qtInitialState(3);
    w = qtApplyMove(w, 0, { cell: c(0, 0) });
    w = qtApplyMove(w, 0, { cell: c(1, 0) });
    w = qtApplyMove(w, 0, { cell: c(3, 0) });
    const done = qtApplyMove(w, 0, { cell: c(2, 0) }); // four in a row
    expect(done.phase).toBe('finished');
    expect(done.winnerSeat).toBe(0);
    // validators
    expect(qtValidateMove(qtInitialState(3), 0, { cell: 999 })).toContain('off the board');
    const taken = qtApplyMove(qtInitialState(3), 0, { cell: 0 });
    expect(qtValidateMove(taken, 1, { cell: 0 })).toContain('taken');
    expect(qtValidateMove(taken, 2, { cell: 5 })).toContain('turn');
  });

  it('pentago 3P: place and twist until five', async () => {
    const last = await playOut('pentago-mp', 3, 200);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    expect(last.state.winnerSeat).not.toBeNull();
    expect(last.placement.find((p: any) => p.rank === 1).seat).toBe(last.state.winnerSeat);
  }, 300000);

  it('pentago 4P: quadrants spin four ways', async () => {
    const last = await playOut('pentago-mp', 4, 200);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
  }, 300000);

  it('pentago core: rotations are exact and five-in-a-row wins after the twist', () => {
    // rotation: (0,0) -> (0,2) clockwise in the top-left quadrant
    const cells = new Array(36).fill(0) as number[];
    cells[0] = 7;
    const cw = pgRotateQuad(cells, 0, 'cw');
    expect(cw[0 * 6 + 2]).toBe(7);
    expect(cw[0]).toBe(0);
    const back = pgRotateQuad(cw, 0, 'ccw');
    expect(back[0]).toBe(7);
    // five detection
    const row = new Array(36).fill(0) as number[];
    for (let c = 0; c < 5; c++) row[c] = 1;
    expect(pgHasFive(row, 1)).toBe(true);
    expect(pgHasFive(row, 2)).toBe(false);
    // win via placement + harmless rotation
    let st = pgInitialState(3);
    for (let c = 0; c < 5; c++) st.cells[c] = 1;
    st = pgApplyMove(st, 0, { place: 5 * 6 + 3, quad: 2, dir: 'cw' });
    expect(st.phase).toBe('finished');
    expect(st.winnerSeat).toBe(0);
    // validators
    const fresh = pgInitialState(3);
    expect(pgValidateMove(fresh, 0, { place: 0, quad: 9, dir: 'cw' })).toContain('quadrant');
    expect(pgValidateMove(fresh, 0, { place: 0, quad: 0, dir: 'sideways' })).toContain('cw');
    const used = pgApplyMove(fresh, 0, { place: 0, quad: 0, dir: 'cw' });
    expect(pgValidateMove(used, 1, { place: 2, quad: 1, dir: 'ccw' })).toContain('taken');
  });

  it('corners 3P: clone, jump and convert to a majority', async () => {
    const last = await playOut('corners-mp', 3, 400);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    const counts = [0, 0, 0];
    for (const v of last.state.cells) if (v !== 0) counts[v - 1] += 1;
    expect(counts[0] + counts[1] + counts[2]).toBe(49); // board full
  }, 300000);

  it('corners 4P: four corner armies spread', async () => {
    const last = await playOut('corners-mp', 4, 400);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
  }, 300000);

  it('corners core: clones duplicate, jumps move, landings convert', () => {
    let st = atInitialState(3);
    // two pieces per corner to start
    expect(st.cells[0]).toBe(1);
    expect(st.cells[1 * 7 + 1]).toBe(1);
    expect(st.cells[1 * 7 + 5]).toBe(2);
    // clone: one-step lands and keeps the original
    let s2 = atInitialState(3);
    s2.cells = new Array(49).fill(0) as number[];
    s2.cells[3 * 7 + 3] = 1;
    s2.cells[3 * 7 + 4] = 2;
    expect(atDests(s2, 0, 3 * 7 + 3)).toContain(2 * 7 + 4); // diagonal clone
    expect(atDests(s2, 0, 3 * 7 + 3)).toContain(3 * 7 + 5); // sideways clone
    const cloned = atApplyMove(s2, 0, { from: 3 * 7 + 3, to: 2 * 7 + 4 });
    expect(cloned.cells[3 * 7 + 3]).toBe(1); // original stays
    expect(cloned.cells[2 * 7 + 4]).toBe(1);
    expect(cloned.cells[3 * 7 + 4]).toBe(1); // adjacent enemy converted
    expect(cloned.lastMove!.flipped.length).toBe(1);
    // jump: two-step moves the piece
    const s3 = atInitialState(3);
    s3.cells = new Array(49).fill(0) as number[];
    s3.cells[2 * 7 + 2] = 1;
    const jumped = atApplyMove(s3, 0, { from: 2 * 7 + 2, to: 4 * 7 + 4 });
    expect(jumped.cells[2 * 7 + 2]).toBe(0);
    expect(jumped.cells[4 * 7 + 4]).toBe(1);
    expect(jumped.lastMove!.cloned).toBe(false);
    // validators: occupied landings and non-legal distances
    expect(atValidateMove(s3, 0, { from: 2 * 7 + 2, to: 2 * 7 + 5 })).toContain('neither a clone');
    expect(atValidateMove(s3, 0, { from: 0, to: 1 })).toContain('own pieces');
  });
});
