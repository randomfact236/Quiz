import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsModule } from '../analytics/analytics.module';

import { SystemSetting } from './entities/system-setting.entity';
import { SettingsController } from './settings.controller';
import { SettingsPublicController } from './settings-public.controller';
import { GscService } from './gsc.service';
import { SettingsService } from './settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting]), AnalyticsModule],
  controllers: [SettingsController, SettingsPublicController],
  providers: [SettingsService, GscService],
  exports: [SettingsService],
})
export class SettingsModule {}
