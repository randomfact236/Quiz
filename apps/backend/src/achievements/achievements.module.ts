import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AchievementUnlock } from './entities/achievement-unlock.entity';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

/**
 * Achievements sync module (plan/06-achievements.md P1 #3): persists client
 * unlocks so they survive browser resets and are queryable server-side.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AchievementUnlock])],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
