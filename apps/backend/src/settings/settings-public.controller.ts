import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { _Public } from '../common/decorators/public.decorator';
import { AppSettings } from './interfaces/settings.interface';
import { SettingsService } from './settings.service';

/**
 * Public settings surface (plan/11-site-settings.md P1 #2).
 *
 * `GET /settings` is admin-only, so gameplay pages could never read real
 * settings. This controller exposes only the non-sensitive keys: gameplay
 * timers and the site SEO metadata (which is rendered into public meta tags
 * anyway). Cache TTLs, patterns, and internal keys stay admin-only.
 */
@ApiTags('Settings')
@Controller('settings')
export class SettingsPublicController {
  constructor(private readonly settingsService: SettingsService) {}

  @_Public()
  @Get('public')
  @ApiOperation({ summary: 'Public-safe settings: gameplay timers + site SEO metadata' })
  getPublicSettings(): {
    quiz: { defaults: AppSettings['quiz']['defaults'] };
    riddles: { defaults: AppSettings['riddles']['defaults'] };
    imageRiddles: { timers: AppSettings['imageRiddles']['timers'] };
    seo: AppSettings['seo'];
  } {
    const settings = this.settingsService.getSettings();
    return {
      quiz: { defaults: settings.quiz.defaults },
      riddles: { defaults: settings.riddles.defaults },
      imageRiddles: { timers: settings.imageRiddles.timers },
      seo: settings.seo,
    };
  }
}
