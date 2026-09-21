import { Controller, Get, Patch, Body, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AppSettings } from './interfaces/settings.interface';
import { GscOverview, GscService } from './gsc.service';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly gscService: GscService
  ) {}

  @Get()
  @Roles('admin')
  @ApiBearerAuth()
  async getSettings(): Promise<AppSettings> {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles('admin')
  @ApiBearerAuth()
  async updateSettings(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updates: UpdateSettingsDto
  ): Promise<AppSettings> {
    return this.settingsService.updateSettings(updates as Record<string, unknown>);
  }

  @Get('gsc/overview')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Google Search Console performance (top queries, pages, totals)',
  })
  async getGscOverview(@Query('days') days?: string): Promise<GscOverview> {
    const parsed = parseInt(days ?? '28', 10);
    const range = Number.isNaN(parsed) ? 28 : Math.min(Math.max(parsed, 7), 90);
    return this.gscService.getOverview(range);
  }
}
