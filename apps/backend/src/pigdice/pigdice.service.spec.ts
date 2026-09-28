import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { PigDiceService } from './pigdice.service';

/**
 * plan/games/05 — unit specs for live Pig Dice: create/join, the
 * SERVER-rolled die (1 busts the pot and passes, 2–6 grow it), hold → bank →
 * turn pass, the win at the target, turn enforcement, and bad actions.
 * Direct construction, faked repository.
 */
describe('PigDiceService', () => {
  let repo: Record<string, jest.Mock>;
  let service: PigDiceService;
  let match: Record<string, any>;

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      status: 'running',
      turn: 1,
      rScore: 0,
      yScore: 0,
      pot: 0,
      target: 50,
      lastRoll: null,
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
    service = new PigDiceService(repo as any);
  });

  it('creates a match as 🔴 with the requested target', async () => {
    repo.findOne.mockResolvedValue(null); // no code clash
    const { code } = await service.create({ playerName: 'Rosa', guestId: 'guest-R', target: 50 });
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    const saved = repo.create.mock.calls[0][0];
    expect(saved.turn).toBe(1);
    expect(saved.target).toBe(50);
    expect(saved.pot).toBe(0);
  });

  it('binds 🔵 on join and rejects a third player', async () => {
    match.yGuestId = null;
    const view = (await service.join('ABC234', { playerName: 'Yusuf', guestId: 'guest-Y' })) as any;
    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ yGuestId: 'guest-Y' })
    );
    expect(view.yourMark).toBe(2);

    match.yGuestId = 'guest-Y';
    await expect(service.join('ABC234', { playerName: 'Eve', guestId: 'guest-E' })).rejects.toThrow(
      ForbiddenException
    );
  });

  it('rolls: the server die grows the pot and keeps the turn (2–6)', async () => {
    // repeat until a non-1 roll lands (the die is server RNG — that IS the game)
    let grew = false;
    for (let n = 0; n < 30 && !grew; n++) {
      match.pot = 0;
      match.turn = 1;
      const v = (await service.move('ABC234', { guestId: 'guest-R', action: 'roll' })) as any;
      if (v.lastRoll && v.lastRoll > 1) {
        grew = true;
        expect(v.pot).toBe(v.lastRoll);
        expect(v.turn).toBe(1); // the turn stays with the roller
      }
    }
    expect(grew).toBe(true);
  });

  it('rolls a 1: the pot is wiped and the turn passes', async () => {
    let busted = false;
    for (let n = 0; n < 40 && !busted; n++) {
      match.pot = 12;
      match.turn = 1;
      const v = (await service.move('ABC234', { guestId: 'guest-R', action: 'roll' })) as any;
      if (v.lastRoll === 1) {
        busted = true;
        expect(v.pot).toBe(0);
        expect(v.turn).toBe(2);
      }
    }
    expect(busted).toBe(true);
  });

  it('holds: banks the pot, passes the turn, no win below the target', async () => {
    match.pot = 20;
    match.rScore = 10;
    const v = (await service.move('ABC234', { guestId: 'guest-R', action: 'hold' })) as any;
    expect(v.yourScore).toBe(30);
    expect(v.pot).toBe(0);
    expect(v.turn).toBe(2);
    expect(v.status).toBe('running');
    expect(v.winner).toBeNull();
  });

  it('resolves the win when a hold reaches the target', async () => {
    match.pot = 15;
    match.rScore = 40; // 40 + 15 ≥ 50
    const v = (await service.move('ABC234', { guestId: 'guest-R', action: 'hold' })) as any;
    expect(v.status).toBe('finished');
    expect(v.winner).toBe(1);
    expect(v.yourScore).toBe(55);
  });

  it('enforces the turn and rejects nonsense actions', async () => {
    await expect(service.move('ABC234', { guestId: 'guest-Y', action: 'roll' })).rejects.toThrow(
      BadRequestException
    ); // not Y's turn

    match.turn = 1;
    await expect(service.move('ABC234', { guestId: 'guest-R', action: 'shuffle' })).rejects.toThrow(
      BadRequestException
    );

    match.status = 'finished';
    await expect(service.move('ABC234', { guestId: 'guest-R', action: 'roll' })).rejects.toThrow(
      BadRequestException
    );
  });

  it('the view is per-player (your score / their score, never mixed up)', async () => {
    match.rScore = 12;
    match.yScore = 30;
    match.turn = 2;
    const red = (await service.view('ABC234', 'guest-R')) as any;
    const blue = (await service.view('ABC234', 'guest-Y')) as any;
    expect(red.yourScore).toBe(12);
    expect(red.theirScore).toBe(30);
    expect(blue.yourScore).toBe(30);
    expect(blue.theirScore).toBe(12);
  });

  it('marks the match abandoned on leave', async () => {
    await service.leave('ABC234', 'guest-R');
    expect(repo.update).toHaveBeenCalledWith('m1', { status: 'abandoned' });
  });
});
