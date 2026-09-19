/**
 * ============================================================================
 * QuestionLikes Service (BUG-037 — internal like-bucket collection)
 * ============================================================================
 * Capture is idempotent per guest; the 1 / 2 / 3+-like classification is
 * DERIVED at read time (GROUP BY + HAVING), never stored. Question text is
 * joined from the quiz/riddle repos so the admin buckets are human-readable.
 * ============================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DadJoke } from '../dad-jokes/entities/dad-joke.entity';
import { Question } from '../quiz-mcq/entities/question.entity';
import { RiddleMcq } from '../riddle-mcq/entities/riddle-mcq.entity';
import { QuestionLike, QuestionLikeContentType } from './entities/question-like.entity';

export interface LikeBucketEntry {
  questionId: string;
  questionText: string;
  likes: number;
}

export interface LikeBuckets {
  contentType: QuestionLikeContentType;
  one: LikeBucketEntry[];
  two: LikeBucketEntry[];
  threePlus: LikeBucketEntry[];
}

@Injectable()
export class QuestionLikesService {
  constructor(
    @InjectRepository(QuestionLike)
    private readonly likesRepo: Repository<QuestionLike>,
    @InjectRepository(Question)
    private readonly quizQuestionRepo: Repository<Question>,
    @InjectRepository(RiddleMcq)
    private readonly riddleQuestionRepo: Repository<RiddleMcq>
  ) {}

  /** Idempotent capture: a repeat like from the same guest is a no-op. */
  async like(
    contentType: QuestionLikeContentType,
    questionId: string,
    guestId: string,
    userId?: string | null
  ): Promise<{ liked: boolean; alreadyLiked: boolean }> {
    if (contentType === QuestionLikeContentType.QUIZ) {
      const q = await this.quizQuestionRepo.findOne({ where: { id: questionId } });
      if (!q) throw new NotFoundException('Quiz question not found');
    } else {
      const q = await this.riddleQuestionRepo.findOne({ where: { id: questionId } });
      if (!q) throw new NotFoundException('Riddle question not found');
    }

    const existing = await this.likesRepo.findOne({
      where: { contentType, questionId, guestId },
    });
    if (existing) {
      // A logged-in like can upgrade an earlier guest-only row.
      if (userId && !existing.userId) {
        existing.userId = userId;
        await this.likesRepo.save(existing);
      }
      return { liked: true, alreadyLiked: true };
    }

    await this.likesRepo.insert({
      contentType,
      questionId,
      guestId,
      userId: userId ?? null,
    } as Partial<QuestionLike> as QuestionLike);
    return { liked: true, alreadyLiked: false };
  }

  /** Public like totals keyed by question id (BUG-048). Unknown ids omitted. */
  async likeCounts(
    contentType: QuestionLikeContentType,
    ids: string
  ): Promise<Record<string, number>> {
    const idList = ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);
    if (idList.length === 0) return {};
    const rows: Array<{ questionId: string; likes: string }> = await this.likesRepo
      .createQueryBuilder('like')
      .select('like.questionId', 'questionId')
      .addSelect('COUNT(*)', 'likes')
      .where('like.contentType = :contentType', { contentType })
      .andWhere('like.questionId IN (:...ids)', { ids: idList })
      .groupBy('like.questionId')
      .getRawMany();
    const out: Record<string, number> = {};
    for (const r of rows) out[r.questionId] = Number(r.likes);
    return out;
  }

  async likedByMe(
    contentType: QuestionLikeContentType,
    questionId: string,
    guestId: string
  ): Promise<boolean> {
    const row = await this.likesRepo.findOne({ where: { contentType, questionId, guestId } });
    return !!row;
  }

  /** Internal buckets — exact-1, exact-2, 3-or-more, derived by count. */
  async buckets(contentType?: QuestionLikeContentType): Promise<LikeBuckets[]> {
    const families = contentType ? [contentType] : Object.values(QuestionLikeContentType);
    const result: LikeBuckets[] = [];

    for (const family of families) {
      const repo =
        family === QuestionLikeContentType.QUIZ ? this.quizQuestionRepo : this.riddleQuestionRepo;
      const rows: Array<{ questionId: string; questionText: string; likes: string }> =
        await this.likesRepo
          .createQueryBuilder('like')
          .select('like.questionId', 'questionId')
          .addSelect('COUNT(*)', 'likes')
          .where('like.contentType = :contentType', { contentType: family })
          .groupBy('like.questionId')
          .getRawMany();

      const textById = new Map<string, string>();
      const ids = rows.map((r) => r.questionId);
      if (ids.length > 0) {
        const questions = await repo
          .createQueryBuilder('q')
          .select(['q.id', 'q.question'])
          .where('q.id IN (:...ids)', { ids })
          .getMany();
        for (const q of questions) textById.set(q.id, q.question);
      }

      const toEntry = (r: { questionId: string; likes: string }): LikeBucketEntry => ({
        questionId: r.questionId,
        questionText: textById.get(r.questionId) ?? '(deleted question)',
        likes: Number(r.likes),
      });
      const one: LikeBucketEntry[] = [];
      const two: LikeBucketEntry[] = [];
      const threePlus: LikeBucketEntry[] = [];
      for (const r of rows) {
        const likes = Number(r.likes);
        const entry = toEntry(r);
        if (likes <= 1) one.push(entry);
        else if (likes === 2) two.push(entry);
        else threePlus.push(entry);
      }
      result.push({ contentType: family, one, two, threePlus });
    }
    return result;
  }
}
