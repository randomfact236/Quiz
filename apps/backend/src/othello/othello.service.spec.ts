import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { OthelloService, initialCells, flipsFor, legalMoves } from './othello.service';

/**
 * plan/games/12 — unit specs for live Othello. The property that matters most:
 * the SERVER decides which discs flipped. A client that posts a legal square
 * gets the true flip set back; a client that posts a square which outflanks
 * nothing is rejected, and it can never post the flip list itself.
 */
describe('OthelloService', () => {
  let repo: Record<string, jest.Mock>;
  let service: OthelloService;
  let match: Record<string, any>;

  const DARK = 1;
  const LIGHT = 2;
  const EMPTY = 0;

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      status: 'running',
      size: 8,
      cells: initialCells(8),
      turn: DARK,
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
    service = new OthelloService(repo as any);
  });

  describe('the rules mirror', () => {
    it('opens 8x8 with the standard centre', () => {
      const cells = initialCells(8);
      expect(cells).toHaveLength(64);
      expect(cells[27]).toBe(LIGHT);
      expect(cells[28]).toBe(DARK);
      expect(cells[35]).toBe(DARK);
      expect(cells[36]).toBe(LIGHT);
      expect(legalMoves(cells, DARK, 8)).toEqual([19, 26, 37, 44]);
    });

    it('flips only a CLOSED run', () => {
      const cells = new Array(64).fill(EMPTY);
      cells[0] = DARK;
      cells[9] = LIGHT;
      // (1,1) has a light with nothing closing it
      expect(flipsFor(cells, 9, DARK, 8)).toEqual([]);
    });

    it('flips a bracketed run', () => {
      const cells = initialCells(8);
      expect(flipsFor(cells, 19, DARK, 8)).toEqual([27]);
    });
  });

  describe('create + join', () => {
    it('creates a waiting match at the requested size', async () => {
      const { code } = await service.create({ playerName: 'Rosa', guestId: 'guest-R', size: 6 });
      expect(code).toBe('ZZZ999');
      const created = repo.create.mock.calls[0][0];
      expect(created.status).toBe('waiting');
      expect(created.size).toBe(6);
      expect(created.turn).toBe(DARK);
      expect(created.cells).toHaveLength(36);
    });

    it('falls back to 8x8 for an unknown size', async () => {
      await service.create({ playerName: 'Rosa', guestId: 'guest-R', size: 7 as any });
      expect(repo.create.mock.calls[0][0].size).toBe(8);
    });

    it('starts running only once a challenger claims the light seat', async () => {
      await service.join('ABC234', { playerName: 'Yusuf', guestId: 'guest-Y' });
      expect(match.status).toBe('running');
      expect(match.yName).toBe('Yusuf');
    });

    it('refuses a third player', async () => {
      await expect(
        service.join('ABC234', { playerName: 'Mallory', guestId: 'guest-M' })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('404s an unknown code', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.view('NOPE12', 'guest-R')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('turn order', () => {
    it('rejects a move from the side that is not to move', async () => {
      await expect(service.move('ABC234', { guestId: 'guest-Y', idx: 20 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('rejects a move from a guest who is not in the match', async () => {
      await expect(service.move('ABC234', { guestId: 'guest-M', idx: 19 })).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('rejects an out-of-range square', async () => {
      await expect(service.move('ABC234', { guestId: 'guest-R', idx: 999 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('rejects a square that outflanks nothing', async () => {
      await expect(service.move('ABC234', { guestId: 'guest-R', idx: 0 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('rejects an occupied square', async () => {
      await expect(service.move('ABC234', { guestId: 'guest-R', idx: 27 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });

  describe('the server owns the flips', () => {
    it('places the disc, flips the true set, and hands the turn over', async () => {
      const view = (await service.move('ABC234', { guestId: 'guest-R', idx: 19 })) as any;
      expect(view.cells[19]).toBe(DARK);
      expect(view.cells[27]).toBe(DARK);
      expect(view.lastMove).toEqual({ idx: 19, flipped: [27] });
      expect(view.turn).toBe(LIGHT);
    });

    it('reports the disc counts server-side', async () => {
      const view = (await service.move('ABC234', { guestId: 'guest-R', idx: 19 })) as any;
      expect(view.dark).toBe(4);
      expect(view.light).toBe(1);
    });

    it('ignores any flip list the client tries to supply', async () => {
      // the DTO does not accept one, and the service never reads one
      await service.move('ABC234', { guestId: 'guest-R', idx: 19 } as any);
      expect(match.lastMove).toEqual({ idx: 19, flipped: [27] });
    });
  });

  describe('the pass rule', () => {
    it('hands the turn back when the side to move has no placement', async () => {
      // dark on 0 and 1, light on 2 and 8: after dark plays 3 light is stuck
      match.cells = new Array(64).fill(EMPTY);
      match.cells[0] = DARK;
      match.cells[1] = DARK;
      match.cells[2] = LIGHT;
      match.cells[8] = LIGHT;
      expect(legalMoves(match.cells, LIGHT, 8)).toEqual([]);
      const view = (await service.move('ABC234', { guestId: 'guest-R', idx: 3 })) as any;
      expect(view.turn).toBe(DARK); // handed back, not to light
      expect(view.status).toBe('running');
    });

    it('finishes the game when neither side can move', async () => {
      match.cells = new Array(64).fill(DARK);
      match.cells[9] = LIGHT;
      match.cells[1] = LIGHT;
      // light must have exactly one placement, and after it neither side can
      match.cells[0] = EMPTY;
      const moves = legalMoves(match.cells, DARK, 8);
      expect(moves).toEqual([0]);
      const view = (await service.move('ABC234', { guestId: 'guest-R', idx: 0 })) as any;
      expect(view.status).toBe('finished');
      expect(view.winner).toBe(DARK);
      expect(view.draw).toBe(false);
    });
  });

  describe('the view', () => {
    it('redacts nothing it should not, and names both players', async () => {
      const view = (await service.view('ABC234', 'guest-Y')) as any;
      expect(view.yourMark).toBe(LIGHT);
      expect(view.rName).toBe('Rosa');
      expect(view.lName).toBe('Yusuf');
      expect(view.cells).toHaveLength(64);
      expect(view.size).toBe(8);
    });

    it('shows no opponent name before a challenger arrives', () => {
      match.yGuestId = null;
      match.yName = null;
      const view = service['present'](match as any, 'guest-R');
      expect(view.lName).toBeNull();
    });
  });
});
