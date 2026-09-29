import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { ChessService } from './chess.service';

class CreateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

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
  @Max(63)
  from: number;

  @IsInt()
  @Min(0)
  @Max(63)
  to: number;

  /** Only on a promotion: which piece the pawn becomes. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  promotion?: number | null;
}

/**
 * Live Chess 9×9 (plan/games/39) — server-authoritative. The server resolves
 * captures, enforces the ko ban, counts the passes and computes the final
 * area score, so a client cannot claim a stone it did not earn, retake a ko
 * immediately, or declare a result. 3-second poll sync; writes carry the guest
 * token.
 */
@ApiTags('Chess')
@Controller('chess')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class ChessController {
  constructor(private readonly chess: ChessService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a match as ⚫ → { code }' })
  create(@Body() dto: CreateDto) {
    return this.chess.create({ playerName: dto.playerName, guestId: dto.guestId });
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as ⚪ (or re-join as ⚫) → the view' })
  join(@Param('code') code: string, @Body() dto: JoinDto) {
    return this.chess.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.chess.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Play a move — the server validates it against the full ruleset' })
  move(@Param('code') code: string, @Body() dto: MoveDto) {
    return this.chess.move(code, {
      guestId: dto.guestId,
      from: dto.from,
      to: dto.to,
      promotion: dto.promotion ?? null,
    });
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: JoinDto) {
    return this.chess.leave(code, dto.guestId);
  }
}
