import { NotFoundException } from '@nestjs/common';

import { QuestionLikesService } from './question-likes.service';
import { QuestionLikeContentType } from './entities/question-like.entity';

/**
 * BE-11: these paths (capture, counts, restore-check, derived buckets) had no
 * coverage. Repos are faked; the service is constructed directly.
 */
describe('QuestionLikesService', () => {
  let likesRepo: any;
  let quizRepo: any;
  let riddleRepo: any;
  let service: QuestionLikesService;
  const ct = QuestionLikeContentType.QUIZ;

  const chain = (rows: unknown[]) => {
    const qb: any = {};
    for (const m of ['select', 'addSelect', 'where', 'andWhere', 'groupBy']) {
      qb[m] = jest.fn().mockReturnValue(qb);
    }
    qb.getRawMany = jest.fn().mockResolvedValue(rows);
    qb.getMany = jest.fn().mockResolvedValue(rows);
    return qb;
  };

  beforeEach(() => {
    likesRepo = {
      findOne: jest.fn(),
      insert: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    quizRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
    riddleRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
    service = new QuestionLikesService(likesRepo, quizRepo, riddleRepo);
  });

  describe('like()', () => {
    it('throws when the quiz question does not exist and writes nothing', async () => {
      quizRepo.findOne.mockResolvedValue(null);
      await expect(service.like(ct, 'q1', 'g1')).rejects.toThrow(NotFoundException);
      expect(likesRepo.insert).not.toHaveBeenCalled();
    });

    it('records a first like for the given voter', async () => {
      quizRepo.findOne.mockResolvedValue({ id: 'q1' });
      likesRepo.findOne.mockResolvedValue(null);
      likesRepo.insert.mockResolvedValue(undefined);
      await expect(service.like(ct, 'q1', 'g1', 'u1')).resolves.toEqual({
        liked: true,
        alreadyLiked: false,
      });
      expect(likesRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: ct, questionId: 'q1', guestId: 'g1', userId: 'u1' })
      );
    });

    it('is idempotent per guest and upgrades a guest row to the account', async () => {
      quizRepo.findOne.mockResolvedValue({ id: 'q1' });
      const row: any = { contentType: ct, questionId: 'q1', guestId: 'g1', userId: null };
      likesRepo.findOne.mockResolvedValue(row);
      likesRepo.save.mockResolvedValue(row);
      await expect(service.like(ct, 'q1', 'g1', 'u9')).resolves.toEqual({
        liked: true,
        alreadyLiked: true,
      });
      expect(likesRepo.insert).not.toHaveBeenCalled();
      expect(row.userId).toBe('u9');
      expect(likesRepo.save).toHaveBeenCalledWith(row);
    });

    it('checks the riddle repo for riddle content', async () => {
      riddleRepo.findOne.mockResolvedValue(null);
      await expect(service.like(QuestionLikeContentType.RIDDLE, 'r1', 'g1')).rejects.toThrow(
        NotFoundException
      );
      expect(quizRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('likeCounts()', () => {
    it('returns {} for an empty id list without hitting the database', async () => {
      await expect(service.likeCounts(ct, ' , ,')).resolves.toEqual({});
      expect(likesRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('maps raw counts to numbers and caps the id list at 100', async () => {
      const qb = chain([{ questionId: 'q1', likes: '3' }]);
      likesRepo.createQueryBuilder.mockReturnValue(qb);
      const ids = Array.from({ length: 120 }, (_, i) => `q${i}`).join(',');
      await expect(service.likeCounts(ct, ids)).resolves.toEqual({ q1: 3 });
      const params = qb.andWhere.mock.calls[0][1] as { ids: string[] };
      expect(params.ids).toHaveLength(100);
    });
  });

  describe('likedByMe()', () => {
    it('matches the guest row and the account row', async () => {
      likesRepo.findOne.mockResolvedValue(null);
      await expect(service.likedByMe(ct, 'q1', 'g1', 'u1')).resolves.toBe(false);
      expect(likesRepo.findOne).toHaveBeenCalledWith({
        where: [
          { contentType: ct, questionId: 'q1', guestId: 'g1' },
          { contentType: ct, questionId: 'q1', userId: 'u1' },
        ],
      });
    });

    it('checks only the guest row when nobody is signed in', async () => {
      likesRepo.findOne.mockResolvedValue({ id: 'l1' });
      await expect(service.likedByMe(ct, 'q1', 'g1')).resolves.toBe(true);
      expect(likesRepo.findOne).toHaveBeenCalledWith({
        where: [{ contentType: ct, questionId: 'q1', guestId: 'g1' }],
      });
    });
  });

  describe('buckets()', () => {
    it('classifies exact-1 / exact-2 / 3+ and joins the question text', async () => {
      likesRepo.createQueryBuilder.mockReturnValue(
        chain([
          { questionId: 'a', likes: '1' },
          { questionId: 'b', likes: '2' },
          { questionId: 'c', likes: '5' },
        ])
      );
      quizRepo.createQueryBuilder.mockReturnValue(
        chain([
          { id: 'a', question: 'QA' },
          { id: 'b', question: 'QB' },
          { id: 'c', question: 'QC' },
        ])
      );
      const res = await service.buckets(ct);
      expect(res).toHaveLength(1);
      expect(res[0]!.one.map((e) => e.questionId)).toEqual(['a']);
      expect(res[0]!.two.map((e) => e.questionId)).toEqual(['b']);
      expect(res[0]!.threePlus.map((e) => e.questionId)).toEqual(['c']);
      expect(res[0]!.one[0]!.questionText).toBe('QA');
    });
  });
});
