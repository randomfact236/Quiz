/**
 * QuestionLikes Module (BUG-037) — see entities/question-like.entity.ts.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Question } from '../quiz-mcq/entities/question.entity';
import { RiddleMcq } from '../riddle-mcq/entities/riddle-mcq.entity';
import { GuestUsersModule } from '../guest-users/guest-users.module';

import { AdminQuestionLikesController } from './admin-question-likes.controller';
import { QuestionLike } from './entities/question-like.entity';
import { QuestionLikesController } from './question-likes.controller';
import { QuestionLikesService } from './question-likes.service';

@Module({
  // GuestUsersModule supplies the GuestTokenGuard enforced on the like route
  // (HARD-03 / SEC-12 signed guest identity).
  imports: [TypeOrmModule.forFeature([QuestionLike, Question, RiddleMcq]), GuestUsersModule],
  controllers: [QuestionLikesController, AdminQuestionLikesController],
  providers: [QuestionLikesService],
  exports: [QuestionLikesService],
})
export class QuestionLikesModule {}
