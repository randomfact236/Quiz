import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { RpsService } from './rockpaperscissors.service';

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

class PickDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsString()
  @IsIn(['R', 'P', 'S'])
  pick: string;
}

/**
 * Live Rock Paper Scissors (plan/games/07) — SIMULTANEOUS picks: the server
 * resolves the round only when both throws are locked and reveals them
 * together, so the second player can never read the first. 3-second poll
 * sync; writes carry the guest token.
 */
@ApiTags('Rock Paper Scissors')
@Controller('rock-paper-scissors')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class RpsController {
  constructor(private readonly rps: RpsService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a match as 🔴 → { code }' })
  create(@Body() dto: PlayerDto) {
    return this.rps.create(dto);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as 🔵 (or re-join as 🔴) → the redacted view' })
  join(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.rps.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the state (pending flags only, 3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.rps.view(code, guestId);
  }

  @Post(':code/pick')
  @_Public()
  @ApiOperation({ summary: 'Lock your throw — both in ⇒ the server reveals' })
  pick(@Param('code') code: string, @Body() dto: PickDto) {
    return this.rps.pick(code, { guestId: dto.guestId, pick: dto.pick });
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.rps.leave(code, dto.guestId);
  }
}
