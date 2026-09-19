/**
 * QuestionLikes Module (BUG-037) — see entities/question-like.entity.ts.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Question } from '../quiz-mcq/entities/question.entity';
import { RiddleMcq } from '../riddle-mcq/entities/riddle-mcq.entity';

import { AdminQuestionLikesController } from './admin-question-likes.controller';
import { QuestionLike } from './entities/question-like.entity';
import { QuestionLikesController } from './question-likes.controller';
import { QuestionLikesService } from './question-likes.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionLike, Question, RiddleMcq])],
  controllers: [QuestionLikesController, AdminQuestionLikesController],
  providers: [QuestionLikesService],
  exports: [QuestionLikesService],
})
export class QuestionLikesModule {}
