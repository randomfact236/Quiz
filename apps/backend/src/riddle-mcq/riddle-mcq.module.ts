import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../common/cache/cache.module';

import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { RiddleChapterSlugHistory } from './entities/riddle-chapter-slug-history.entity';
import { RiddleMcq } from './entities/riddle-mcq.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { RiddleMcqController } from './riddle-mcq.controller';
import { RiddleMcqService } from './riddle-mcq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiddleCategory, RiddleSubject, RiddleChapter, RiddleMcq, RiddleChapterSlugHistory]),
    CacheModule,
  ],
  controllers: [RiddleMcqController],
  providers: [RiddleMcqService],
  exports: [RiddleMcqService],
})
export class RiddleMcqModule {}