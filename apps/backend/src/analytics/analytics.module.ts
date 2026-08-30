/**
 * ============================================================================
 * Analytics Module
 * ============================================================================
 * One wide `analytics_events` table + batch ingest + dashboard aggregation.
 * See docs/analytics/analytics-data-collection.md (Phases 1–4).
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { CacheModule } from '../common/cache/cache.module';

import { AdminAnalyticsController } from './admin-analytics.controller';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from './entities/analytics-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent]), GuestUsersModule, CacheModule],
  controllers: [AnalyticsController, AdminAnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
