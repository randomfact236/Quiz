/**
 * GuestUsersService unit tests — the login merge: guest likes/comments are
 * stamped with the account id, with dedupe when the account already liked
 * the same question (a stamped duplicate would double-count public totals).
 */

import {
  QuestionLike,
  QuestionLikeContentType,
} from '../question-likes/entities/question-like.entity';

import { GuestUsersService } from './guest-users.service';

describe('GuestUsersService — mergeGuestIntoUser', () => {
  const USER = 'user-uuid-1';
  const GUEST = 'guest_abc';

  const makeLike = (overrides: Partial<QuestionLike> = {}): QuestionLike =>
    ({
      id: 'like-1',
      contentType: QuestionLikeContentType.QUIZ,
      questionId: 'q-1',
      guestId: GUEST,
      userId: null,
      ...overrides,
    }) as QuestionLike;

  const setup = (guestLikeRows: QuestionLike[], accountLikeRows: QuestionLike[]) => {
    const likeRepo = {
      // Mirror the service's two queries: the account lookup filters on a
      // plain-string userId; the guest lookup passes IsNull() (a truthy
      // FindOperator) — only unclaimed guest rows come back.
      find: jest.fn(async (args: { where: Record<string, unknown> }) => {
        if (args.where['userId'] === USER) return accountLikeRows;
        if (args.where['guestId'] === GUEST && args.where['userId']) {
          return guestLikeRows.filter((row) => row.userId === null);
        }
        return [];
      }),
      save: jest.fn(async (row: QuestionLike) => row),
      remove: jest.fn(async (row: QuestionLike) => row),
    };
    const commentRepo = {
      update: jest.fn(async () => ({ affected: 2 })),
    };
    const service = new GuestUsersService({} as never, likeRepo as never, commentRepo as never);
    return { service, likeRepo, commentRepo };
  };

  it('stamps guest-only likes and comments with the account id', async () => {
    const guestLike = makeLike({ questionId: 'q-1' });
    const { service, likeRepo, commentRepo } = setup([guestLike], []);

    const result = await service.mergeGuestIntoUser(GUEST, USER);

    expect(result).toEqual({ likesMerged: 1, likesDeduped: 0, commentsMerged: 2 });
    expect(likeRepo.save).toHaveBeenCalledWith(expect.objectContaining({ userId: USER }));
    expect(likeRepo.remove).not.toHaveBeenCalled();
    expect(commentRepo.update).toHaveBeenCalledWith(
      { guestId: GUEST, userId: expect.anything() },
      { userId: USER }
    );
  });

  it('deletes the guest duplicate when the account already liked that question', async () => {
    const guestLike = makeLike({ questionId: 'q-1' });
    const accountLike = makeLike({ id: 'like-2', guestId: 'guest_other', userId: USER });
    const { service, likeRepo } = setup([guestLike], [accountLike]);

    const result = await service.mergeGuestIntoUser(GUEST, USER);

    expect(result).toEqual({ likesMerged: 0, likesDeduped: 1, commentsMerged: 2 });
    expect(likeRepo.remove).toHaveBeenCalledWith(guestLike);
    expect(likeRepo.save).not.toHaveBeenCalled();
  });

  it('keeps merging further guest likes after a dedupe (no double-claim)', async () => {
    const dup = makeLike({ id: 'like-1', questionId: 'q-1' });
    const fresh = makeLike({ id: 'like-2', questionId: 'q-2' });
    const accountLike = makeLike({ id: 'like-9', guestId: 'guest_other', userId: USER });
    const { service, likeRepo } = setup([dup, fresh], [accountLike]);

    const result = await service.mergeGuestIntoUser(GUEST, USER);

    expect(result).toEqual({ likesMerged: 1, likesDeduped: 1, commentsMerged: 2 });
    expect(likeRepo.remove).toHaveBeenCalledWith(dup);
    expect(likeRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'like-2', userId: USER })
    );
  });

  it('is a no-op when the guest has no unmerged rows', async () => {
    const { service, likeRepo, commentRepo } = setup([], []);

    const result = await service.mergeGuestIntoUser(GUEST, USER);

    expect(result).toEqual({ likesMerged: 0, likesDeduped: 0, commentsMerged: 2 });
    expect(likeRepo.save).not.toHaveBeenCalled();
    expect(likeRepo.remove).not.toHaveBeenCalled();
  });
});
