import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestTokenGuard } from '../guest-users/guest-token.guard';
import { BattleshipService } from './battleship.service';

class ShipDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(0)
  @Max(63)
  cells: number[];
}

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

class FleetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsArray()
  @Type(() => ShipDto)
  fleet: ShipDto[];
}

class FireDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsInt()
  @Min(0)
  @Max(63)
  cell: number;
}

/**
 * Live Battleship Lite (plan/games/04) — player-placed fleets, server-resolved
 * shots, 3-second poll sync from the static game page. Views are redacted per
 * player (the enemy fleet never crosses the API). Writes carry the guest token.
 */
@ApiTags('Battleship')
@Controller('battleship')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class BattleshipController {
  constructor(private readonly bs: BattleshipService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a match as 🔴 → { code }' })
  create(@Body() dto: PlayerDto) {
    return this.bs.create(dto);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join as 🔵 (or re-join as 🔴) → the redacted view' })
  join(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.bs.join(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the redacted state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.bs.view(code, guestId);
  }

  @Post(':code/fleet')
  @_Public()
  @ApiOperation({ summary: 'Submit YOUR fleet (validated server-side)' })
  placeFleet(@Param('code') code: string, @Body() dto: FleetDto) {
    return this.bs.placeFleet(code, {
      guestId: dto.guestId,
      fleet: dto.fleet as { cells: number[] }[],
    });
  }

  @Post(':code/fire')
  @_Public()
  @ApiOperation({ summary: 'Fire one shot — server answers hit/miss (+ sunk length)' })
  fire(@Param('code') code: string, @Body() dto: FireDto) {
    return this.bs.fire(code, { guestId: dto.guestId, cell: dto.cell });
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — abandons the match for both players' })
  leave(@Param('code') code: string, @Body() dto: PlayerDto) {
    return this.bs.leave(code, dto.guestId);
  }
}
