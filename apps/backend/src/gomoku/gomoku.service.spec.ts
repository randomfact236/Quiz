import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { GomokuService } from './gomoku.service';

/**
 * plan/games/02 — unit specs for the live Gomoku matches: create/join
 * binding, server-side turn + cell validation, the five-in-a-row (≥5,
 * freestyle) resolution in every axis, the full-board draw, and leave.
 * Direct construction, faked repository.
 */
describe('GomokuService', () => {
  let repo: Record<string, jest.Mock>;
  let service: GomokuService;
  let match: Record<string, any>;

  const idx = (size: number, row: number, col: number) => row * size + col;

  beforeEach(() => {
    const size = 15;
    match = {
      id: 'm1',
      code: 'ABC234',
      size,
      board: Array<string | null>(size * size).fill(null),
      turn: 'B',
      status: 'running',
      bGuestId: 'guest-B',
      bName: 'Blacky',
      wGuestId: 'guest-W',
      wName: 'Whitey',
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
    service = new GomokuService(repo as any);
  });

  it('creates the match as ⚫ with the requested board size', async () => {
    repo.findOne.mockResolvedValue(null); // no code clash
    const { code } = await service.create({
      playerName: 'Blacky',
      guestId: 'guest-B',
      size: 11,
    });

    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    const saved = repo.create.mock.calls[0][0];
    expect(saved.size).toBe(11);
    expect(saved.turn).toBe('B');
    expect(saved.board).toHaveLength(121);
    expect(saved.board.every((c: string | null) => c === null)).toBe(true);
  });

  it('binds ⚪ on first join and starts the match', async () => {
    match.status = 'waiting';
    match.wGuestId = null;
    const view = (await service.join('ABC234', {
      playerName: 'Whitey',
      guestId: 'guest-W',
    })) as any;

    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ wGuestId: 'guest-W', status: 'running' })
    );
    expect(view.yourMark).toBe('W');
  });

  it('rejects a third player', async () => {
    await expect(service.join('ABC234', { playerName: 'Eve', guestId: 'guest-E' })).rejects.toThrow(
      ForbiddenException
    );
  });

  it('rejects wrong-turn, taken and out-of-range cells', async () => {
    await expect(service.move('ABC234', { guestId: 'guest-W', cell: 5 })).rejects.toThrow(
      BadRequestException
    ); // not W's turn

    match.turn = 'B';
    match.board[idx(15, 7, 7)] = 'W';
    await expect(
      service.move('ABC234', { guestId: 'guest-B', cell: idx(15, 7, 7) })
    ).rejects.toThrow(BadRequestException); // taken

    await expect(service.move('ABC234', { guestId: 'guest-B', cell: 300 })).rejects.toThrow(
      BadRequestException
    ); // out of range
  });

  it('resolves a horizontal five and stores the winning line', async () => {
    const size = 15;
    for (const c of [4, 5, 6, 7]) match.board[idx(size, 7, c)] = 'B';

    const view = (await service.move('ABC234', {
      guestId: 'guest-B',
      cell: idx(size, 7, 3),
    })) as any;

    expect(view.status).toBe('finished');
    expect(view.winner).toBe('B');
    expect(view.winningLine).toEqual(
      expect.arrayContaining([
        idx(size, 7, 3),
        idx(size, 7, 4),
        idx(size, 7, 5),
        idx(size, 7, 6),
        idx(size, 7, 7),
      ])
    );
    expect(view.draw).toBe(false);
  });

  it('resolves a diagonal five (↘)', async () => {
    const size = 15;
    for (const d of [1, 2, 3, 4]) match.board[idx(size, 5 + d, 5 + d)] = 'W';
    match.turn = 'W';

    const view = (await service.move('ABC234', {
      guestId: 'guest-W',
      cell: idx(size, 5, 5),
    })) as any;

    expect(view.status).toBe('finished');
    expect(view.winner).toBe('W');
  });

  it('counts an overline (six) as a win in freestyle', async () => {
    const size = 15;
    for (const c of [5, 6, 7, 8, 9]) match.board[idx(size, 7, c)] = 'B';

    const view = (await service.move('ABC234', {
      guestId: 'guest-B',
      cell: idx(size, 7, 4),
    })) as any;

    expect(view.winner).toBe('B');
    expect(view.winningLine.length).toBe(6);
  });

  it('does NOT call four in a row a win', async () => {
    const size = 15;
    for (const c of [6, 7, 8]) match.board[idx(size, 7, c)] = 'B';

    const view = (await service.move('ABC234', {
      guestId: 'guest-B',
      cell: idx(size, 7, 5),
    })) as any;

    expect(view.status).toBe('running');
    expect(view.winner).toBeNull();
  });

  it('resolves a full-board draw', async () => {
    const size = 11;
    match.size = size;
    match.board = Array<string | null>(size * size).fill(null);
    for (let i = 0; i < size * size; i++) match.board[i] = i % 2 === 0 ? 'B' : 'W';
    // break every axis through the last cell (bottom-right: only negatives)
    const last = size * size - 1;
    const row = size - 1;
    const col = size - 1;
    for (const [dr, dc] of [
      [0, -1],
      [-1, 0],
      [-1, -1],
      [-1, 1],
    ]) {
      const r = row + (dr as number);
      const c = col + (dc as number);
      // the last cell is ⚫: an in-bounds neighbour of the opposite mark cuts
      // every axis run through it (both diagonals included)
      if (r >= 0 && c >= 0) match.board[r * size + c] = 'W';
    }
    match.board[last] = null; // the cell the final move fills
    match.turn = 'B';

    const view = (await service.move('ABC234', { guestId: 'guest-B', cell: last })) as any;

    expect(view.status).toBe('finished');
    expect(view.draw).toBe(true);
    expect(view.winner).toBeNull();
  });

  it('marks the match abandoned on leave', async () => {
    await service.leave('ABC234', 'guest-B');
    expect(repo.update).toHaveBeenCalledWith('m1', { status: 'abandoned' });
  });
});
