import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { CheckersService, initialBoard } from './checkers.service';

/**
 * plan/games/06 — unit specs for live Checkers. The properties that matter
 * here are the ones a client could otherwise cheat:
 *  - a jump posted as {from, to} with no `over` still removes the victim
 *  - a quiet slide is rejected while a capture exists (forced captures)
 *  - a multi-jump chain is held open by the SERVER, and cannot be swapped to
 *    another piece, shortened, or abandoned mid-chain
 *  - crowning ends the turn; the quiet-move clock only draws a live game
 */
describe('CheckersService', () => {
  let repo: Record<string, jest.Mock>;
  let service: CheckersService;
  let match: Record<string, any>;

  const sq = (row: number, file: number) => row * 4 + (file >> 1);
  const RED = 1;
  const BLACK = 2;
  const RED_MAN = 1;
  const RED_KING = 2;
  const BLACK_MAN = 3;

  /** A board built from (row, file, piece) triples — anything else is empty. */
  function boardOf(...pieces: Array<[number, number, number]>): number[] {
    const board = new Array(32).fill(0);
    for (const [row, file, piece] of pieces) board[sq(row, file)] = piece;
    return board;
  }

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      status: 'running',
      board: initialBoard(),
      turn: RED,
      chainSquare: null,
      quietPlies: 0,
      lastMove: null,
      winner: null,
      draw: false,
      rGuestId: 'guest-R',
      rName: 'Rosa',
      yGuestId: 'guest-Y',
      yName: 'Yusuf',
      expiresAt: new Date(Date.now() + 60_000),
    };
    repo = {
      // a lookup BY CODE for an existing match finds it; the random code-probe
      // in generateCode() must find nothing
      findOne: jest
        .fn()
        .mockImplementation(async (opts: any) =>
          opts?.where?.code && opts.where.code !== match.code ? null : match
        ),
      save: jest.fn().mockImplementation(async (x) => ({ ...x, id: 'm-new', code: 'ZZZ999' })),
      create: jest.fn().mockImplementation((x) => x),
      // expireStale() updates by criteria object — only the real per-match
      // updates (by id) may touch the fixture
      update: jest.fn().mockImplementation(async (criteria: any, patch: any) => {
        if (typeof criteria === 'string') Object.assign(match, patch);
      }),
    };
    service = new CheckersService(repo as any);
  });

  describe('create + join', () => {
    it('creates a waiting match with red to move and the 12-a-side opening', async () => {
      const { code } = await service.create({ playerName: 'Rosa', guestId: 'guest-R' });
      expect(code).toBe('ZZZ999');
      const created = repo.create.mock.calls[0][0];
      expect(created.status).toBe('waiting');
      expect(created.turn).toBe(RED);
      expect(created.board.filter((p: number) => p !== 0)).toHaveLength(24);
      expect(created.rGuestId).toBe('guest-R');
    });

    it('starts running only once a challenger claims the black seat', async () => {
      await service.join('ABC234', { playerName: 'Yusuf', guestId: 'guest-Y' });
      expect(match.status).toBe('running');
      expect(match.yName).toBe('Yusuf');
    });

    it('refuses a third player', async () => {
      await expect(
        service.join('ABC234', { playerName: 'Mallory', guestId: 'guest-M' })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets the creator re-join their own match', async () => {
      const view = (await service.join('ABC234', {
        playerName: 'Rosa',
        guestId: 'guest-R',
      })) as any;
      expect(view.yourMark).toBe(RED);
    });

    it('404s an unknown code', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.view('NOPE12', 'guest-R')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('turn order', () => {
    it('rejects a step from the side that is not to move', async () => {
      await expect(
        service.step('ABC234', { guestId: 'guest-Y', from: sq(2, 1), to: sq(3, 0) })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a step from a guest who is not in the match', async () => {
      await expect(
        service.step('ABC234', { guestId: 'guest-M', from: sq(5, 0), to: sq(4, 1) })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('passes the turn after a plain slide', async () => {
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(5, 0),
        to: sq(4, 1),
      })) as any;
      expect(view.turn).toBe(BLACK);
      expect(view.board[sq(4, 1)]).toBe(RED_MAN);
      expect(view.board[sq(5, 0)]).toBe(0);
      expect(view.chainSquare).toBeNull();
    });

    it('rejects an out-of-range square', async () => {
      await expect(
        service.step('ABC234', { guestId: 'guest-R', from: 0, to: 99 })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a finished match', async () => {
      match.status = 'finished';
      await expect(
        service.step('ABC234', { guestId: 'guest-R', from: sq(5, 0), to: sq(4, 1) })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('forced captures', () => {
    beforeEach(() => {
      match.board = boardOf([4, 3, RED_MAN], [3, 2, BLACK_MAN], [5, 4, BLACK_MAN]);
    });

    it('accepts the jump and removes the victim', async () => {
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(4, 3),
        to: sq(2, 1),
      })) as any;
      expect(view.board[sq(3, 2)]).toBe(0);
      expect(view.board[sq(2, 1)]).toBe(RED_MAN);
      expect(view.lastMove.over).toBe(sq(3, 2));
    });

    it('rejects the quiet slide while a capture is available', async () => {
      await expect(
        service.step('ABC234', { guestId: 'guest-R', from: sq(4, 3), to: sq(3, 4) })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('DERIVES the capture — a jump posted without `over` still takes the man', async () => {
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(4, 3),
        to: sq(2, 1),
      })) as any;
      expect(view.board[sq(3, 2)]).toBe(0);
      expect(view.lastMove).toEqual({
        from: sq(4, 3),
        to: sq(2, 1),
        over: sq(3, 2),
        crowned: false,
      });
    });
  });

  describe('multi-jump chains', () => {
    beforeEach(() => {
      // red man (6,1) can jump (5,2) then (3,4)
      match.board = boardOf([6, 1, RED_MAN], [5, 2, BLACK_MAN], [3, 4, BLACK_MAN]);
    });

    it('keeps the turn on the same side and exposes the chain square', async () => {
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(6, 1),
        to: sq(4, 3),
      })) as any;
      expect(view.turn).toBe(RED);
      expect(view.chainSquare).toBe(sq(4, 3));
      expect(view.board[sq(5, 2)]).toBe(0);
    });

    it('refuses to swap to a different piece mid-chain', async () => {
      match.board = boardOf([6, 1, RED_MAN], [5, 2, BLACK_MAN], [3, 4, BLACK_MAN], [4, 7, RED_MAN]);
      await service.step('ABC234', { guestId: 'guest-R', from: sq(6, 1), to: sq(4, 3) });
      match.board[sq(2, 5)] = 0;
      match.board[sq(1, 4)] = BLACK_MAN; // the other red king could jump this
      await expect(
        service.step('ABC234', { guestId: 'guest-R', from: sq(4, 7), to: sq(2, 5) })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to cut the chain short with a quiet slide', async () => {
      await service.step('ABC234', { guestId: 'guest-R', from: sq(6, 1), to: sq(4, 3) });
      await expect(
        service.step('ABC234', { guestId: 'guest-R', from: sq(4, 3), to: sq(3, 2) })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('closes the chain and passes the turn when the last jump is played', async () => {
      await service.step('ABC234', { guestId: 'guest-R', from: sq(6, 1), to: sq(4, 3) });
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(4, 3),
        to: sq(2, 5),
      })) as any;
      expect(view.chainSquare).toBeNull();
      expect(view.turn).toBe(BLACK);
      expect(view.board.filter((p: number) => p !== 0)).toHaveLength(1);
    });

    it('refuses the opponent a step while a chain is open', async () => {
      await service.step('ABC234', { guestId: 'guest-R', from: sq(6, 1), to: sq(4, 3) });
      await expect(
        service.step('ABC234', { guestId: 'guest-Y', from: sq(4, 3), to: sq(2, 5) })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('kings and crowning', () => {
    it('crowns a man that reaches the far row and passes the turn', async () => {
      match.board = boardOf([2, 3, RED_MAN], [1, 4, BLACK_MAN], [4, 5, BLACK_MAN]);
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(2, 3),
        to: sq(0, 5),
      })) as any;
      expect(view.board[sq(0, 5)]).toBe(RED_KING);
      expect(view.lastMove.crowned).toBe(true);
      expect(view.chainSquare).toBeNull();
      expect(view.turn).toBe(BLACK);
    });

    it('lets a king capture backwards', async () => {
      match.board = boardOf([2, 3, RED_KING], [3, 4, BLACK_MAN], [7, 0, BLACK_MAN]);
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(2, 3),
        to: sq(4, 5),
      })) as any;
      expect(view.board[sq(3, 4)]).toBe(0);
      expect(view.board[sq(4, 5)]).toBe(RED_KING);
    });
  });

  describe('outcome', () => {
    it('ends the game when the opponent has no pieces left', async () => {
      match.board = boardOf([6, 3, RED_KING], [5, 4, BLACK_MAN]);
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(6, 3),
        to: sq(4, 5),
      })) as any;
      expect(view.status).toBe('finished');
      expect(view.winner).toBe(RED);
      expect(view.draw).toBe(false);
    });

    it('does not decide the game mid-chain', async () => {
      // red takes black's last man but still owes a jump
      match.board = boardOf([6, 1, RED_MAN], [5, 2, BLACK_MAN], [3, 4, BLACK_MAN]);
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(6, 1),
        to: sq(4, 3),
      })) as any;
      expect(view.status).toBe('running');
    });

    it('resets the quiet clock on a capture', async () => {
      match.quietPlies = 40;
      match.board = boardOf([4, 3, RED_MAN], [3, 4, BLACK_MAN], [4, 5, BLACK_MAN]);
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(4, 3),
        to: sq(2, 5),
      })) as any;
      expect(view.quietPlies).toBe(0);
    });

    it('counts a quiet move and draws at the limit', async () => {
      // a KING sliding is a quiet move — a man advancing resets the clock
      match.quietPlies = 79;
      match.board = boardOf([5, 0, RED_KING], [2, 1, BLACK_MAN]);
      const view = (await service.step('ABC234', {
        guestId: 'guest-R',
        from: sq(5, 0),
        to: sq(4, 1),
      })) as any;
      expect(view.quietPlies).toBe(80);
      expect(view.status).toBe('finished');
      expect(view.draw).toBe(true);
      expect(view.winner).toBeNull();
    });
  });

  describe('the view', () => {
    it('redacts nothing it should not, and names both players', async () => {
      const view = (await service.view('ABC234', 'guest-Y')) as any;
      expect(view.yourMark).toBe(BLACK);
      expect(view.rName).toBe('Rosa');
      expect(view.bName).toBe('Yusuf');
      expect(view.board).toHaveLength(32);
      expect(view.chainSquare).toBeNull();
    });

    it('shows no opponent name before a challenger arrives', () => {
      match.yGuestId = null;
      match.yName = null;
      const view = service['present'](match as any, 'guest-R');
      expect(view.bName).toBeNull();
    });
  });
});
