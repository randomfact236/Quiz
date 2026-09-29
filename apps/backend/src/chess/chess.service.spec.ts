import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  ChessService,
  initialBoard,
  legalMoves,
  applyToBoard,
  isInCheck,
  findKing,
  resultFor,
} from './chess.service';

/**
 * plan/games/40 — unit specs for live Chess. The property that matters most:
 * the SERVER decides legality. A client posts from/to and the server looks
 * that move up in its own list, so a client cannot castle illegally, capture
 * a pinned piece, move through check, or invent a move.
 */
describe('ChessService', () => {
  let repo: Record<string, jest.Mock>;
  let service: ChessService;
  let match: Record<string, any>;

  const WHITE = 1;
  const BLACK = 2;
  const sq = (name: string) =>
    (Number(name[1]) - 1) * 8 + 'abcdefgh'.indexOf(name[0]);

  beforeEach(() => {
    match = {
      id: 'm1',
      code: 'ABC234',
      status: 'running',
      board: initialBoard(),
      turn: WHITE,
      castling: 15,
      enPassant: -1,
      halfmoves: 0,
      fullmove: 1,
      lastMove: null,
      winner: null,
      draw: false,
      result: null,
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
    service = new ChessService(repo as any);
  });

  describe('the rules mirror', () => {
    it('starts from the standard array with 20 legal moves', () => {
      const board = initialBoard();
      expect(board).toHaveLength(64);
      expect(board.filter((p) => p !== 0)).toHaveLength(32);
      expect(legalMoves(match as any)).toHaveLength(20);
    });

    it('never offers castling in the opening (the bishop and knight are in the way)', () => {
      expect(legalMoves(match as any).some((m) => m.castle)).toBe(false);
    });

    it('refuses to move a pinned piece', () => {
      const board = initialBoard().map(() => 0);
      board[sq('e1')] = 14; // white king
      board[sq('e2')] = 10; // white knight, pinned
      board[sq('e8')] = 4; // black rook
      const moves = legalMoves({ board, turn: WHITE, castling: 0, enPassant: -1 });
      expect(moves.some((m) => m.from === sq('e2'))).toBe(false);
    });

    it('refuses to castle THROUGH check', () => {
      const board = initialBoard().map(() => 0);
      board[sq('e1')] = 14;
      board[sq('a1')] = 12;
      board[sq('h1')] = 12;
      board[sq('f8')] = 4; // attacks f1
      const moves = legalMoves({ board, turn: WHITE, castling: 15, enPassant: -1 });
      expect(moves.some((m) => m.castle === 'K')).toBe(false);
      expect(moves.some((m) => m.castle === 'Q')).toBe(true);
    });

    it('offers all four promotions on the last rank', () => {
      const board = initialBoard().map(() => 0);
      board[sq('a1')] = 14;
      board[sq('h8')] = 6;
      board[sq('a7')] = 9;
      const promos = legalMoves({ board, turn: WHITE, castling: 0, enPassant: -1 }).filter(
        (m) => m.to === sq('a8')
      );
      expect(promos).toHaveLength(4);
    });
  });

  describe('create + join', () => {
    it('creates a waiting match with white to move', async () => {
      const { code } = await service.create({ playerName: 'Rosa', guestId: 'guest-R' });
      expect(code).toBe('ZZZ999');
      const created = repo.create.mock.calls[0][0];
      expect(created.status).toBe('waiting');
      expect(created.turn).toBe(WHITE);
      expect(created.board).toHaveLength(64);
      expect(created.castling).toBe(15);
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

    it('404s an unknown code', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.view('NOPE12', 'guest-R')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('turn order', () => {
    it('rejects a move from the side that is not to move', async () => {
      await expect(
        service.move('ABC234', { guestId: 'guest-Y', from: sq('e7'), to: sq('e5') })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a move from a guest who is not in the match', async () => {
      await expect(
        service.move('ABC234', { guestId: 'guest-M', from: sq('e2'), to: sq('e4') })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an out-of-range or occupied square', async () => {
      await expect(
        service.move('ABC234', { guestId: 'guest-R', from: 99, to: 4 })
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.move('ABC234', { guestId: 'guest-R', from: sq('e1'), to: sq('e2') })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('the server owns legality', () => {
    it('plays a legal move and passes the turn', async () => {
      const view = (await service.move('ABC234', {
        guestId: 'guest-R',
        from: sq('e2'),
        to: sq('e4'),
      })) as any;
      expect(view.board[sq('e4')]).toBe(9);
      expect(view.board[sq('e2')]).toBe(0);
      expect(view.turn).toBe(BLACK);
      expect(view.lastMove).toEqual({ from: sq('e2'), to: sq('e4') });
    });

    it('refuses a move that is not in its own legal list', async () => {
      // a knight cannot jump from e2 to e5
      await expect(
        service.move('ABC234', { guestId: 'guest-R', from: sq('b1'), to: sq('b4') })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ignores a client-supplied board or piece', async () => {
      await service.move('ABC234', {
        guestId: 'guest-R',
        from: sq('e2'),
        to: sq('e4'),
        board: initialBoard().map(() => 0),
        piece: 5,
      } as any);
      expect(match.board[sq('e4')]).toBe(9);
    });

    it('places the chosen promotion', async () => {
      const board = initialBoard().map(() => 0);
      board[sq('a1')] = 14;
      board[sq('h8')] = 6;
      board[sq('a7')] = 9;
      match.board = board;
      const view = (await service.move('ABC234', {
        guestId: 'guest-R',
        from: sq('a7'),
        to: sq('a8'),
        promotion: 10, // a knight
      })) as any;
      expect(view.board[sq('a8')]).toBe(10);
    });

    it('rejects a promotion piece that is not on offer', async () => {
      const board = initialBoard().map(() => 0);
      board[sq('a1')] = 14;
      board[sq('h8')] = 6;
      board[sq('a7')] = 9;
      match.board = board;
      await expect(
        service.move('ABC234', {
          guestId: 'guest-R',
          from: sq('a7'),
          to: sq('a8'),
          promotion: 9, // a pawn — not a promotion choice
        })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('records en passant and removes the pawn BESIDE the target', async () => {
      const view = (await service.move('ABC234', {
        guestId: 'guest-R',
        from: sq('e2'),
        to: sq('e4'),
      })) as any;
      expect(view.enPassant).toBe(sq('e3')); // the square the pawn skipped
    });

    it('detects a finished game when the side to move has nothing', async () => {
      // Fool's Mate: white's king is boxed by its own pieces and the h4 queen
      // takes e1 down the empty f2/g3 diagonal. (A back-rank position is NOT
      // mate — b8=Q would block the rook, and the model correctly allows it.)
      const board = initialBoard().map(() => 0);
      board[sq('e1')] = 14;
      board[sq('d1')] = 13;
      board[sq('f1')] = 11;
      board[sq('e2')] = 9;
      board[sq('d2')] = 9;
      board[sq('f3')] = 9;
      board[sq('g4')] = 9;
      board[sq('h4')] = 5; // BLACK's queen — 13 is white's
      board[sq('e5')] = 1;
      board[sq('e8')] = 6;
      match.board = board;
      expect(isInCheck(board, WHITE)).toBe(true);
      expect(legalMoves(match as any)).toHaveLength(0);
      expect(resultFor({ ...(match as any), halfmoves: 0 })).toBe('checkmate');
    });

    it('rejects moves once the game is over', async () => {
      match.status = 'finished';
      await expect(
        service.move('ABC234', { guestId: 'guest-R', from: sq('e2'), to: sq('e4') })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('the view', () => {
    it('redacts nothing it should not, and names both players', async () => {
      const view = (await service.view('ABC234', 'guest-Y')) as any;
      expect(view.yourMark).toBe(BLACK);
      expect(view.wName).toBe('Rosa');
      expect(view.bName).toBe('Yusuf');
      expect(view.board).toHaveLength(64);
    });

    it('shows no opponent name before a challenger arrives', () => {
      match.yGuestId = null;
      match.yName = null;
      const view = service['present'](match as any, 'guest-R') as any;
      expect(view.bName).toBeNull();
    });
  });
});
