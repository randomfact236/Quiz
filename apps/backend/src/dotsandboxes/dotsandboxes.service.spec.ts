import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { DotsAndBoxesService } from './dotsandboxes.service';

/**
 * plan/games/03 — unit specs for the live Dots and Boxes matches: create/join
 * binding, server-side edge validation, box claims WITH the extra turn (the
 * turn does not flip on a claim), the full-board finish, and leave. Direct
 * construction, faked repository.
 */
describe('DotsAndBoxesService', () => {
  let repo: Record<string, jest.Mock>;
  let service: DotsAndBoxesService;
  let match: Record<string, any>;

  const hIndex = (n: number, r: number, c: number) => r * n + c;
  const vIdx = (n: number, r: number, c: number) => n * (n + 1) + r * (n + 1) + c;
  const boxEdges = (n: number, box: number) => {
    const r = Math.floor(box / n);
    const c = box % n;
    return [hIndex(n, r, c), hIndex(n, r + 1, c), vIdx(n, r, c), vIdx(n, r, c + 1)];
  };

  beforeEach(() => {
    const n = 4;
    match = {
      id: 'm1',
      code: 'ABC234',
      size: n,
      edges: Array<number>(40).fill(0),
      owners: Array<number>(16).fill(0),
      turn: 1,
      status: 'running',
      rScore: 0,
      bScore: 0,
      winner: null,
      draw: false,
      rGuestId: 'guest-R',
      rName: 'Rosa',
      bGuestId: 'guest-B',
      bName: 'Bo',
      expiresAt: new Date(Date.now() + 60_000),
    };
    repo = {
      findOne: jest.fn().mockResolvedValue(match),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation(async (x) => ({ ...x, id: 'm-new', code: x.code })),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockImplementation(async (_id, patch) => {
        Object.assign(match, patch);
      }),
    };
    service = new DotsAndBoxesService(repo as any);
  });

  it('creates the match as 🔴 with the requested board size', async () => {
    repo.findOne.mockResolvedValue(null); // no code clash
    const { code } = await service.create({ playerName: 'Rosa', guestId: 'guest-R', size: 5 });

    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    const saved = repo.create.mock.calls[0][0];
    expect(saved.size).toBe(5);
    expect(saved.turn).toBe(1);
    expect(saved.edges).toHaveLength(60);
    expect(saved.owners).toHaveLength(25);
  });

  it('binds 🔵 on first join and starts the match', async () => {
    match.status = 'waiting';
    match.bGuestId = null;
    const view = (await service.join('ABC234', { playerName: 'Bo', guestId: 'guest-B' })) as any;

    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ bGuestId: 'guest-B', status: 'running' })
    );
    expect(view.yourMark).toBe(2);
  });

  it('rejects a third player', async () => {
    await expect(service.join('ABC234', { playerName: 'Eve', guestId: 'guest-E' })).rejects.toThrow(
      ForbiddenException
    );
  });

  it('flips the turn on a plain line', async () => {
    await service.move('ABC234', { guestId: 'guest-R', edge: hIndex(4, 0, 0) });
    expect(match.turn).toBe(2);
    expect(match.rScore).toBe(0);
  });

  it('claims the box and KEEPS the turn on the 4th line (the extra turn)', async () => {
    const [top, bottom, left, right] = boxEdges(4, 0);
    match.edges[bottom] = 2; // someone else owns the bottom line
    match.edges[left] = 2;
    match.edges[right] = 2;
    match.turn = 1;

    const view = (await service.move('ABC234', { guestId: 'guest-R', edge: top })) as any;

    expect(view.owners[0]).toBe(1);
    expect(view.scores).toEqual([1, 0]);
    expect(view.turn).toBe(1); // the mover keeps the initiative
  });

  it('passes the turn only when no box was claimed', async () => {
    match.edges[1] = 1; // box 0's top line taken by Red already
    match.turn = 1;
    await service.move('ABC234', { guestId: 'guest-R', edge: 5 }); // h(1,1): touches boxes 1, 5
    expect(match.turn).toBe(2);
  });

  it('rejects wrong-turn, taken and out-of-range edges', async () => {
    await expect(service.move('ABC234', { guestId: 'guest-B', edge: 0 })).rejects.toThrow(
      BadRequestException
    ); // not B's turn

    match.turn = 1;
    match.edges[0] = 1;
    await expect(service.move('ABC234', { guestId: 'guest-R', edge: 0 })).rejects.toThrow(
      BadRequestException
    ); // taken

    await expect(service.move('ABC234', { guestId: 'guest-R', edge: 999 })).rejects.toThrow(
      BadRequestException
    ); // out of range
  });

  it('finishes the match when the last line is drawn and scores the winner', async () => {
    // fill everything except the last free line; Red takes it, closing a box
    const [top, bottom, left, right] = boxEdges(4, 0);
    for (let e = 0; e < 40; e++) {
      if (e !== top) match.edges[e] = e % 3 === 0 ? 2 : 1; // a mixed board
    }
    match.owners = Array(16).fill(0);
    // claim one box for Red beforehand, then Red's last line closes another
    match.rScore = 5;
    match.bScore = 3;
    match.turn = 1;

    const view = (await service.move('ABC234', { guestId: 'guest-R', edge: top })) as any;

    expect(view.status).toBe('finished');
    expect(view.scores[0]).toBe(6);
    expect(view.winner).toBe(1);
    expect(view.draw).toBe(false);
  });

  it('a level score on the last line is a DRAW, never a win', async () => {
    // same construction as above, but the pre-scores end level after the claim
    const [top] = boxEdges(4, 0);
    for (let e = 0; e < 40; e++) {
      if (e !== top) match.edges[e] = e % 3 === 0 ? 2 : 1;
    }
    match.owners = Array(16).fill(0);
    match.rScore = 3;
    match.bScore = 4;
    match.turn = 1;

    const view = (await service.move('ABC234', { guestId: 'guest-R', edge: top })) as any;

    expect(view.status).toBe('finished');
    expect(view.scores).toEqual([4, 4]);
    expect(view.winner).toBeNull();
    expect(view.draw).toBe(true);
  });

  it('marks the match abandoned on leave', async () => {
    await service.leave('ABC234', 'guest-R');
    expect(repo.update).toHaveBeenCalledWith('m1', { status: 'abandoned' });
  });
});
