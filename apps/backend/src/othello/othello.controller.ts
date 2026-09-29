import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { OthelloService } from './othello.service';

class CreateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsInt()
  @IsIn([6, 8, 10])
  size: number;
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
  @IsInt()
  @Min(0)
  @Max(99)
  idx: number;
}

/**
 * Live Othello (plan/games/12) — server-authoritative flip duel. The server
 * recomputes every flip and owns the pass rule, so a client cannot claim discs
 * it did not outflank or dodge a turn it had to take. 3-second poll sync;
 * writes carry the guest token.
 */
@ApiTags('Othello')
@Controller('othello')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class OthelloController {
  constructor(private readonly othello: OthelloService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a match as ⚫ → { code }' })
  create(@Body() dto: CreateDto) {
    return this.othello.create({
      playerName: dto.playerName,
      guestId: dto.guestId,
      size: dto.size,
    });
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as ⚪ (or re-join as ⚫) → the view' })
  join(@Param('code') code: string, @Body() dto: JoinDto) {
    return this.othello.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.othello.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Place a disc — the server computes the flips' })
  move(@Param('code') code: string, @Body() dto: MoveDto) {
    return this.othello.move(code, { guestId: dto.guestId, idx: dto.idx });
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: JoinDto) {
    return this.othello.leave(code, dto.guestId);
  }
}
