import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { GomokuService } from './gomoku.service';

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

class CreateGomokuDto extends PlayerDto {
  @IsInt()
  @IsIn([11, 15])
  size: number;
}

class MoveDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsInt()
  @Min(0)
  @Max(224) // 15×15
  cell: number;
}

/**
 * Live Gomoku (plan/games/02) — server-authoritative stones, 3-second poll
 * sync from the static game page. Writes carry the guest token like every
 * other guest write.
 */
@ApiTags('Gomoku')
@Controller('gomoku')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class GomokuController {
  constructor(private readonly gomoku: GomokuService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a live match as ⚫ → { code }' })
  create(@Body() dto: CreateGomokuDto) {
    return this.gomoku.create(dto);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as ⚪ (or re-join as ⚫) → the match view' })
  join(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.gomoku.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the authoritative state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.gomoku.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Play a cell — server validates turn + cell' })
  move(@Param('code') code: string, @Body() dto: MoveDto) {
    return this.gomoku.move(code, dto);
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.gomoku.leave(code, dto.guestId);
  }
}
