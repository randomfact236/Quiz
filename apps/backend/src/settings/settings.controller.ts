import { Controller, Get, Patch, Body, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AppSettings } from './interfaces/settings.interface';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

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
        updates: UpdateSettingsDto,
    ): Promise<AppSettings> {
        return this.settingsService.updateSettings(updates as Record<string, unknown>);
    }
}
