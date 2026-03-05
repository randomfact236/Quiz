import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheService } from '../common/cache/cache.service';
import { BulkActionService } from '../common/services/bulk-action.service';

import { Chapter } from './entities/chapter.entity';
import { Question } from './entities/question.entity';
import { Subject } from './entities/subject.entity';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';


@Module({
  imports: [TypeOrmModule.forFeature([Subject, Chapter, Question])],
  controllers: [QuizController],
  providers: [QuizService, CacheService, BulkActionService],
  exports: [QuizService],
})
export class QuizModule {}
