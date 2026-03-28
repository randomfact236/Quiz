import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GuestUser } from './entities/guest-user.entity';

@Injectable()
export class GuestUsersService {
  constructor(
    @InjectRepository(GuestUser)
    private guestUserRepo: Repository<GuestUser>,
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

  async updateDemographics(
    guestId: string,
    data: { country?: string; sex?: 'male' | 'female'; ageGroup?: string },
  ): Promise<GuestUser> {
    const guest = await this.findOrCreate(guestId);
    Object.assign(guest, data);
    return this.guestUserRepo.save(guest);
  }

  async updateActivity(guestId: string): Promise<GuestUser> {
    const guest = await this.findOrCreate(guestId);
    guest.lastActive = new Date();
    return this.guestUserRepo.save(guest);
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
