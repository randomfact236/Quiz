import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AppSettings, SettingsValue } from './interfaces/settings.interface';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('settings')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    // @Roles('admin')
    async getSettings(): Promise<AppSettings> {
        return this.settingsService.getSettings();
    }

    @Patch()
    // @Roles('admin')
    async updateSettings(@Body() updates: Record<string, SettingsValue>): Promise<AppSettings> {
        return this.settingsService.updateSettings(updates);
    }
}
