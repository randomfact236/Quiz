import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GuestUser } from './entities/guest-user.entity';

@Injectable()
export class GuestUsersService {
  constructor(
    @InjectRepository(GuestUser)
    private guestUserRepo: Repository<GuestUser>
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
}
