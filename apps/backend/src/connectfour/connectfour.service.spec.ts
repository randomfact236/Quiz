import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { ConnectFourService } from './connectfour.service';

/**
 * plan/games/01 — unit specs for the live Connect Four matches: create/join
 * binding, server-side gravity, turn + full-column validation, four-axis win
 * resolution and the draw. Direct construction, faked repository.
 */
describe('ConnectFourService', () => {
  let repo: Record<string, jest.Mock>;
  let service: ConnectFourService;
  let match: Record<string, any>;

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      board: Array(42).fill(null),
      turn: 'R',
      status: 'running',
      rGuestId: 'guest-R',
      rName: 'Rosa',
      yGuestId: 'guest-Y',
      yName: 'Yusuf',
      winner: null,
      winningLine: null,
      draw: false,
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
    service = new ConnectFourService(repo as any);
  });

  it('creates the match with 🔴 as the creator and an empty 42-cell board', async () => {
    repo.findOne.mockResolvedValue(null); // no code clash
    const { code } = await service.create({ playerName: 'Rosa', guestId: 'guest-R' });

    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    const saved = repo.create.mock.calls[0][0];
    expect(saved.turn).toBe('R');
    expect(saved.board).toHaveLength(42);
    expect(saved.board.every((cell: string | null) => cell === null)).toBe(true);
  });

  it('binds 🟡 on first join and starts the match', async () => {
    match.status = 'waiting';
    match.yGuestId = null;
    const view = (await service.join('ABC234', { playerName: 'Yusuf', guestId: 'guest-Y' })) as any;

    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ yGuestId: 'guest-Y', status: 'running' })
    );
    expect(view.yourMark).toBe('Y');
  });

  it('rejects a third player', async () => {
    await expect(service.join('ABC234', { playerName: 'Eve', guestId: 'guest-E' })).rejects.toThrow(
      ForbiddenException
    );
  });

  it('applies gravity server-side: the disc lands in the lowest empty row', async () => {
    // pre-fill the bottom of column 3 (Red already played there)
    match.board[5 * 7 + 3] = 'R';
    match.turn = 'Y';
    await service.move('ABC234', { guestId: 'guest-Y', column: 3 });

    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ turn: 'R', board: expect.arrayContaining(['Y']) })
    );
    // the Y disc sits at row 4 of column 3 (above Rosa's disc)
    expect(match.board[4 * 7 + 3]).toBe('Y');
  });

  it('rejects wrong-turn, full-column and out-of-range moves', async () => {
    await expect(service.move('ABC234', { guestId: 'guest-Y', column: 0 })).rejects.toThrow(
      BadRequestException
    ); // not Y's turn

    match.board[5 * 7 + 0] = 'Y'; // column 0 has one cell left
    match.board[4 * 7 + 0] = 'Y';
    match.board[3 * 7 + 0] = 'Y';
    match.board[2 * 7 + 0] = 'Y';
    match.board[1 * 7 + 0] = 'Y';
    match.board[0 * 7 + 0] = 'Y';
    match.turn = 'R';
    await expect(service.move('ABC234', { guestId: 'guest-R', column: 0 })).rejects.toThrow(
      BadRequestException
    ); // full

    await expect(service.move('ABC234', { guestId: 'guest-R', column: 7 })).rejects.toThrow(
      BadRequestException
    ); // out of range
  });

  it('resolves a horizontal four and stores the winning line', async () => {
    // bottom row: R R R _ Y Y Y — red drops column 3
    match.board[5 * 7 + 0] = 'R';
    match.board[5 * 7 + 1] = 'R';
    match.board[5 * 7 + 2] = 'R';
    match.board[5 * 7 + 4] = 'Y';
    match.board[5 * 7 + 5] = 'Y';
    match.board[5 * 7 + 6] = 'Y';

    const view = (await service.move('ABC234', { guestId: 'guest-R', column: 3 })) as any;

    expect(view.status).toBe('finished');
    expect(view.winner).toBe('R');
    expect([...view.winningLine].sort((a, b) => a - b)).toEqual([35, 36, 37, 38]);
    expect(view.draw).toBe(false);
  });

  it('resolves a diagonal four', async () => {
    // ↗ diagonal: R already at (5,0), (4,1), (3,2); column 3 holds three Y
    // fillers so red's drop lands at (2,3) and completes the line
    match.board[5 * 7 + 0] = 'R';
    match.board[4 * 7 + 1] = 'R';
    match.board[3 * 7 + 2] = 'R';
    match.board[5 * 7 + 3] = 'Y';
    match.board[4 * 7 + 3] = 'Y';
    match.board[3 * 7 + 3] = 'Y';

    const view = (await service.move('ABC234', { guestId: 'guest-R', column: 3 })) as any;

    expect(view.status).toBe('finished');
    expect(view.winner).toBe('R');
    expect(view.board[2 * 7 + 3]).toBe('R');
  });

  it('resolves a full-board draw', async () => {
    // fill every cell EXCEPT (5,6); the parity fill has no four, and the
    // break-cells make sure no axis through the last drop completes either
    for (let i = 0; i < 41; i++) match.board[i] = i % 2 === 0 ? 'R' : 'Y';
    match.board[4 * 7 + 6] = 'Y'; // breaks the vertical through (5,6)
    match.turn = 'R';

    const view = (await service.move('ABC234', { guestId: 'guest-R', column: 6 })) as any;
    expect(view.status).toBe('finished');
    expect(view.draw).toBe(true);
    expect(view.winner).toBeNull();
  });

  it('marks the match abandoned on leave', async () => {
    await service.leave('ABC234', 'guest-R');
    expect(repo.update).toHaveBeenCalledWith('m1', { status: 'abandoned' });
  });
});
