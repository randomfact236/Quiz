/**
 * ============================================================================
 * Admin Analytics Controller — dashboard endpoints (analytics plan Phase 4)
 * ============================================================================
 * Overview (DAU/WAU/MAU, per-module completions, accuracy, daily series,
 * cohorts) + raw event browser. Short-TTL cached in AnalyticsService.
 * ============================================================================
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

import { AnalyticsService } from './analytics.service';
import { AdminDashboardQueryDto, AdminEventsQueryDto } from './dto/analytics.dto';

@ApiTags('Analytics (admin)')
@ApiBearerAuth()
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Dashboard overview: totals, DAU/WAU/MAU, accuracy, daily series' })
  getOverview() {
    return this.analyticsService.getAdminOverview();
  }

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Tabbed-dashboard payload: KPIs, daily series, geo, devices, referrers, web vitals, per-module drill-downs',
  })
  getDashboard(@Query() query: AdminDashboardQueryDto) {
    return this.analyticsService.getDashboard(query.days ?? 30);
  }

  @Get('retention')
  @ApiOperation({ summary: 'Weekly first-seen retention cohorts (last N weeks)' })
  getRetention(@Query('weeks') weeks?: string) {
    return this.analyticsService.getRetentionCohorts(Number(weeks) || 6);
  }

  @Get('events')
  @ApiOperation({
    summary:
      'Raw event browser (filter by eventName/module/date range/actor — userId, guestId or sessionId)',
  })
  getEvents(@Query() query: AdminEventsQueryDto) {
    return this.analyticsService.listEvents({
      eventName: query.eventName,
      module: query.module,
      from: query.from,
      to: query.to,
      actor: query.actor,
      page: query.page ?? 1,
      limit: query.limit ?? 50,
    });
  }
}
