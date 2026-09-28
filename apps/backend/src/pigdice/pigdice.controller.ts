import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { PigDiceService } from './pigdice.service';

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
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(100)
  target?: number;
}

class MoveDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsString()
  @IsIn(['roll', 'hold'])
  action: string;
}

/**
 * Live Pig Dice (plan/games/05) — the SERVER rolls every die (crypto RNG);
 * clients only send roll/hold, so a duel outcome is provably fair. 3-second
 * poll sync from the static game page; writes carry the guest token.
 */
@ApiTags('Pig Dice')
@Controller('pig-dice')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class PigDiceController {
  constructor(private readonly pig: PigDiceService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a match as 🔴 (target 50 quick | 100 standard)' })
  create(@Body() dto: CreateMatchDto) {
    return this.pig.create(dto);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as 🔵 (or re-join as 🔴) → the match view' })
  join(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.pig.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the authoritative state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.pig.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Roll or hold — the server produces the die' })
  move(@Param('code') code: string, @Body() dto: MoveDto) {
    return this.pig.move(code, { guestId: dto.guestId, action: dto.action });
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.pig.leave(code, dto.guestId);
  }
}
