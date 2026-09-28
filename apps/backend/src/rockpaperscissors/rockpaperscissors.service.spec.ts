import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { RpsService } from './rockpaperscissors.service';

/**
 * plan/games/07 — unit specs for live Rock Paper Scissors: create/join, the
 * pick lock (no double-throw), THE KEY PROPERTY — a pending opponent's throw
 * never appears in your view until both are in (no second-mover cheat) — the
 * server round resolution, and the first-to-3 match win. Direct construction.
 */
describe('RpsService', () => {
  let repo: Record<string, jest.Mock>;
  let service: RpsService;
  let match: Record<string, any>;

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      status: 'running',
      rWins: 0,
      yWins: 0,
      rPick: null,
      yPick: null,
      roundNo: 1,
      lastRound: null,
      winner: null,
      rGuestId: 'guest-R',
      rName: 'Rosa',
      yGuestId: 'guest-Y',
      yName: 'Yusuf',
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
    service = new RpsService(repo as any);
  });

  it('creates a match as 🔴 and joins 🔵 (third player rejected)', async () => {
    repo.findOne.mockResolvedValue(null); // no code clash
    const { code } = await service.create({ playerName: 'Rosa', guestId: 'guest-R' });
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    const saved = repo.create.mock.calls[0][0];
    expect(saved.rWins).toBe(0);
    expect(saved.roundNo).toBe(1);

    repo.findOne.mockResolvedValue(match); // the no-clash mock only covers create
    match.yGuestId = null;
    const view = (await service.join('ABC234', { playerName: 'Yusuf', guestId: 'guest-Y' })) as any;
    expect(view.yourMark).toBe(2);
    match.yGuestId = 'guest-Y';
    await expect(service.join('ABC234', { playerName: 'Eve', guestId: 'guest-E' })).rejects.toThrow(
      ForbiddenException
    );
  });

  it('a pending opponent pick is never visible in your view (no second-mover cheat)', async () => {
    // Red throws first; Blue's view must show ONLY the pending flag
    await service.pick('ABC234', { guestId: 'guest-R', pick: 'R' });
    const blueView = (await service.view('ABC234', 'guest-Y')) as any;
    expect(blueView.yourPending).toBe(false);
    expect(blueView.theirPending).toBe(true);
    expect(blueView.theirPick).toBeUndefined();
    expect(JSON.stringify(blueView)).not.toContain('"theirPick"');
  });

  it('the server resolves the round only when BOTH throws are locked, and reveals together', async () => {
    const a = (await service.pick('ABC234', { guestId: 'guest-R', pick: 'R' })) as any;
    expect(a.round).toBeNull(); // not resolved yet
    const b = (await service.pick('ABC234', { guestId: 'guest-Y', pick: 'S' })) as any;
    expect(b.round).toMatchObject({ r: 'R', y: 'S', result: 'R', rWins: 1, over: false });
    expect(match.rWins).toBe(1);
    expect(match.roundNo).toBe(2);
    // the reveal is visible to both afterwards
    const blueAfter = (await service.view('ABC234', 'guest-Y')) as any;
    expect(blueAfter.lastRound).toEqual({ you: 'S', them: 'R', result: 'R' });
    expect(blueAfter.yourWins).toBe(0);
    expect(blueAfter.theirWins).toBe(1);
  });

  it('locks each player to one throw per round and rejects junk', async () => {
    await service.pick('ABC234', { guestId: 'guest-R', pick: 'R' });
    await expect(service.pick('ABC234', { guestId: 'guest-R', pick: 'P' })).rejects.toThrow(
      BadRequestException
    );
    await expect(service.pick('ABC234', { guestId: 'guest-Y', pick: 'X' })).rejects.toThrow(
      BadRequestException
    );
    await expect(service.pick('ABC234', { guestId: 'guest-E', pick: 'R' })).rejects.toThrow(
      ForbiddenException
    );
  });

  it('ties score nothing and open the next round', async () => {
    const b = (await (async () => {
      await service.pick('ABC234', { guestId: 'guest-R', pick: 'P' });
      return service.pick('ABC234', { guestId: 'guest-Y', pick: 'P' });
    })()) as any;
    expect(b.round.result).toBe('tie');
    expect(b.round.rWins).toBe(0);
    expect(b.round.yWins).toBe(0);
    expect(match.rPick).toBeNull(); // picks cleared for the next round
  });

  it('resolves the match at the third round win', async () => {
    for (let n = 0; n < 3; n++) {
      match.rPick = null;
      match.yPick = null;
      await service.pick('ABC234', { guestId: 'guest-R', pick: 'R' });
      const b = (await service.pick('ABC234', { guestId: 'guest-Y', pick: 'S' })) as any;
      expect(b.round.result).toBe('R');
    }
    expect(match.status).toBe('finished');
    expect(match.winner).toBe(1);
    // a pick after the match is over is rejected
    await expect(service.pick('ABC234', { guestId: 'guest-R', pick: 'R' })).rejects.toThrow(
      BadRequestException
    );
  });

  it('marks the match abandoned on leave', async () => {
    await service.leave('ABC234', 'guest-R');
    expect(repo.update).toHaveBeenCalledWith('m1', { status: 'abandoned' });
  });
});
