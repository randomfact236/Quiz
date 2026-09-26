import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUser } from '../guest-users/entities/guest-user.entity';
import { GuestUsersModule } from '../guest-users/guest-users.module';
import { Question } from '../quiz-mcq/entities/question.entity';
import { DuelMatch } from './entities/duel-match.entity';
import { DuelParticipant } from './entities/duel-participant.entity';
import {
  DuelsPublicController,
  GuestPresenceController,
  PresenceController,
} from './duels-public.controller';
import { DuelsService } from './duels.service';

/**
 * Online duels + presence (mobile-app plan/17-online-duel.md, gap #7).
 * Race-mode matches with server-side grading; guest-identity only.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DuelMatch, DuelParticipant, Question, GuestUser]),
    // GuestUsersModule supplies the GuestTokenGuard. Every duel route is
    // guest-identified: without it a caller holding another guest's id could
    // answer, finish, or leave that player's match.
    GuestUsersModule,
  ],
  controllers: [DuelsPublicController, PresenceController, GuestPresenceController],
  providers: [DuelsService],
  exports: [DuelsService],
})
export class DuelsModule {}
