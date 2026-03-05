import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheService } from '../common/cache/cache.service';
import { BulkActionService } from '../common/services/bulk-action.service';

import { QuizRiddle } from './entities/quiz-riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { Riddle } from './entities/riddle.entity';
import { RiddlesController } from './riddles.controller';
import { RiddlesService } from './riddles.service';


@Module({
  imports: [TypeOrmModule.forFeature([Riddle, RiddleCategory, RiddleSubject, RiddleChapter, QuizRiddle])],
  controllers: [RiddlesController],
  providers: [RiddlesService, CacheService, BulkActionService],
  exports: [RiddlesService],
})
export class RiddlesModule {}
