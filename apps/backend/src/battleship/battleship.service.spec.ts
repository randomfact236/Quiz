import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { BattleshipService } from './battleship.service';

/**
 * plan/games/04 — unit specs for live Battleship Lite: create/join binding,
 * server-side fleet validation (never trust the client), shot resolution with
 * sunk notices, strict turn alternation, the all-sink win, and — the security
 * centrepiece — that the ENEMY FLEET never appears in a player's view.
 */
describe('BattleshipService', () => {
  let repo: Record<string, jest.Mock>;
  let service: BattleshipService;
  let match: Record<string, any>;

  const legalFleet = () => [{ cells: [0, 1, 2, 3] }, { cells: [8, 9, 10] }, { cells: [49, 50] }];

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      status: 'placing',
      turn: 1,
      rFleet: null,
      bFleet: null,
      rShots: Array(64).fill(0),
      bShots: Array(64).fill(0),
      rIncoming: Array(64).fill(0),
      bIncoming: Array(64).fill(0),
      winner: null,
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
    service = new BattleshipService(repo as any);
  });

  it('creates the match as 🔴 in the placing phase', async () => {
    repo.findOne.mockResolvedValue(null); // no code clash
    const { code } = await service.create({ playerName: 'Rosa', guestId: 'guest-R' });

    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    const saved = repo.create.mock.calls[0][0];
    expect(saved.status).toBe('placing');
    expect(saved.turn).toBe(1);
    expect(saved.rShots).toHaveLength(64);
  });

  it('binds 🔵 on join and rejects a third player', async () => {
    match.bGuestId = null;
    const view = (await service.join('ABC234', { playerName: 'Bo', guestId: 'guest-B' })) as any;
    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ bGuestId: 'guest-B' })
    );
    expect(view.yourMark).toBe(2);

    match.bGuestId = 'guest-B';
    await expect(service.join('ABC234', { playerName: 'Eve', guestId: 'guest-E' })).rejects.toThrow(
      ForbiddenException
    );
  });

  it('validates fleets server-side (wrong count, overlap, diagonal, off-board)', async () => {
    const cases: unknown[] = [
      [{ cells: [0, 1, 2] }], // too few ships
      [
        { cells: [0, 1, 2, 3] },
        { cells: [3, 10, 11] }, // overlaps ship 1
        { cells: [49, 50] },
      ],
      [
        { cells: [0, 9, 18, 27] }, // diagonal
        { cells: [8, 9, 10] },
        { cells: [49, 50] },
      ],
      [
        { cells: [48, 56, 64, 72] }, // vertical length-4 off the bottom edge
        { cells: [8, 9, 10] },
        { cells: [1, 9] },
      ],
    ];
    for (const fleet of cases) {
      await expect(
        service.placeFleet('ABC234', { guestId: 'guest-R', fleet: fleet as any })
      ).rejects.toThrow(BadRequestException);
    }
  });

  it('starts the battle (🔴 opens) once both fleets are in', async () => {
    match.bFleet = legalFleet();
    const view = (await service.placeFleet('ABC234', {
      guestId: 'guest-R',
      fleet: legalFleet() as any,
    })) as any;
    expect(match.status).toBe('running');
    expect(match.turn).toBe(1);
    expect(view.status).toBe('running');
  });

  it('resolves shots: miss, hit, sunk notice, strict alternation', async () => {
    match.status = 'running';
    match.rFleet = legalFleet(); // [0,1,2,3] [8,9,10] [49,50]
    match.bFleet = [{ cells: [56, 57, 58] }, { cells: [8, 9, 10] }, { cells: [20, 21] }];
    match.turn = 1;

    // 🔴 fires at open water
    let res = (await service.fire('ABC234', { guestId: 'guest-R', cell: 40 })) as any;
    expect(res.lastShot).toEqual({ cell: 40, result: 'miss', sunk: null });
    expect(match.turn).toBe(2);
    await expect(service.fire('ABC234', { guestId: 'guest-R', cell: 41 })).rejects.toThrow(
      BadRequestException
    ); // not R's turn — strict alternation

    // 🔵 opens the hunt on R's length-4 ship, then R passes with a miss
    res = (await service.fire('ABC234', { guestId: 'guest-B', cell: 0 })) as any;
    expect(res.lastShot.result).toBe('hit');
    expect(res.lastShot.sunk).toBeNull();
    await service.fire('ABC234', { guestId: 'guest-R', cell: 41 }); // miss → pass
    // the last cell of the sunk ship comes with its length
    res = (await service.fire('ABC234', { guestId: 'guest-B', cell: 1 })) as any;
    expect(res.lastShot).toEqual({ cell: 1, result: 'hit', sunk: null });
    await service.fire('ABC234', { guestId: 'guest-R', cell: 42 });
    res = (await service.fire('ABC234', { guestId: 'guest-B', cell: 2 })) as any;
    expect(res.lastShot.result).toBe('hit');
    expect(res.lastShot.sunk).toBeNull(); // three of four cells is not sunk
    await service.fire('ABC234', { guestId: 'guest-R', cell: 43 });
    res = (await service.fire('ABC234', { guestId: 'guest-B', cell: 3 })) as any;
    expect(res.lastShot.sunk).toBe(4); // the last cell finally sank it
    expect(res.status).toBe('running'); // R still has two ships
    // re-firing a cell already shot is rejected
    await expect(service.fire('ABC234', { guestId: 'guest-B', cell: 3 })).rejects.toThrow(
      BadRequestException
    );
  });

  it('finishes when the last enemy ship sinks', async () => {
    match.status = 'running';
    match.rFleet = legalFleet();
    match.bFleet = [{ cells: [40, 41] }];
    match.turn = 1;
    const res = (await service.fire('ABC234', { guestId: 'guest-R', cell: 40 })) as any;
    // one ship left with one cell open: not finished yet
    expect(res.status).toBe('running');
    await service.fire('ABC234', { guestId: 'guest-B', cell: 0 });
    const res2 = (await service.fire('ABC234', { guestId: 'guest-R', cell: 41 })) as any;
    expect(res2.status).toBe('finished');
    expect(res2.winner).toBe(1);
    expect(res2.lastShot.sunk).toBe(2);
  });

  it('NEVER leaks the enemy fleet in a player view (security centrepiece)', async () => {
    match.status = 'running';
    match.rFleet = legalFleet();
    match.bFleet = [{ cells: [56, 57, 58, 59] }, { cells: [8, 9, 10] }, { cells: [0, 1] }];
    const viewR = (await service.view('ABC234', 'guest-R')) as any;
    const viewB = (await service.view('ABC234', 'guest-B')) as any;
    const jsonR = JSON.stringify(viewR);
    const jsonB = JSON.stringify(viewB);
    // each player sees THEIR fleet only
    expect(viewR.yourFleet).toEqual(match.rFleet);
    expect(viewB.yourFleet).toEqual(match.bFleet);
    // and neither sees the other's ship cells as fleet data
    expect(jsonR).not.toContain('"bFleet"');
    expect(jsonB).not.toContain('"rFleet"');
    expect(viewR.yourShots).toHaveLength(64);
    expect(viewR.yourIncoming).toHaveLength(64);
    // the enemy ship cells are not disclosed anywhere in R's view
    expect(jsonR).not.toContain('"cells":[56,57,58,59]');
  });

  it('marks the match abandoned on leave', async () => {
    await service.leave('ABC234', 'guest-R');
    expect(repo.update).toHaveBeenCalledWith('m1', { status: 'abandoned' });
  });
});
