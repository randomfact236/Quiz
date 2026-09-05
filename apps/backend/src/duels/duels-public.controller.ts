import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean,
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
import { DuelsService } from './duels.service';

class CreateDuelDto {
  @IsString()
  @IsNotEmpty()
  level: string;

  @IsInt()
  @Min(3)
  @Max(20)
  questionCount: number;

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;

  /** Targeted challenge — creates a pending invite for this guest. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  challengeGuestId?: string | null;
}

class JoinDuelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  playerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

class GuestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

class ProgressDto extends GuestDto {
  @IsInt()
  @Min(0)
  completed: number;
}

class AnswerDto extends GuestDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  selected: string;
}

class DisplayNameDto extends GuestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  displayName: string;
}

class ShowInListDto extends GuestDto {
  @IsBoolean()
  showInList: boolean;
}

@ApiTags('Duels')
@Controller('duels')
@UseGuards(OptionalJwtAuthGuard)
export class DuelsPublicController {
  constructor(private readonly duels: DuelsService) {}

  @Post()
  @_Public()
  @ApiOperation({ summary: 'Create a duel match (optionally targeting a guest)' })
  create(@Body() dto: CreateDuelDto) {
    return this.duels.createMatch(dto);
  }

  @Get('invites')
  @_Public()
  @ApiOperation({ summary: 'Pending challenges for a guest (polled)' })
  invites(@Query('guestId') guestId: string) {
    return this.duels.pendingInvites(guestId);
  }

  @Post(':code/join')
  @_Public()
  @ApiOperation({ summary: 'Join a waiting match by code (deep link or manual)' })
  join(@Param('code') code: string, @Body() dto: JoinDuelDto) {
    return this.duels.joinByCode(code, dto);
  }

  @Get(':code')
  @_Public()
  @ApiOperation({ summary: 'Poll match state + opponent progress (3 s cadence)' })
  poll(@Param('code') code: string, @Query('guestId') guestId: string) {
    return this.duels.pollMatch(code, guestId);
  }

  @Post(':code/start')
  @_Public()
  @ApiOperation({ summary: 'Mark own run started' })
  start(@Param('code') code: string, @Body() dto: GuestDto) {
    return this.duels.recordProgress(code, dto.guestId, 0);
  }

  @Post(':code/progress')
  @_Public()
  @ApiOperation({ summary: 'Update own completed count (leave heartbeat)' })
  progress(@Param('code') code: string, @Body() dto: ProgressDto) {
    return this.duels.recordProgress(code, dto.guestId, dto.completed);
  }

  @Post(':code/answer')
  @_Public()
  @ApiOperation({ summary: 'Submit a pick — server grades, answers never leave the server' })
  answer(@Param('code') code: string, @Body() dto: AnswerDto) {
    return this.duels.gradeAnswer(code, dto.guestId, {
      questionId: dto.questionId,
      selected: dto.selected,
    });
  }

  @Post(':code/finish')
  @_Public()
  @ApiOperation({ summary: 'Finish own run — server computes results' })
  finish(@Param('code') code: string, @Body() dto: GuestDto) {
    return this.duels.finishMatch(code, dto.guestId);
  }

  @Post(':code/leave')
  @_Public()
  @ApiOperation({ summary: 'Leave — voids the match for both players' })
  leave(@Param('code') code: string, @Body() dto: GuestDto) {
    return this.duels.leaveMatch(code, dto.guestId);
  }
}

@ApiTags('Presence')
@Controller('presence')
@UseGuards(OptionalJwtAuthGuard)
export class PresenceController {
  constructor(private readonly duels: DuelsService) {}

  @Get('summary')
  @_Public()
  @ApiOperation({ summary: 'Guests with a heartbeat in the last 60 s' })
  summary() {
    return this.duels.onlineSummary();
  }

  @Get('players')
  @_Public()
  @ApiOperation({ summary: 'Online, challengeable players (nicknames only)' })
  players() {
    return this.duels.onlinePlayers();
  }
}

@ApiTags('Guest Users')
@Controller('guest-users')
@UseGuards(OptionalJwtAuthGuard)
export class GuestPresenceController {
  constructor(private readonly duels: DuelsService) {}

  @Post('display-name')
  @_Public()
  @ApiOperation({ summary: 'Set the nickname shown in duels and the players list' })
  setDisplayName(@Body() dto: DisplayNameDto) {
    return this.duels.setDisplayName(dto.guestId, dto.displayName);
  }

  @Post('show-in-list')
  @_Public()
  @ApiOperation({ summary: 'Opt out of (or back into) the challengeable players list' })
  setShowInList(@Body() dto: ShowInListDto) {
    return this.duels.setShowInList(dto.guestId, dto.showInList);
  }
}
