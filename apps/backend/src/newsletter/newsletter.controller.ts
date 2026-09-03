import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { _Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SubscribeDto } from './dto/subscribe.dto';
import { NewsletterService } from './newsletter.service';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @_Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe an email (idempotent, honeypot-protected)' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto.email, dto.source ?? 'footer', dto.website);
  }

  @_Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe an email (idempotent)' })
  unsubscribe(@Body() body: { email: string }) {
    return this.newsletterService.unsubscribe(body.email ?? '');
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paginated subscriber list (admin)' })
  list(
    @Query('source') source?: 'footer' | 'about',
    @Query('unsubscribed') unsubscribed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.newsletterService.list({
      source,
      unsubscribed: unsubscribed === undefined ? undefined : unsubscribed === 'true',
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(200, Math.max(1, Number(limit) || 50)),
    });
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'CSV export of active subscribers (admin)' })
  async export(): Promise<{ csv: string; filename: string }> {
    return {
      csv: await this.newsletterService.exportCsv(),
      filename: `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }
}
