import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { GoService, emptyBoard, playOn, areaScore, samePosition } from './go.service';

/**
 * plan/games/39 — unit specs for live Go. The server owns everything that
 * decides a game: captures, the ko ban, the pass counter and the area score.
 * A client supplies a point or a pass and nothing else.
 */
describe('GoService', () => {
  let repo: Record<string, jest.Mock>;
  let service: GoService;
  let match: Record<string, any>;

  const BLACK = 1;
  const WHITE = 2;
  const EMPTY = 0;
  const sq = (r: number, f: number) => r * 9 + f;

  /**
   * The canonical KO shape (the same one the frontend suite uses):
   *   (0,1) (1,0) (1,2) black · (1,1) (2,0) (2,2) (3,1) white
   * so white at (1,1) has exactly one liberty, at (2,1).
   */
  function koBoard() {
    const cells = emptyBoard();
    for (const [r, f] of [[0, 1], [1, 0], [1, 2]] as const) cells[sq(r, f)] = BLACK;
    for (const [r, f] of [[1, 1], [2, 0], [2, 2], [3, 1]] as const) cells[sq(r, f)] = WHITE;
    return cells;
  }

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      status: 'running',
      cells: emptyBoard(),
      turn: BLACK,
      captures: [0, 0],
      passes: 0,
      previous: null,
      lastMove: null,
      komi: 5.5,
      winner: null,
      draw: false,
      score: null,
      rGuestId: 'guest-R',
      rName: 'Rosa',
      yGuestId: 'guest-Y',
      yName: 'Yusuf',
      expiresAt: new Date(Date.now() + 60_000),
    };
    repo = {
      findOne: jest
        .fn()
        .mockImplementation(async (opts: any) =>
          opts?.where?.code && opts.where.code !== match.code ? null : match
        ),
      save: jest.fn().mockImplementation(async (x) => ({ ...x, id: 'm-new', code: 'ZZZ999' })),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockImplementation(async (criteria: any, patch: any) => {
        if (typeof criteria === 'string') Object.assign(match, patch);
      }),
    };
    service = new GoService(repo as any);
  });

  describe('the rules mirror', () => {
    it('opens empty with black to move', () => {
      const cells = emptyBoard();
      expect(cells).toHaveLength(81);
      expect(cells.every((c) => c === EMPTY)).toBe(true);
    });

    it('captures a group at zero liberties', () => {
      const cells = emptyBoard();
      const at = sq(0, 1);
      cells[at] = WHITE;
      cells[sq(0, 0)] = BLACK;
      cells[sq(1, 1)] = BLACK;
      const r = playOn(cells, BLACK, sq(0, 2));
      expect(r).not.toBeNull();
      expect(r?.captured).toEqual([at]);
    });

    it('refuses a suicide that captures nothing', () => {
      const cells = emptyBoard();
      for (const [r, f] of [[0, 1], [1, 0], [1, 2], [2, 1]] as const) cells[sq(r, f)] = WHITE;
      expect(playOn(cells, BLACK, sq(1, 1))).toBeNull();
    });

    it('refuses an occupied point', () => {
      const cells = emptyBoard();
      cells[sq(4, 4)] = BLACK;
      expect(playOn(cells, WHITE, sq(4, 4))).toBeNull();
    });

    it('compares positions exactly', () => {
      const a = emptyBoard();
      const b = emptyBoard();
      expect(samePosition(a, b)).toBe(true);
      b[40] = BLACK;
      expect(samePosition(a, b)).toBe(false);
      expect(samePosition(a, null)).toBe(false);
    });

    it('scores area, with komi to white', () => {
      const cells = emptyBoard();
      for (let i = 0; i < cells.length; i++) cells[i] = BLACK;
      const all = areaScore(cells, 0);
      expect(all.blackArea).toBe(81);
      expect(all.winner).toBe(BLACK);

      const empty = areaScore(emptyBoard(), 5.5);
      expect(empty.winner).toBe(WHITE); // komi alone decides an empty board
      expect(empty.total.white).toBe(5.5);
    });
  });

  describe('create + join', () => {
    it('creates a waiting match with the chosen komi', async () => {
      const { code } = await service.create({ playerName: 'Rosa', guestId: 'guest-R', komi: 0 });
      expect(code).toBe('ZZZ999');
      const created = repo.create.mock.calls[0][0];
      expect(created.status).toBe('waiting');
      expect(created.komi).toBe(0);
      expect(created.turn).toBe(BLACK);
      expect(created.cells).toHaveLength(81);
    });

    it('falls back to komi 5.5 for an unknown value', async () => {
      await service.create({ playerName: 'Rosa', guestId: 'guest-R', komi: 3 as any });
      expect(repo.create.mock.calls[0][0].komi).toBe(5.5);
    });

    it('starts running only once a challenger claims the white seat', async () => {
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
      await expect(service.move('ABC234', { guestId: 'guest-Y', idx: 0 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('rejects a move from a guest who is not in the match', async () => {
      await expect(
        service.move('ABC234', { guestId: 'guest-M', idx: 0 })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an out-of-range point', async () => {
      await expect(service.move('ABC234', { guestId: 'guest-R', idx: 999 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });

  describe('the server owns the game', () => {
    it('resolves the capture and credits the stones', async () => {
      match.cells = koBoard();
      const view = (await service.move('ABC234', { guestId: 'guest-R', idx: sq(2, 1) })) as any;
      expect(view.lastMove.captured).toEqual([sq(1, 1)]);
      expect(view.cells[sq(1, 1)]).toBe(EMPTY);
      expect(view.captures).toEqual([1, 0]);
    });

    it('enforces the ko ban on an immediate recapture', async () => {
      match.cells = koBoard();
      const first = (await service.move('ABC234', { guestId: 'guest-R', idx: sq(2, 1) })) as any;
      // white may not retake at once — that recreates the position before black's move
      await expect(
        service.move('ABC234', { guestId: 'guest-Y', idx: sq(1, 1) })
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(first.status).toBe('running');
    });

    it('ignores a client-supplied board or capture list', async () => {
      match.cells = koBoard();
      await service.move('ABC234', {
        guestId: 'guest-R',
        idx: sq(2, 1),
        cells: emptyBoard(),
        captured: [999],
      } as any);
      // the server's own resolution stands
      expect(match.lastMove).toEqual({ idx: sq(2, 1), captured: [sq(1, 1)] });
    });

    it('keeps playing after a capture, because Go is not Chess', async () => {
      // one white stone with a single liberty at (4,5): black takes it, and
      // white then has no stone and no legal placement
      const cells = emptyBoard();
      cells[sq(4, 4)] = WHITE;
      cells[sq(3, 4)] = BLACK;
      cells[sq(5, 4)] = BLACK;
      cells[sq(4, 3)] = BLACK;
      match.cells = cells;
      const view = (await service.move('ABC234', { guestId: 'guest-R', idx: sq(4, 5) })) as any;
      expect(view.cells[sq(4, 4)]).toBe(EMPTY); // captured
      // …and the game CONTINUES: losing its last stone does not end Go, the
      // opponent can still play on the open board. Only two passes (or a board
      // with no legal stone at all) finish the game.
      expect(view.status).toBe('running');
      expect(view.captures).toEqual([1, 0]);
    });

    it('ends the game on two consecutive passes and computes the score', async () => {
      const one = (await service.move('ABC234', { guestId: 'guest-R', idx: null })) as any;
      expect(one.status).toBe('running');
      expect(one.passes).toBe(1);
      const two = (await service.move('ABC234', { guestId: 'guest-Y', idx: null })) as any;
      expect(two.status).toBe('finished');
      expect(two.score).not.toBeNull();
      expect(two.score.komi).toBe(5.5);
    });

    it('rejects moves once the game is over', async () => {
      match.status = 'finished';
      await expect(service.move('ABC234', { guestId: 'guest-R', idx: 0 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });

  describe('the view', () => {
    it('redacts nothing it should not, and names both players', async () => {
      const view = (await service.view('ABC234', 'guest-Y')) as any;
      expect(view.yourMark).toBe(WHITE);
      expect(view.rName).toBe('Rosa');
      expect(view.lName).toBe('Yusuf');
      expect(view.cells).toHaveLength(81);
      expect(view.komi).toBe(5.5);
    });

    it('offers a live score even before the game is scored', async () => {
      const view = (await service.view('ABC234', 'guest-R')) as any;
      expect(view.score).not.toBeNull();
      expect(view.status).toBe('running');
    });

    it('shows no opponent name before a challenger arrives', () => {
      match.yGuestId = null;
      match.yName = null;
      const view = service['present'](match as any, 'guest-R') as any;
      expect(view.lName).toBeNull();
    });
  });
});
