import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheService } from '../common/cache/cache.service';
import { BulkActionService } from '../common/services/bulk-action.service';

import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { RiddleMcq } from './entities/riddle-mcq.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { Riddle } from './entities/riddle.entity';
import { RiddlesController } from './riddles.controller';
import { RiddlesService } from './riddles.service';


@Module({
  imports: [TypeOrmModule.forFeature([Riddle, RiddleCategory, RiddleSubject, RiddleChapter, RiddleMcq])],
  controllers: [RiddlesController],
  providers: [RiddlesService, CacheService, BulkActionService],
  exports: [RiddlesService],
})
export class RiddlesModule {}
