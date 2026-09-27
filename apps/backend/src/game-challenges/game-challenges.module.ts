import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { GameChallenge } from './entities/game-challenge.entity';
import { GameChallengesController } from './game-challenges.controller';
import { GameChallengesService } from './game-challenges.service';

/**
 * Async game challenges (plan/18 phase 4) — a finished run behind a
 * shareable token; friends accept by playing the same board / beating the
 * score. GuestUsersModule supplies the GuestTokenGuard for the writes.
 */
@Module({
  imports: [TypeOrmModule.forFeature([GameChallenge]), GuestUsersModule],
  controllers: [GameChallengesController],
  providers: [GameChallengesService],
  exports: [GameChallengesService],
})
export class GameChallengesModule {}
