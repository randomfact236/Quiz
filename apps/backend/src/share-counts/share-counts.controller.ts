import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { _Public } from '../common/decorators/public.decorator';

import { RecordShareDto } from './dto/share-count.dto';
import { ShareCountsService } from './share-counts.service';

/**
 * Public share counters (BUG-048): every share-target click increments the
 * content's total; totals are readable by anyone, per content type.
 */
@Controller('share-counts')
@UseGuards(OptionalJwtAuthGuard)
export class ShareCountsController {
  constructor(private readonly shareCountsService: ShareCountsService) {}

  @Post()
  @_Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async record(@Body() dto: RecordShareDto): Promise<{ recorded: boolean }> {
    await this.shareCountsService.record(dto.contentType, dto.contentId, dto.platform ?? 'other');
    return { recorded: true };
  }

  @Get('counts')
  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async counts(
    @Query('contentType') contentType: string,
    @Query('ids') ids: string
  ): Promise<Record<string, number>> {
    const list = (ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 50);
    return this.shareCountsService.counts(contentType, list);
  }
}
