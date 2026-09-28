import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { DotsAndBoxesService } from './dotsandboxes.service';

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

class CreateMatchDto extends PlayerDto {
  @IsInt()
  @IsIn([3, 4, 5])
  size: number;
}

class MoveDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsInt()
  @Min(0)
  @Max(60) // 5×5 board has 60 edges
  edge: number;
}

/**
 * Live Dots and Boxes (plan/games/03) — server-authoritative lines, box
 * claims and the extra turn, 3-second poll sync from the static game page.
 * Writes carry the guest token like every other guest write.
 */
@ApiTags('Dots and Boxes')
@Controller('dots-and-boxes')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class DotsAndBoxesController {
  constructor(private readonly dbb: DotsAndBoxesService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a live match as 🔴 → { code }' })
  create(@Body() dto: CreateMatchDto) {
    return this.dbb.create(dto);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as 🔵 (or re-join as 🔴) → the match view' })
  join(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.dbb.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the authoritative state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.dbb.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Draw a line — server resolves claims + the extra turn' })
  move(@Param('code') code: string, @Body() dto: MoveDto) {
    return this.dbb.move(code, dto);
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.dbb.leave(code, dto.guestId);
  }
}
