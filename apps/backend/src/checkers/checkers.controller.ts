import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { CheckersService } from './checkers.service';

class PlayerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

class StepDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  /** Square index 0–31 of the 32 playable squares (see core.js). */
  @IsInt()
  @Min(0)
  @Max(31)
  from: number;

  @IsInt()
  @Min(0)
  @Max(31)
  to: number;
}

/**
 * Live Checkers (plan/games/06) — server-authoritative 8×8 duel. A move is
 * ONE step (a slide or a single jump), so the server holds a multi-jump chain
 * open itself: neither client can shorten a chain, skip a forced capture, or
 * claim a capture that never happened. 3-second poll sync; writes carry the
 * guest token.
 */
@ApiTags('Checkers')
@Controller('checkers')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class CheckersController {
  constructor(private readonly checkers: CheckersService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a match as 🔴 → { code }' })
  create(@Body() dto: PlayerDto) {
    return this.checkers.create(dto);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as ⚫ (or re-join as 🔴) → the redacted view' })
  join(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.checkers.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.checkers.view(code, guestId);
  }

  @Post(':code/step')
  @_Public()
  @ApiOperation({ summary: 'Play one step — the server validates and continues chains' })
  step(@Param('code') code: string, @Body() dto: StepDto) {
    return this.checkers.step(code, { guestId: dto.guestId, from: dto.from, to: dto.to });
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.checkers.leave(code, dto.guestId);
  }
}
