/**
 * CommentsService unit tests — masking, kind/contentType validation, guest
 * ownership, and chip-to-reveal handling (comments-system plan §2).
 */

import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { BulkActionService } from '../common/services/bulk-action.service';
import { CacheService } from '../common/cache/cache.service';
import { GuestUsersService } from '../guest-users/guest-users.service';
import { DadJoke } from '../dad-jokes/entities/dad-joke.entity';
import { ImageRiddle } from '../image-riddles/entities/image-riddle.entity';

import { CommentsService } from './comments.service';
import { Comment, CommentChip, CommentContentType, CommentKind } from './entities/comment.entity';

describe('CommentsService', () => {
  const makeRiddle = (overrides: Partial<ImageRiddle> = {}): ImageRiddle =>
    ({
      id: 'riddle-1',
      answer: 'Ice Cream',
      alternativeAnswers: ['icecream'],
      ...overrides,
    }) as ImageRiddle;

  const makeComment = (overrides: Partial<Comment> = {}): Comment =>
    ({
      id: 'c1',
      contentType: CommentContentType.IMAGE_RIDDLE,
      contentId: 'riddle-1',
      guestId: 'guest_a',
      kind: CommentKind.GUESS,
      text: 'some guess',
      chip: null,
      isCorrect: false,
      status: 'published' as Comment['status'],
      createdAt: new Date('2026-08-28T10:00:00Z'),
      updatedAt: new Date('2026-08-28T10:00:00Z'),
      ...overrides,
    }) as Comment;

  const setup = (options: { riddle?: ImageRiddle | null; existing?: Comment | null } = {}) => {
    const commentRepo = {
      create: jest.fn((data: Partial<Comment>) => makeComment(data)),
      save: jest.fn(async (c: Comment) => c),
      find: jest.fn(async () => []),
      count: jest.fn(async () => 0),
      findOne: jest.fn(async (args: { where: Record<string, unknown> }) => {
        if (args.where['id'] !== undefined && options.existing) return options.existing;
        return null;
      }),
      remove: jest.fn(async (c: Comment) => c),
      createQueryBuilder: jest.fn(() => ({
        select: () => ({
          addSelect: () => ({
            where: () => ({
              andWhere: () => ({
                andWhere: () => ({
                  andWhere: () => ({ groupBy: () => ({ getRawMany: async () => [] }) }),
                }),
              }),
            }),
          }),
        }),
      })),
    };
    const imageRiddleRepo = {
      findOne: jest.fn(async () => (options.riddle === undefined ? makeRiddle() : options.riddle)),
    };
    const jokeRepo = { findOne: jest.fn(async () => ({ id: 'joke-1' }) as DadJoke) };
    const guestUsersService = { findOrCreate: jest.fn(async (id: string) => ({ guestId: id })) };
    const cacheService = {
      getOrSet: jest.fn((_key: string, fn: () => unknown) => fn()),
      delPattern: jest.fn(async () => undefined),
    };
    const bulkActionService = { executeBulkAction: jest.fn(), getStatusCounts: jest.fn() };

    const service = new CommentsService(
      commentRepo as unknown as never,
      imageRiddleRepo as unknown as never,
      jokeRepo as unknown as never,
      guestUsersService as unknown as GuestUsersService,
      cacheService as unknown as CacheService,
      bulkActionService as unknown as BulkActionService
    );
    return { service, commentRepo, imageRiddleRepo, cacheService };
  };

  describe('create — guess handling', () => {
    it('marks a correct guess server-side and masks it in the response', async () => {
      const { service, commentRepo } = setup();
      const result = await service.create('guest_a', {
        contentType: CommentContentType.IMAGE_RIDDLE,
        contentId: 'riddle-1',
        kind: CommentKind.GUESS,
        text: '  the ICE CREAM ',
      });
      expect(commentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: true, kind: CommentKind.GUESS })
      );
      // Masked: answer text never echoes back, isCorrect never leaves.
      expect(result.text).toBeNull();
      expect(result.masked).toBe(true);
      expect(JSON.stringify(result)).not.toContain('isCorrect');
    });

    it('accepts alternative answers', async () => {
      const { service, commentRepo } = setup();
      await service.create('guest_a', {
        contentType: CommentContentType.IMAGE_RIDDLE,
        contentId: 'riddle-1',
        kind: CommentKind.GUESS,
        text: 'ICECREAM',
      });
      expect(commentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: true }));
    });

    it('leaves wrong guesses unmasked', async () => {
      const { service } = setup();
      const result = await service.create('guest_a', {
        contentType: CommentContentType.IMAGE_RIDDLE,
        contentId: 'riddle-1',
        kind: CommentKind.GUESS,
        text: 'pancakes',
      });
      expect(result.masked).toBe(false);
      expect(result.text).toBe('pancakes');
    });

    it('rejects an empty guess', async () => {
      const { service } = setup();
      await expect(
        service.create('guest_a', {
          contentType: CommentContentType.IMAGE_RIDDLE,
          contentId: 'riddle-1',
          kind: CommentKind.GUESS,
          text: '   ',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create — chip handling', () => {
    it('stores a chip tap with null text and no correctness', async () => {
      const { service, commentRepo } = setup();
      const result = await service.create('guest_a', {
        contentType: CommentContentType.IMAGE_RIDDLE,
        contentId: 'riddle-1',
        kind: CommentKind.CHIP,
        chip: CommentChip.NEVER_GOT,
      });
      expect(commentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ kind: CommentKind.CHIP, chip: 'never-got', text: null })
      );
      expect(result.masked).toBe(false);
    });

    it('rejects chip kind without a chip value', async () => {
      const { service } = setup();
      await expect(
        service.create('guest_a', {
          contentType: CommentContentType.IMAGE_RIDDLE,
          contentId: 'riddle-1',
          kind: CommentKind.CHIP,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('kind vs contentType matrix', () => {
    it('rejects guess/chip kinds on jokes', async () => {
      const { service } = setup();
      await expect(
        service.create('guest_a', {
          contentType: CommentContentType.JOKE,
          contentId: 'joke-1',
          kind: CommentKind.GUESS,
          text: 'ha',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts comments on jokes', async () => {
      const { service, commentRepo } = setup();
      await service.create('guest_a', {
        contentType: CommentContentType.JOKE,
        contentId: 'joke-1',
        kind: CommentKind.COMMENT,
        text: 'classic',
      });
      expect(commentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: CommentContentType.JOKE })
      );
    });
  });

  describe('delete ownership', () => {
    it('lets the owner delete their own comment', async () => {
      const existing = makeComment({ guestId: 'guest_a' });
      const { service, commentRepo } = setup({ existing });
      await service.removeAsGuest('c1', 'guest_a');
      expect(commentRepo.remove).toHaveBeenCalledWith(existing);
    });

    it('blocks deleting someone else’s comment', async () => {
      const existing = makeComment({ guestId: 'guest_a' });
      const { service, commentRepo } = setup({ existing });
      await expect(service.removeAsGuest('c1', 'guest_b')).rejects.toThrow(ForbiddenException);
      expect(commentRepo.remove).not.toHaveBeenCalled();
    });
  });
});
