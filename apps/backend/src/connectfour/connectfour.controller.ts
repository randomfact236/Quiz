import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min, MinLength, MaxLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { ConnectFourService } from './connectfour.service';

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

class MoveDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  column: number;
}

/**
 * Live Connect Four (plan/games/01) — server-authoritative drops (gravity +
 * turn + win resolved here), 3-second poll sync from the static game page.
 * Writes carry the guest token like every other guest write.
 */
@ApiTags('Connect Four')
@Controller('connectfour')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class ConnectFourController {
  constructor(private readonly c4: ConnectFourService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a live match as 🔴 → { code }' })
  create(@Body() dto: PlayerDto) {
    return this.c4.create(dto);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as 🟡 (or re-join as 🔴) → the match view' })
  join(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.c4.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the authoritative state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.c4.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Drop into a column — server applies gravity + resolves' })
  move(@Param('code') code: string, @Body() dto: MoveDto) {
    return this.c4.move(code, dto);
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.c4.leave(code, dto.guestId);
  }
}
