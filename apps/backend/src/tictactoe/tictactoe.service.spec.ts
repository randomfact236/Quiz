import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { TictactoeService } from './tictactoe.service';

/**
 * plan/18 phase 5 — unit specs for the live tic-tac-toe matches:
 * create/join binding, server-authoritative moves (turn + cell), the
 * misère flip, and draw detection. Direct construction, faked repository.
 */
describe('TictactoeService', () => {
  let repo: Record<string, jest.Mock>;
  let service: TictactoeService;
  let match: Record<string, any>;

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      board: Array(9).fill(null),
      turn: 'X',
      status: 'running',
      misere: false,
      xGuestId: 'guest-X',
      xName: 'Xena',
      oGuestId: 'guest-O',
      oName: 'Omar',
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
      // Simulate the row update so the service's re-read sees the change.
      update: jest.fn().mockImplementation(async (_id, patch) => {
        Object.assign(match, patch);
      }),
    };
    service = new TictactoeService(repo as any);
  });

  it('creates the match with X as the creator', async () => {
    repo.findOne.mockResolvedValue(null); // no code clash
    const { code } = await service.create({
      playerName: 'Xena',
      guestId: 'guest-X',
      misere: true,
    });

    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    const saved = repo.create.mock.calls[0][0];
    expect(saved.turn).toBe('X');
    expect(saved.misere).toBe(true);
    expect(saved.board).toHaveLength(9);
  });

  it('binds O on first join and starts the match', async () => {
    match.status = 'waiting';
    match.oGuestId = null;
    const view = (await service.join('ABC234', { playerName: 'Omar', guestId: 'guest-O' })) as any;

    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ oGuestId: 'guest-O', status: 'running' })
    );
    expect(view.yourMark).toBe('O');
  });

  it('rejects a third player', async () => {
    await expect(service.join('ABC234', { playerName: 'Eve', guestId: 'guest-E' })).rejects.toThrow(
      ForbiddenException
    );
  });

  it('validates turns, cells and applies the server-authoritative board', async () => {
    await expect(service.move('ABC234', { guestId: 'guest-O', cell: 4 })).rejects.toThrow(
      BadRequestException
    ); // not O's turn

    const view = (await service.move('ABC234', { guestId: 'guest-X', cell: 4 })) as any;
    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ turn: 'O', board: expect.arrayContaining(['X']) })
    );
    expect(view.board[4]).toBe('X');

    await expect(service.move('ABC234', { guestId: 'guest-O', cell: 4 })).rejects.toThrow(
      BadRequestException
    ); // occupied
  });

  it('finishes the match on three in a row', async () => {
    match.board = ['X', 'X', null, 'O', 'O', null, null, null, null];
    repo.findOne.mockImplementation(({ where }) =>
      Promise.resolve(where.id ? match : { ...match })
    );

    await service.move('ABC234', { guestId: 'guest-X', cell: 2 });

    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({
        status: 'finished',
        winner: 'X',
        winningLine: [0, 1, 2],
      })
    );
  });

  it('flips the winner under misère rules', async () => {
    match.misere = true;
    match.board = ['X', 'X', null, 'O', 'O', null, null, null, null];

    await service.move('ABC234', { guestId: 'guest-X', cell: 2 });

    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ status: 'finished', winner: 'O' })
    );
  });

  it('detects a full-board draw', async () => {
    match.board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', null];

    await service.move('ABC234', { guestId: 'guest-X', cell: 8 });

    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ status: 'finished', draw: true, winner: null })
    );
  });
});
