import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DadJokesController } from './dad-jokes.controller';
import { DadJokesQuizController } from './dad-jokes-quiz.controller';
import { DadJokesStatsController } from './dad-jokes-stats.controller';
import { DadJokesService } from './dad-jokes.service';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import { JokeSubject } from './entities/joke-subject.entity';
import { JokeChapter } from './entities/joke-chapter.entity';
import { QuizJoke } from './entities/quiz-joke.entity';
import { CacheModule } from '../common/cache/cache.module';
import { BulkActionService } from '../common/services/bulk-action.service';

/**
 * Dad Jokes module for managing classic and quiz format jokes
 * 
 * @description Provides functionality for dad jokes in both classic (setup/punchline)
 * and quiz (multiple choice) formats. Includes TypeORM entities for jokes, categories,
 * subjects, chapters, and quiz-format jokes. Integrates with caching and bulk action services.
 * 
 * @class
 * @example
 * // Import in AppModule or other modules
 * imports: [DadJokesModule]
 */
@Module({
  imports: [TypeOrmModule.forFeature([DadJoke, JokeCategory, JokeSubject, JokeChapter, QuizJoke]), CacheModule],
  controllers: [DadJokesController, DadJokesQuizController, DadJokesStatsController],
  providers: [DadJokesService, BulkActionService],
  exports: [DadJokesService],
})
export class DadJokesModule {}
