/**
 * ============================================================================
 * Analytics Controller — public ingest + public summary
 * ============================================================================
 * POST /analytics/events accepts batched client events (analytics plan §8).
 * Public + throttled: analytics must never block gameplay, and the endpoint
 * is intentionally forgiving (invalid events are dropped, not rejected).
 * GET /analytics/summary feeds the home-page StatsSection from the same
 * counters the dashboards use (plan §5.3).
 * ============================================================================
 */

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { _Public } from '../common/decorators/public.decorator';
import { _CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

import { AnalyticsService } from './analytics.service';
import { IngestEventsDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @_Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Batch-ingest client analytics events (max 50/batch)' })
  async ingest(@Body() dto: IngestEventsDto, @_CurrentUser('id') userId?: string) {
    return this.analyticsService.ingest(dto.events, userId ?? null);
  }

  @Get('summary')
  @_Public()
  @ApiOperation({ summary: 'Public per-module completion counts (StatsSection source)' })
  getPublicSummary() {
    return this.analyticsService.getPublicSummary();
  }
}
