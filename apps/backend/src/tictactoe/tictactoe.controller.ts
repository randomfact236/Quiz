import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { TictactoeService } from './tictactoe.service';

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

class CreateTttDto extends PlayerDto {
  @IsBoolean()
  misere: boolean;
}

class MoveDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsInt()
  @Min(0)
  @Max(8)
  cell: number;
}

/**
 * Live tic-tac-toe (plan/18 phase 5) — server-authoritative moves, 3-second
 * poll sync from the static game page. Writes carry the guest token like
 * every other guest write.
 */
@ApiTags('Tic Tac Toe')
@Controller('tictactoe')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class TictactoeController {
  constructor(private readonly ttt: TictactoeService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a live match as X → { code }' })
  create(@Body() dto: CreateTttDto) {
    return this.ttt.create(dto);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as O (or re-join as X) → the match view' })
  join(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.ttt.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the authoritative state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.ttt.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Play a cell — server validates turn + cell' })
  move(@Param('code') code: string, @Body() dto: MoveDto) {
    return this.ttt.move(code, dto);
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.ttt.leave(code, dto.guestId);
  }
}
