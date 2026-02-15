import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiddlesController } from './riddles.controller';
import { RiddlesService } from './riddles.service';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { QuizRiddle } from './entities/quiz-riddle.entity';
import { CacheService } from '../common/cache/cache.service';
import { BulkActionService } from '../common/services/bulk-action.service';

@Module({
  imports: [TypeOrmModule.forFeature([Riddle, RiddleCategory, RiddleSubject, RiddleChapter, QuizRiddle])],
  controllers: [RiddlesController],
  providers: [RiddlesService, CacheService, BulkActionService],
  exports: [RiddlesService],
})
export class RiddlesModule {}
