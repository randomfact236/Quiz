import { BadRequestException, NotFoundException } from '@nestjs/common';

import { GameChallengesService } from './game-challenges.service';

/**
 * plan/18 phase 4 — unit specs for the async game-challenge records:
 * token creation, the public view (guest ids stripped), one-run-per-guest
 * replacement, and expiry. Direct construction, faked repository.
 */
describe('GameChallengesService', () => {
  let repo: Record<string, jest.Mock>;
  let service: GameChallengesService;

  const live = () => ({
    id: 'c1',
    token: 'ABC234FGH567JKL89012',
    gameSlug: 'word-puzzle',
    payload: { seed: 1234, level: 2 },
    challengerName: 'Ann',
    challengerGuestId: 'guest-A',
    challengeRun: { score: 120 },
    runs: [] as Record<string, unknown>[],
    expiresAt: new Date(Date.now() + 60_000),
  });

  beforeEach(() => {
    repo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (x) => ({ ...x, id: 'c-new' })),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockResolvedValue(undefined),
    };
    service = new GameChallengesService(repo as any);
  });

  it('creates a challenge with a token and sanitized payload/run', async () => {
    const { token } = await service.create({
      gameSlug: 'word-puzzle',
      payload: { seed: 42, level: 1, evil: { nested: 'object' }, long: 'x'.repeat(200) },
      run: { score: 12.7, durationMs: -5, moves: 30 },
      playerName: 'Ann',
      guestId: 'guest-A',
    });

    expect(token).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{20}$/);
    const saved = repo.create.mock.calls[0][0];
    expect(saved.payload).toEqual({ seed: 42, level: 1 });
    expect(saved.challengeRun).toEqual({ score: 13, durationMs: 0, moves: 30 });
    expect(saved.challengerGuestId).toBe('guest-A');
  });

  it('retries token generation on a clash', async () => {
    repo.findOne.mockResolvedValueOnce({ id: 'clash' }).mockResolvedValueOnce(null);

    await service.create({
      gameSlug: 'word-puzzle',
      payload: {},
      run: { score: 1 },
      playerName: 'Ann',
      guestId: 'guest-A',
    });

    expect(repo.findOne).toHaveBeenCalledTimes(2);
  });

  it('shows the challenge view without any guest ids', async () => {
    const challenge = live();
    challenge.runs = [{ guestId: 'guest-B', score: 5, playerName: 'Bob', at: 't' }];
    repo.findOne.mockResolvedValue(challenge);

    const view = (await service.view(challenge.token)) as {
      runs: Record<string, unknown>[];
      challengerName: string;
    };

    expect(view.challengerName).toBe('Ann');
    expect(view.runs).toHaveLength(1);
    expect(JSON.stringify(view)).not.toContain('guest-B');
  });

  it('replaces an acceptor’s run when the same guest replays', async () => {
    const challenge = live();
    challenge.runs = [{ guestId: 'guest-B', score: 5, playerName: 'Bob', at: 't' }];
    repo.findOne.mockResolvedValue(challenge);

    await service.submitRun(challenge.token, {
      playerName: 'Bob',
      guestId: 'guest-B',
      run: { score: 9 },
    });

    const saved = repo.save.mock.calls[0][0] as { runs: Record<string, unknown>[] };
    expect(saved.runs).toHaveLength(1);
    expect(saved.runs[0]['score']).toBe(9);
    expect(JSON.stringify(saved.runs)).toContain('guest-B'); // own record keeps routing
  });

  it('rejects unknown and expired tokens', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.view('NOPE')).rejects.toThrow(NotFoundException);

    repo.findOne.mockResolvedValue({ ...live(), expiresAt: new Date(Date.now() - 1000) });
    await expect(service.view('ABC234FGH567JKL89012')).rejects.toThrow(BadRequestException);
  });
});
