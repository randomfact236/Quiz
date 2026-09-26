/**
 * ============================================================================
 * guest-token.guard.ts — enforces the server-signed guest pair (HARD-03)
 * ============================================================================
 * Apply to any route where a guestId scopes access — both writes (like,
 * comment create/delete, activity, merge) and guest-scoped READS (session
 * history, achievements, "did I already like this", "my comments"). Signing
 * the writes alone left the reads open: an unauthenticated caller who learned
 * a guestId (it travels in query strings, so it leaks via Referer and access
 * logs) could read that visitor's history. The guard is now symmetric.
 *
 * Token transport, in order of preference:
 *   1. `X-Guest-Token` header — preferred. Keeps the secret out of the URL,
 *      where it would be captured by access logs and Referer headers.
 *   2. `body.guestToken` — request-body writes (JSON POST/PATCH).
 *   3. `query.guestToken` — legacy clients; still honoured so an older
 *      cached tab keeps working.
 *
 * Routes with no guestId in body/query pass through untouched: those are
 * either genuinely public reads or signed-in flows, where identity comes from
 * the JWT.
 * ============================================================================
 */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { GuestTokenService } from './guest-token.service';

export const GUEST_TOKEN_HEADER = 'x-guest-token';

@Injectable()
export class GuestTokenGuard implements CanActivate {
  constructor(private readonly guestTokens: GuestTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const body = request.body ?? {};
    const query = request.query ?? {};
    const guestId = body.guestId ?? query.guestId;
    if (!guestId) return true;
    const headerToken = request.headers?.[GUEST_TOKEN_HEADER];
    const token = String(
      (Array.isArray(headerToken) ? headerToken[0] : headerToken) ??
        body.guestToken ??
        query.guestToken ??
        ''
    );
    if (!this.guestTokens.verify(String(guestId), token)) {
      throw new ForbiddenException('Missing or invalid guest token');
    }
    return true;
  }
}
