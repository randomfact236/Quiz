/**
 * ============================================================================
 * Auto Seed Module
 * ============================================================================
 * Module that automatically seeds the database on application startup
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoSeedService } from './auto-seed.service';
import { RiddleSubject } from '../riddles/entities/riddle-subject.entity';
import { RiddleChapter } from '../riddles/entities/riddle-chapter.entity';
import { QuizRiddle } from '../riddles/entities/quiz-riddle.entity';
import { RiddleCategory } from '../riddles/entities/riddle-category.entity';
import { Riddle } from '../riddles/entities/riddle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiddleSubject,
      RiddleChapter,
      QuizRiddle,
      RiddleCategory,
      Riddle,
    ]),
  ],
  providers: [AutoSeedService],
  exports: [AutoSeedService],
})
export class AutoSeedModule {}
