/**
 * DadJokesService.voteForJoke unit tests (plan/05-dad-jokes.md P1 #1 /
 * P2 test-suite gap): per-voter persistence semantics — insert, idempotent
 * double vote, type switch, remove, anonymous legacy path, clamping.
 */

import { NotFoundException } from '@nestjs/common';

import { DadJokesService } from './dad-jokes.service';
import { DadJoke } from './entities/dad-joke.entity';

describe('DadJokesService — voteForJoke (per-voter)', () => {
  const makeJoke = (overrides: Partial<DadJoke> = {}): DadJoke =>
    ({
      id: 'j1',
      likes: 0,
      dislikes: 0,
      ...overrides,
    }) as DadJoke;

  const setup = (existingVote: unknown = null, joke: DadJoke = makeJoke()) => {
    const jokeRepo = {
      findOne: jest.fn(async () => joke),
      save: jest.fn(async (j: DadJoke) => j),
    };
    const jokeVoteRepo = {
      findOne: jest.fn(async () => existingVote),
      insert: jest.fn(async () => undefined),
      save: jest.fn(async (v: unknown) => v),
      remove: jest.fn(async () => undefined),
    };
    const service = new DadJokesService(
      jokeRepo as never,
      {} as never, // categoryRepo
      {} as never, // cacheService
      {} as never, // dataSource
      {} as never, // bulkActionService
      {} as never, // jokeVoteRepo (overridden below)
      { record: jest.fn(async () => undefined) } as never
    );
    // Inject the mocked vote repo (constructor uses @InjectRepository)
    (service as unknown as { jokeVoteRepo: unknown }).jokeVoteRepo = jokeVoteRepo;
    return { service, joke, jokeRepo, jokeVoteRepo };
  };

  it('inserts a vote and increments the matching counter', async () => {
    const { service, joke, jokeVoteRepo } = setup(null);
    await service.voteForJoke('j1', 'like', false, 'guest:g1');
    expect(jokeVoteRepo.insert).toHaveBeenCalledWith({
      jokeId: 'j1',
      voterKey: 'guest:g1',
      voteType: 'like',
    });
    expect(joke.likes).toBe(1);
    expect(joke.dislikes).toBe(0);
  });

  it('a repeat vote of the same type is idempotent — no counter change', async () => {
    const { service, joke } = setup({ voteType: 'like' }, makeJoke({ likes: 3 }));
    await service.voteForJoke('j1', 'like', false, 'user:u1');
    expect(joke.likes).toBe(3);
  });

  it('switching vote type flips both counters and updates the record', async () => {
    const { service, joke, jokeVoteRepo } = setup(
      { voteType: 'like' },
      makeJoke({ likes: 5, dislikes: 2 })
    );
    await service.voteForJoke('j1', 'dislike', false, 'user:u1');
    expect(jokeVoteRepo.save).toHaveBeenCalled();
    expect(joke.likes).toBe(4);
    expect(joke.dislikes).toBe(3);
  });

  it('remove deletes the stored vote and decrements once', async () => {
    const { service, joke, jokeVoteRepo } = setup({ voteType: 'like' }, makeJoke({ likes: 4 }));
    await service.voteForJoke('j1', 'like', true, 'guest:g1');
    expect(jokeVoteRepo.remove).toHaveBeenCalled();
    expect(joke.likes).toBe(3);
  });

  it('remove with no stored vote is a no-op (no negative counters)', async () => {
    const { service, joke, jokeVoteRepo } = setup(null, makeJoke({ likes: 2 }));
    await service.voteForJoke('j1', 'like', true, 'guest:g1');
    expect(jokeVoteRepo.remove).not.toHaveBeenCalled();
    expect(joke.likes).toBe(2);
  });

  it('anonymous votes (no voterKey) keep the legacy counter-only path', async () => {
    const { service, joke, jokeVoteRepo } = setup();
    await service.voteForJoke('j1', 'dislike', false);
    expect(jokeVoteRepo.insert).not.toHaveBeenCalled();
    expect(joke.dislikes).toBe(1);
  });

  it('rejects invalid vote types', async () => {
    const { service } = setup();
    await expect(service.voteForJoke('j1', 'meh' as 'like', false, 'guest:g1')).rejects.toThrow(
      /Invalid vote type/
    );
  });

  it('404s when the joke does not exist', async () => {
    const { service } = setup(null);
    (service as unknown as { jokeRepo: { findOne: jest.Mock } }).jokeRepo.findOne.mockResolvedValue(
      null
    );
    await expect(service.voteForJoke('nope', 'like', false, 'guest:g1')).rejects.toThrow(
      NotFoundException
    );
  });
});
