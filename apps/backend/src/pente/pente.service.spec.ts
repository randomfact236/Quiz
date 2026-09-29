import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { PenteService, initialCells, capturesAt, hasLine } from './pente.service';

/**
 * plan/games/23 — unit specs for live Pente. The two properties that matter
 * most: the SERVER resolves the capture (a client cannot claim a pair it did
 * not flank), and the SERVER decides both win conditions (a client cannot
 * declare itself the winner).
 */
describe('PenteService', () => {
  let repo: Record<string, jest.Mock>;
  let service: PenteService;
  let match: Record<string, any>;

  const BLACK = 1;
  const WHITE = 2;
  const EMPTY = 0;
  const sq = (r: number, f: number) => r * 15 + f;
  const blank = () => new Array(15 * 15).fill(EMPTY);

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      status: 'running',
      size: 15,
      target: 5,
      cells: initialCells(15),
      turn: WHITE, // black opened with the centre stone
      captures: [0, 0],
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
    service = new PenteService(repo as any);
  });

  describe('the rules mirror', () => {
    it('opens 15x15 with just the centre stone', () => {
      const cells = initialCells(15);
      expect(cells).toHaveLength(225);
      expect(cells.filter((c: number) => c !== EMPTY)).toHaveLength(1);
      expect(cells[sq(7, 7)]).toBe(BLACK);
    });

    it('captures a flanked pair', () => {
      // white plays at (7,5) with two black at (7,6),(7,7) and its OWN stone
      // closing the far side at (7,8) — the bracket needs a white stone
      const cells = blank();
      cells[sq(7, 6)] = BLACK;
      cells[sq(7, 7)] = BLACK;
      cells[sq(7, 8)] = WHITE;
      expect(capturesAt(cells, sq(7, 5), WHITE, 15)).toEqual([sq(7, 6), sq(7, 7)]);
    });

    it('does not capture a single stone', () => {
      const cells = blank();
      cells[sq(7, 6)] = BLACK;
      expect(capturesAt(cells, sq(7, 5), WHITE, 15)).toEqual([]);
    });

    it('needs exactly two — three is not a capture', () => {
      const cells = blank();
      for (let i = 0; i < 3; i++) cells[sq(7, 5 + i)] = BLACK;
      expect(capturesAt(cells, sq(7, 4), WHITE, 15)).toEqual([]);
    });

    it('detects five in a row', () => {
      const cells = blank();
      for (let i = 0; i < 5; i++) cells[sq(7, 3 + i)] = BLACK;
      expect(hasLine(cells, BLACK, 15)).toBe(true);
      expect(hasLine(cells, WHITE, 15)).toBe(false);
    });
  });

  describe('create + join', () => {
    it('creates a waiting match with white to move', async () => {
      const { code } = await service.create({
        playerName: 'Rosa',
        guestId: 'guest-R',
        size: 15,
        target: 3,
      });
      expect(code).toBe('ZZZ999');
      const created = repo.create.mock.calls[0][0];
      expect(created.status).toBe('waiting');
      expect(created.size).toBe(15);
      expect(created.target).toBe(3);
      expect(created.turn).toBe(WHITE);
      expect(created.captures).toEqual([0, 0]);
    });

    it('falls back to 19x19 and 5 pairs for unknown values', async () => {
      await service.create({
        playerName: 'Rosa',
        guestId: 'guest-R',
        size: 7 as any,
        target: 9 as any,
      });
      const created = repo.create.mock.calls[0][0];
      expect(created.size).toBe(19);
      expect(created.target).toBe(5);
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
      await expect(service.move('ABC234', { guestId: 'guest-R', idx: 0 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('rejects a move from a guest who is not in the match', async () => {
      await expect(
        service.move('ABC234', { guestId: 'guest-M', idx: 0 })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an out-of-range or occupied square', async () => {
      await expect(
        service.move('ABC234', { guestId: 'guest-Y', idx: 9999 })
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.move('ABC234', { guestId: 'guest-Y', idx: sq(7, 7) })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('the server owns the capture and the win', () => {
    /** a black pair flanked by a white stone on its right */
    function capturable() {
      const cells = blank();
      cells[sq(7, 6)] = BLACK;
      cells[sq(7, 7)] = BLACK;
      cells[sq(7, 8)] = WHITE;
      match.cells = cells;
      return cells;
    }

    it('resolves the capture and credits the pair', async () => {
      capturable();
      const view = (await service.move('ABC234', { guestId: 'guest-Y', idx: sq(7, 5) })) as any;
      expect(view.lastMove.captured).toEqual([sq(7, 6), sq(7, 7)]);
      expect(view.cells[sq(7, 6)]).toBe(EMPTY);
      expect(view.cells[sq(7, 7)]).toBe(EMPTY);
      expect(view.cells[sq(7, 5)]).toBe(WHITE);
      expect(view.captures).toEqual([0, 1]);
    });

    it('ignores any capture list the client tries to send', async () => {
      capturable();
      await service.move('ABC234', {
        guestId: 'guest-Y',
        idx: sq(7, 5),
        captured: [999],
      } as any);
      // the victim is still the real one — the client had no say
      expect(match.lastMove).toEqual({ idx: sq(7, 5), captured: [sq(7, 6), sq(7, 7)] });
    });

    it('finishes on five in a row', async () => {
      const cells = blank();
      for (let i = 0; i < 4; i++) cells[sq(7, 3 + i)] = WHITE;
      match.cells = cells;
      const view = (await service.move('ABC234', { guestId: 'guest-Y', idx: sq(7, 7) })) as any;
      expect(view.status).toBe('finished');
      expect(view.winner).toBe(WHITE);
    });

    it('finishes on the capture target', async () => {
      // white is one pair short and THIS move takes the last one
      capturable();
      match.target = 3;
      match.captures = [0, 2];
      const view = (await service.move('ABC234', {
        guestId: 'guest-Y',
        idx: sq(7, 5),
      })) as any;
      expect(view.captures).toEqual([0, 3]);
      expect(view.status).toBe('finished');
      expect(view.winner).toBe(WHITE);
    });

    it('rejects moves once the game is over', async () => {
      match.status = 'finished';
      await expect(
        service.move('ABC234', { guestId: 'guest-Y', idx: 0 })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('the view', () => {
    it('redacts nothing it should not, and names both players', async () => {
      const view = (await service.view('ABC234', 'guest-Y')) as any;
      expect(view.yourMark).toBe(WHITE);
      expect(view.rName).toBe('Rosa');
      expect(view.lName).toBe('Yusuf');
      expect(view.cells).toHaveLength(225);
      expect(view.target).toBe(5);
    });

    it('reports your tally before theirs', () => {
      match.captures = [2, 1];
      const white = service['present'](match as any, 'guest-Y') as any;
      expect(white.yourCaptures).toBe(1);
      expect(white.theirCaptures).toBe(2);
    });

    it('shows no opponent name before a challenger arrives', () => {
      match.yGuestId = null;
      match.yName = null;
      const view = service['present'](match as any, 'guest-R') as any;
      expect(view.lName).toBeNull();
    });
  });
});
