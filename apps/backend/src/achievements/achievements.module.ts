import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';

import { AchievementUnlock } from './entities/achievement-unlock.entity';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

/**
 * Achievements sync module (plan/06-achievements.md P1 #3): persists client
 * unlocks so they survive browser resets and are queryable server-side.
 */
@Module({
  // GuestUsersModule supplies the GuestTokenGuard: both the sync write and
  // the unlocks read are guest-scoped, so both require the signed pair.
  imports: [TypeOrmModule.forFeature([AchievementUnlock]), GuestUsersModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
