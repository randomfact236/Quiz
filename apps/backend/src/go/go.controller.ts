import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { GoService } from './go.service';

class CreateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsNumber()
  @IsIn([0, 5.5])
  komi: number;
}

class JoinDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

class MoveDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  /** Square index in the size×size board. */
  /** The point to play, or null for a legal PASS. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  idx?: number | null;
}

/**
 * Live Go 9×9 (plan/games/39) — server-authoritative. The server resolves
 * captures, enforces the ko ban, counts the passes and computes the final
 * area score, so a client cannot claim a stone it did not earn, retake a ko
 * immediately, or declare a result. 3-second poll sync; writes carry the guest
 * token.
 */
@ApiTags('Go')
@Controller('go')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class GoController {
  constructor(private readonly go: GoService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a match as ⚫ → { code }' })
  create(@Body() dto: CreateDto) {
    return this.go.create({
      playerName: dto.playerName,
      guestId: dto.guestId,
      komi: dto.komi,
    });
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as ⚪ (or re-join as ⚫) → the view' })
  join(@Param('code') code: string, @Body() dto: JoinDto) {
    return this.go.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.go.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Play a point, or pass — the server resolves captures, ko and the score' })
  move(@Param('code') code: string, @Body() dto: MoveDto) {
    return this.go.move(code, { guestId: dto.guestId, idx: dto.idx ?? null });
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: JoinDto) {
    return this.go.leave(code, dto.guestId);
  }
}
