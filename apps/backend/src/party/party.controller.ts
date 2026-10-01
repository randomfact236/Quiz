import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsDefined,
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
import { PartyService } from './party.service';

class CreatePartyDto {
  @IsIn([
    'quad-oxo',
    'dots-boxes-4p',
    'sos-4p',
    'tri-nim',
    'connect-four-mp',
    'othello-3',
    'quadflip',
    'ultimate-ttt-mp',
    'code-race',
    'notakto-mp',
    'snakes-ladders-mp',
    'memory-flip-mp',
    'ludo-mp',
    'ludo-snakes',
    'checkers-hex',
    'checkers-4p',
    'blokus-4p',
    'dominoes-mp',
    'crazy-eights-mp',
    'yatzy-mp',
    'bulls-race-mp',
    'hangman-relay-mp',
    'pig-dice-mp',
    'chomp-elimination',
    'fleet-royale',
    'sprouts',
    'pente-3',
  ])
  gameSlug: string;

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(4)
  seats?: number;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  tier?: 'easy' | 'medium' | 'hard';
}

class PartyPlayerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

class PartyGuestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

class ConfigureSeatDto extends PartyGuestDto {
  @IsInt()
  @Min(1)
  @Max(3)
  seat: number;

  @IsIn(['bot', 'closed'])
  kind: 'bot' | 'closed';
}

class PartyMoveDto extends PartyGuestDto {
  /**
   * Adapter-defined move payload: number (cell/column/edge) or object
   * ({row,count} for Tri-Nim, {cell,letter} for SOS). Range validation lives
   * in each adapter — the grid sizes differ per game.
   */
  @IsDefined()
  move: number | Record<string, number | string>;
}

/**
 * MP1 party tables (owner decision 2026-09-28) — 3/4 seats, empty seats
 * default to bots, server-authoritative moves via per-game adapters, 3-second
 * poll sync. Writes carry the guest token like every other guest write.
 */
@ApiTags('Party')
@Controller('party')
@UseGuards(OptionalJwtAuthGuard, GuestTokenGuard)
export class PartyController {
  constructor(private readonly party: PartyService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a party table as the host — empty seats become bots' })
  create(@Body() dto: CreatePartyDto) {
    return this.party.create(dto);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Claim the first open bot seat (or re-join)' })
  join(@Param('code') code: string, @Body() dto: PartyPlayerDto) {
    return this.party.join(code, dto);
  }

  @Post(':code/configure')
  @_Public()
  @ApiOperation({ summary: 'Host flips an empty seat bot/closed before start' })
  configure(@Param('code') code: string, @Body() dto: ConfigureSeatDto) {
    return this.party.configure(code, dto);
  }

  @Post(':code/start')
  @_Public()
  @ApiOperation({ summary: 'Host starts the table' })
  start(@Param('code') code: string, @Body() dto: PartyGuestDto) {
    return this.party.start(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll the authoritative table state (3 s cadence)' })
  view(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.party.view(code, guestId);
  }

  @Post(':code/move')
  @_Public()
  @ApiOperation({ summary: 'Play your turn — server validates seat, turn and move' })
  move(@Param('code') code: string, @Body() dto: PartyMoveDto) {
    return this.party.move(code, dto);
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — your seat converts to a bot so the table finishes' })
  leave(@Param('code') code: string, @Body() dto: PartyGuestDto) {
    return this.party.leave(code, dto.guestId);
  }
}
