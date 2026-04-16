import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../common/cache/cache.module';

import { RiddleMcqCategory } from './entities/riddle-category.entity';
import { RiddleMcq } from './entities/riddle-mcq.entity';
import { RiddleMcqSubject } from './entities/riddle-subject.entity';
import {
  RiddleMcqCategoryService,
  RiddleMcqSubjectService,
  RiddleMcqQuestionService,
  RiddleMcqBulkService,
  RiddleMcqBulkActionsService,
  RiddleMcqImportService,
  RiddleMcqStatsService,
} from './services';
import {
  RiddleMcqCategoryController,
  RiddleMcqSubjectController,
  RiddleMcqController,
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiddleMcqCategory, RiddleMcqSubject, RiddleMcq]),
    CacheModule,
  ],
  controllers: [RiddleMcqCategoryController, RiddleMcqSubjectController, RiddleMcqController],
  providers: [
    RiddleMcqCategoryService,
    RiddleMcqSubjectService,
    RiddleMcqQuestionService,
    RiddleMcqBulkService,
    RiddleMcqBulkActionsService,
    RiddleMcqImportService,
    RiddleMcqStatsService,
  ],
  exports: [
    RiddleMcqCategoryService,
    RiddleMcqSubjectService,
    RiddleMcqQuestionService,
    RiddleMcqBulkService,
    RiddleMcqBulkActionsService,
    RiddleMcqImportService,
    RiddleMcqStatsService,
  ],
})
export class RiddleMcqModule {}
