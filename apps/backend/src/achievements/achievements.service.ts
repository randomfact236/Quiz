import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AchievementUnlock } from './entities/achievement-unlock.entity';
import type { SyncAchievementsDto } from './dto/sync-achievements.dto';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(AchievementUnlock)
    private readonly unlockRepo: Repository<AchievementUnlock>
  ) {}

  /**
   * Upsert the client's unlocks for this identity (plan/06-achievements.md
   * P1 #3). Idempotent per (userId|guestId, achievementId): earlier unlock
   * timestamps win, so re-syncs never move the unlock date forward.
   */
  async syncUnlocks(dto: SyncAchievementsDto, userId: string | null): Promise<{ synced: number }> {
    if (!userId && !dto.guestId) {
      return { synced: 0 };
    }

    let synced = 0;
    for (const unlock of dto.unlocks) {
      const existing = await this.unlockRepo.findOne({
        where: {
          achievementId: unlock.achievementId,
          userId: userId ?? null,
          guestId: userId ? null : (dto.guestId ?? null),
        } as never,
      });

      if (!existing) {
        await this.unlockRepo.insert({
          userId: userId ?? null,
          guestId: userId ? null : (dto.guestId ?? null),
          achievementId: unlock.achievementId,
          unlockedAt: new Date(unlock.unlockedAt),
        });
        synced++;
      } else if (new Date(unlock.unlockedAt) < new Date(existing.unlockedAt)) {
        existing.unlockedAt = new Date(unlock.unlockedAt);
        await this.unlockRepo.save(existing);
        synced++;
      }
    }
    return { synced };
  }

  /** Stored unlocks for the caller (token-bound, else guestId). */
  async getUnlocks(identity: {
    userId?: string | null;
    guestId?: string | null;
  }): Promise<Array<{ achievementId: string; unlockedAt: Date }>> {
    if (!identity.userId && !identity.guestId) return [];
    const rows = await this.unlockRepo.find({
      where: identity.userId ? { userId: identity.userId } : { guestId: identity.guestId! },
      order: { unlockedAt: 'DESC' },
    });
    return rows.map((r) => ({ achievementId: r.achievementId, unlockedAt: r.unlockedAt }));
  }
}
