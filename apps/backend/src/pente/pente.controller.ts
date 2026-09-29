import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { PenteService } from './pente.service';

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
  @IsIn([15, 19])
  size: number;

  @IsInt()
  @IsIn([3, 5])
  target: number;
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
  @Max(360)
  idx: number;
}

/**
 * Live Pente (plan/games/23) — server-authoritative five-in-a-row with pair
 * captures. The server resolves every capture and both win conditions, so a
 * client cannot claim a pair it did not flank nor decide that it won.
 * 3-second poll sync; writes carry the guest token.
 */
@ApiTags('Pente')
@Controller('pente')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class PenteController {
  constructor(private readonly pente: PenteService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a match as ⚫ → { code }' })
  create(@Body() dto: CreateDto) {
    return this.pente.create({
      playerName: dto.playerName,
      guestId: dto.guestId,
      size: dto.size,
      // the capture target is chosen in the lobby — dropping it here made every
      // online match silently play at the default 5 pairs
      target: dto.target,
    });
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as ⚪ (or re-join as ⚫) → the view' })
  join(@Param('code') code: string, @Body() dto: JoinDto) {
    return this.pente.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.pente.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Place a stone — the server resolves the capture' })
  move(@Param('code') code: string, @Body() dto: MoveDto) {
    return this.pente.move(code, { guestId: dto.guestId, idx: dto.idx });
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: JoinDto) {
    return this.pente.leave(code, dto.guestId);
  }
}
