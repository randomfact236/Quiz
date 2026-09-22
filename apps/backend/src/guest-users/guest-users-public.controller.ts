/**
 * ============================================================================
 * Guest Users — public controller
 * ============================================================================
 * Guest identity is a client-issued `guestId` (aiquiz:guest-id), same
 * convention as the comments module. Writes are throttled.
 *
 * The `merge` route is deliberately NOT @_Public: the global JwtAuthGuard
 * requires a signed-in account there, so a visitor can attach their guest
 * likes/comments to the account they just logged into.
 * ============================================================================
 */

import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { _Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GuestUsersService, GuestMergeResult } from './guest-users.service';
import { GuestTokenService } from './guest-token.service';
import { GuestTokenGuard } from './guest-token.guard';

class GuestActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

class GuestTokenRequestDto {
  /**
   * Legacy self-issued id (`guest_…`) from a browser that pre-dates the
   * signed-token scheme: it is signed AS-IS so the visitor's existing
   * likes/comments keep matching. Anything else is ignored and a fresh
   * server-minted id is returned instead.
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  legacyId?: string;
}

@ApiTags('Guest Users')
@Controller('guest-users')
@UseGuards(OptionalJwtAuthGuard)
export class GuestUsersPublicController {
  constructor(
    private readonly guestUsersService: GuestUsersService,
    private readonly guestTokens: GuestTokenService
  ) {}

  /**
   * HARD-03 (SEC-12): issues the server-signed `{guestId, token}` pair every
   * anonymous write must carry. Throttled hard — the issuance rate limit is
   * what makes bulk-forged identities expensive, the HMAC just keeps the
   * pair tamper-proof in storage.
   */
  @Post('token')
  @_Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Issue the signed guest identity pair {guestId, token}' })
  issue(@Body() dto: GuestTokenRequestDto) {
    return this.guestTokens.issue(dto.legacyId ?? null);
  }

  @Post('activity')
  @_Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(GuestTokenGuard)
  @ApiOperation({ summary: 'Heartbeat to keep guest lastActive fresh' })
  async touch(@Body() dto: GuestActivityDto) {
    await this.guestUsersService.updateActivity(dto.guestId);
    return { recorded: true };
  }

  @Post('merge')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(GuestTokenGuard)
  @ApiOperation({
    summary: "Attach this browser's guest likes/comments to the signed-in account (idempotent)",
  })
  async merge(@Body() dto: GuestActivityDto, @Req() req: { user?: { id?: string } }) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Sign-in required to merge guest activity');
    }
    const result: GuestMergeResult = await this.guestUsersService.mergeGuestIntoUser(
      dto.guestId,
      userId
    );
    return { merged: true, ...result };
  }
}
