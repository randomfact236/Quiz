import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheService } from '../common/cache/cache.service';
import { BulkActionService } from '../common/services/bulk-action.service';

import { Chapter } from './entities/chapter.entity';
import { Question } from './entities/question.entity';
import { Subject } from './entities/subject.entity';
import { QuizSession } from './entities/quiz-session.entity';
import { QuizMcqController } from './quiz-mcq.controller';
import { QuizMcqService } from './quiz-mcq.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Chapter, Question, QuizSession])],
  controllers: [QuizMcqController],
  providers: [QuizMcqService, CacheService, BulkActionService],
  exports: [QuizMcqService],
})
export class QuizMcqModule {}
