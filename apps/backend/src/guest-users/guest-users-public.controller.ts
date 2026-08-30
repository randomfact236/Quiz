/**
 * ============================================================================
 * Guest Users — public controller
 * ============================================================================
 * Guest identity is a client-issued `guestId` (aiquiz:guest-id), same
 * convention as the comments module. Writes are throttled.
 * ============================================================================
 */

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestUsersService } from './guest-users.service';

class GuestActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

@ApiTags('Guest Users')
@Controller('guest-users')
@UseGuards(OptionalJwtAuthGuard)
export class GuestUsersPublicController {
  constructor(private readonly guestUsersService: GuestUsersService) {}

  @Post('activity')
  @_Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Heartbeat to keep guest lastActive fresh' })
  async touch(@Body() dto: GuestActivityDto) {
    await this.guestUsersService.updateActivity(dto.guestId);
    return { recorded: true };
  }
}
