import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BulkActionService } from '../common/services/bulk-action.service';
import { GuestUsersModule } from '../guest-users/guest-users.module';

import { Chapter } from './entities/chapter.entity';
import { DailyChallengeResult } from './entities/daily-challenge-result.entity';
import { Question } from './entities/question.entity';
import { Subject } from './entities/subject.entity';
import { QuizSession } from './entities/quiz-session.entity';
import { DailyChallengeService } from './services/daily-challenge.service';
import { QuizMcqController } from './quiz-mcq.controller';
import { QuizMcqService } from './quiz-mcq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, Chapter, Question, QuizSession, DailyChallengeResult]),
    // GuestUsersModule supplies the GuestTokenGuard enforced on the
    // guest-attributed session write and history read.
    GuestUsersModule,
  ],
  controllers: [QuizMcqController],
  providers: [QuizMcqService, DailyChallengeService, BulkActionService],
  exports: [QuizMcqService],
})
export class QuizMcqModule {}
