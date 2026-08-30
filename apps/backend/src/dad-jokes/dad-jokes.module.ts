import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../common/cache/cache.module';
import { BulkActionService } from '../common/services/bulk-action.service';
import { AnalyticsModule } from '../analytics/analytics.module';

import { DadJokesStatsController } from './dad-jokes-stats.controller';
import { DadJokesController } from './dad-jokes.controller';
import { DadJokesService } from './dad-jokes.service';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';

/**
 * Dad Jokes module for managing classic (setup/punchline) jokes
 *
 * @description Provides REST API endpoints for classic dad joke CRUD,
 * categories, voting, bulk operations, and stats. Integrates with
 * caching and bulk action services.
 *
 * @class
 * @example
 * // Import in AppModule or other modules
 * imports: [DadJokesModule]
 */
@Module({
  imports: [TypeOrmModule.forFeature([DadJoke, JokeCategory]), CacheModule, AnalyticsModule],
  controllers: [DadJokesController, DadJokesStatsController],
  providers: [DadJokesService, BulkActionService],
  exports: [DadJokesService],
})
export class DadJokesModule {}
