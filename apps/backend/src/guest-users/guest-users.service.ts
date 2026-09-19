import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Comment } from '../comments/entities/comment.entity';
import { QuestionLike } from '../question-likes/entities/question-like.entity';

import { GuestUser } from './entities/guest-user.entity';

export interface GuestMergeResult {
  likesMerged: number;
  likesDeduped: number;
  commentsMerged: number;
}

@Injectable()
export class GuestUsersService {
  constructor(
    @InjectRepository(GuestUser)
    private guestUserRepo: Repository<GuestUser>,
    @InjectRepository(QuestionLike)
    private readonly likeRepo: Repository<QuestionLike>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>
  ) {}

  async findByGuestId(guestId: string): Promise<GuestUser | null> {
    return this.guestUserRepo.findOne({ where: { guestId } });
  }

  async create(guestId: string): Promise<GuestUser> {
    const guest = this.guestUserRepo.create({ guestId });
    return this.guestUserRepo.save(guest);
  }

  async findOrCreate(guestId: string): Promise<GuestUser> {
    let guest = await this.findByGuestId(guestId);
    if (!guest) {
      guest = await this.create(guestId);
    }
    return guest;
  }

  async updateActivity(guestId: string): Promise<GuestUser> {
    const guest = await this.findOrCreate(guestId);
    guest.lastActive = new Date();
    return this.guestUserRepo.save(guest);
  }

  /**
   * Wire the previously-idle counters (analytics plan §2.3): increment
   * quizAttempts / totalScore and bump lastActive on each completed session.
   * Atomic upsert on the unique guestId avoids lost updates under
   * concurrency and creates the row on first sight.
   */
  async recordSessionCompletion(guestId: string, score: number): Promise<void> {
    await this.guestUserRepo.query(
      `INSERT INTO guest_users ("guestId", "quizAttempts", "totalScore", "lastActive")
       VALUES ($1, 1, $2, now())
       ON CONFLICT ("guestId") DO UPDATE SET
         "quizAttempts" = guest_users."quizAttempts" + 1,
         "totalScore" = guest_users."totalScore" + $2,
         "lastActive" = now()`,
      [guestId, score]
    );
  }

  async getAll(): Promise<GuestUser[]> {
    return this.guestUserRepo.find({
      order: { lastActive: 'DESC' },
    });
  }

  async getCount(): Promise<number> {
    return this.guestUserRepo.count();
  }

  /**
   * Zero the public play counters (analytics fresh-start reset, BUG-012).
   * Guest identities are kept so existing sessions/comments still resolve —
   * only the homepage-visible totals are cleared.
   */
  async resetPlayCounters(): Promise<void> {
    await this.guestUserRepo.update({}, { quizAttempts: 0, totalScore: 0 });
  }

  // ==================== LOGIN MERGE ====================

  /**
   * Attach a guest's anonymous activity to a signed-in account (called from
   * POST /guest-users/merge right after login/register/OAuth exchange).
   *
   * Likes are deduped against rows the account already owns: where the same
   * question was liked both as guest and logged-in, the guest duplicate is
   * DELETED rather than stamped — the (contentType, questionId) unique-ish
   * pair would otherwise double-count public like totals. Comments have no
   * uniqueness, so they are stamped in one update. Idempotent: re-merging an
   * already-merged guest touches nothing.
   */
  async mergeGuestIntoUser(guestId: string, userId: string): Promise<GuestMergeResult> {
    const guestLikes = await this.likeRepo.find({ where: { guestId, userId: IsNull() } });
    const ownedLikes = await this.likeRepo.find({ where: { userId } });
    const owned = new Set(ownedLikes.map((row) => `${row.contentType}:${row.questionId}`));

    let likesMerged = 0;
    let likesDeduped = 0;
    for (const row of guestLikes) {
      const key = `${row.contentType}:${row.questionId}`;
      if (owned.has(key)) {
        await this.likeRepo.remove(row);
        likesDeduped++;
      } else {
        row.userId = userId;
        await this.likeRepo.save(row);
        likesMerged++;
        owned.add(key);
      }
    }

    const stamped = await this.commentRepo.update({ guestId, userId: IsNull() }, { userId });

    return { likesMerged, likesDeduped, commentsMerged: stamped.affected ?? 0 };
  }
}
