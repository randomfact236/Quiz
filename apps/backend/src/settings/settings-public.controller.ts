import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { _Public } from '../common/decorators/public.decorator';
import { AppSettings } from './interfaces/settings.interface';
import { SettingsService } from './settings.service';

/**
 * Public settings surface (plan/11-site-settings.md P1 #2).
 *
 * `GET /settings` is admin-only, so gameplay pages could never read real
 * settings. This controller exposes only the gameplay-relevant, non-sensitive
 * keys: per-level timers. Cache TTLs, patterns, and internal keys stay
 * admin-only.
 */
@ApiTags('Settings')
@Controller('settings')
export class SettingsPublicController {
  constructor(private readonly settingsService: SettingsService) {}

  @_Public()
  @Get('public')
  @ApiOperation({ summary: 'Gameplay-relevant settings (timers only, no admin keys)' })
  getPublicSettings(): {
    quiz: { defaults: AppSettings['quiz']['defaults'] };
    riddles: { defaults: AppSettings['riddles']['defaults'] };
    imageRiddles: { timers: AppSettings['imageRiddles']['timers'] };
  } {
    const settings = this.settingsService.getSettings();
    return {
      quiz: { defaults: settings.quiz.defaults },
      riddles: { defaults: settings.riddles.defaults },
      imageRiddles: { timers: settings.imageRiddles.timers },
    };
  }
}
