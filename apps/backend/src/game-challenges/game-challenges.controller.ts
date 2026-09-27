import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { GameChallengesService, GameRunInput } from './game-challenges.service';

class RunDto implements GameRunInput {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400_000)
  durationMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  moves?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  detail?: string;
}

class CreateChallengeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(48)
  gameSlug: string;

  @IsObject()
  payload: Record<string, unknown>;

  @IsObject()
  @ValidateNested()
  @Type(() => RunDto)
  run: RunDto;

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

class GuestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

class SubmitRunDto extends GuestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsObject()
  @ValidateNested()
  @Type(() => RunDto)
  run: RunDto;
}

/**
 * Async game challenges (plan/18 phase 4). The games' CSP allows calls to
 * this controller's endpoints from /games/<slug>/ pages; writes carry the
 * guest token like every other guest write.
 */
@ApiTags('Game Challenges')
@Controller('game-challenges')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class GameChallengesController {
  constructor(private readonly challenges: GameChallengesService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a challenge from a finished run → { token }' })
  create(@Body() dto: CreateChallengeDto) {
    return this.challenges.create(dto);
  }

  @Get(':token')
  @_Public()
  @ApiOperation({ summary: 'Challenge view (payload + runs; no guest ids)' })
  view(@Param('token') token: string) {
    return this.challenges.view(token);
  }

  @Post(':token/runs')
  @_Public()
  @ApiOperation({ summary: 'Accept — post your own run (one per guest)' })
  submitRun(@Param('token') token: string, @Body() dto: SubmitRunDto) {
    return this.challenges.submitRun(token, dto);
  }

  @Get(':token/runs/mine')
  @_Public()
  @ApiOperation({ summary: 'Your own previous run for this challenge' })
  myRun(@Param('token') token: string, @Query('guestId') guestId: string) {
    return this.challenges.myRun(token, guestId);
  }
}
