/**
 * ============================================================================
 * guest-token.guard.ts — enforces the server-signed guest pair (HARD-03)
 * ============================================================================
 * Apply to any route where a guestId authorizes a write (like, comment
 * create/delete, activity, merge). Reads stay open; routes without any
 * guestId in body/query pass through untouched (those are rejected
 * downstream where identity is actually required — e.g. logged-in flows).
 * ============================================================================
 */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { GuestTokenService } from './guest-token.service';

@Injectable()
export class GuestTokenGuard implements CanActivate {
  constructor(private readonly guestTokens: GuestTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const body = request.body ?? {};
    const query = request.query ?? {};
    const guestId = body.guestId ?? query.guestId;
    if (!guestId) return true;
    const token = String(body.guestToken ?? query.guestToken ?? '');
    if (!this.guestTokens.verify(String(guestId), token)) {
      throw new ForbiddenException('Missing or invalid guest token');
    }
    return true;
  }
}
