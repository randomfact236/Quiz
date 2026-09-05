import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUser } from '../guest-users/entities/guest-user.entity';
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
  imports: [TypeOrmModule.forFeature([DuelMatch, DuelParticipant, Question, GuestUser])],
  controllers: [DuelsPublicController, PresenceController, GuestPresenceController],
  providers: [DuelsService],
  exports: [DuelsService],
})
export class DuelsModule {}
