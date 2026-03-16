/**
 * ============================================================================
 * Auto Seed Module
 * ============================================================================
 * Module that automatically seeds the database on application startup
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RiddleCategory } from '../riddles/entities/riddle-category.entity';
import { RiddleChapter } from '../riddles/entities/riddle-chapter.entity';
import { RiddleMcq } from '../riddles/entities/riddle-mcq.entity';
import { RiddleSubject } from '../riddles/entities/riddle-subject.entity';
import { Riddle } from '../riddles/entities/riddle.entity';
import { User } from '../users/entities/user.entity';

import { AutoSeedService } from './auto-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiddleSubject,
      RiddleChapter,
      RiddleMcq,
      RiddleCategory,
      Riddle,
      User,
    ]),
  ],
  providers: [AutoSeedService],
  exports: [AutoSeedService],
})
export class AutoSeedModule { }
