import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AchievementsService } from './achievements.service';
import { SyncAchievementsDto } from './dto/sync-achievements.dto';

@ApiTags('Achievements')
@Controller('achievements')
@UseGuards(OptionalJwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @_Public()
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Upsert the caller’s achievement unlocks (user or guest attributed)' })
  async sync(@Body() dto: SyncAchievementsDto, @Req() req: any) {
    return this.achievementsService.syncUnlocks(dto, req.user?.id ?? null);
  }

  @_Public()
  @Get('unlocks')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Stored unlocks for the caller (token-bound, else guestId)' })
  async getUnlocks(@Req() req: any, @Query('guestId') guestId?: string) {
    return {
      data: await this.achievementsService.getUnlocks({
        userId: req.user?.id ?? null,
        guestId: guestId ?? null,
      }),
    };
  }
}
