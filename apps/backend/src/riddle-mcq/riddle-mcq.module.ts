import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../common/cache/cache.module';

import { RiddleMcqCategory } from './entities/riddle-category.entity';
import { RiddleSession } from './entities/riddle-session.entity';
import { RiddleSessionService } from './services/riddle-session.service';
import { RiddleMcq } from './entities/riddle-mcq.entity';
import { RiddleMcqSubject } from './entities/riddle-subject.entity';
import {
  RiddleMcqCategoryService,
  RiddleMcqSubjectService,
  RiddleMcqQuestionService,
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
    TypeOrmModule.forFeature([RiddleMcqCategory, RiddleMcqSubject, RiddleMcq, RiddleSession]),
    CacheModule,
  ],
  controllers: [RiddleMcqCategoryController, RiddleMcqSubjectController, RiddleMcqController],
  providers: [
    RiddleMcqCategoryService,
    RiddleMcqSubjectService,
    RiddleMcqQuestionService,
    RiddleMcqBulkActionsService,
    RiddleMcqImportService,
    RiddleMcqStatsService,
    RiddleSessionService,
  ],
})
export class RiddleMcqModule {}
