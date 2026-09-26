/**
 * ============================================================================
 * guest-token.service.ts — server-signed guest identity (HARD-03, SEC-12)
 * ============================================================================
 * The client-issued `guestId` was a bearer secret authorizing guest writes
 * (likes, comments, merge): anyone who learned or guessed it could act as
 * that guest. This service binds guest identity to a server-signed token:
 *
 *   token = HMAC-SHA256(GUEST_TOKEN_SECRET, guestId)   (base64url, 43 chars)
 *
 * `POST /guest-users/token` issues the pair, signing either a freshly
 * server-minted id or an EXISTING legacy `guest_…` id — the one-time
 * migration path that lets real visitors keep the likes/comments already
 * stored under their self-issued id. Issuance is IP-throttled in the
 * controller: that rate limit, not the HMAC alone, is what makes mass
 * forgery expensive. Verification is constant-time.
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const LEGACY_PREFIX = 'guest_';
const SERVER_ID_PREFIX = 'srv_';
const SERVER_ID_BYTES = 16;
const MAX_ID_LENGTH = 64;

@Injectable()
export class GuestTokenService {
  private readonly secret: string;

  constructor() {
    const configured = process.env['GUEST_TOKEN_SECRET'] || process.env['JWT_SECRET'];
    if (configured) {
      this.secret = configured;
      return;
    }
    // Previously this fell through to a hardcoded literal in EVERY
    // environment, so a deploy that set neither variable signed guest
    // identities with a publicly-known string from the source tree. The
    // production env validator catches a missing JWT_SECRET, but this service
    // is constructed in contexts that do not go through it, and neither
    // .env nor apps/backend/.env sets GUEST_TOKEN_SECRET — so the common local
    // setup was signing with a guessable dev value. Refuse outside dev instead.
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(
        'GUEST_TOKEN_SECRET (or JWT_SECRET) must be set in production — refusing to sign guest identities with a fallback secret.'
      );
    }
    this.secret = 'dev-only-guest-token-secret';
  }

  sign(guestId: string): string {
    return createHmac('sha256', this.secret).update(guestId).digest('base64url');
  }

  verify(guestId: string, token: string): boolean {
    if (!guestId || !token) return false;
    const expected = Buffer.from(this.sign(guestId));
    const provided = Buffer.from(token);
    return expected.length === provided.length && timingSafeEqual(expected, provided);
  }

  /**
   * Issue a signed pair. Without a requested id, mints a server-side random
   * one (`srv_…`). With a legacy-shaped requested id, signs THAT id so the
   * visitor's existing rows keep matching. Any other requested value is
   * ignored (fresh id minted) — the server never signs arbitrary strings.
   */
  issue(requestedId?: string | null): { guestId: string; token: string } {
    const guestId =
      requestedId && this.isLegacyShape(requestedId.trim())
        ? requestedId.trim()
        : `${SERVER_ID_PREFIX}${randomBytes(SERVER_ID_BYTES).toString('base64url')}`;
    return { guestId, token: this.sign(guestId) };
  }

  private isLegacyShape(id: string): boolean {
    return (
      id.startsWith(LEGACY_PREFIX) && id.length > LEGACY_PREFIX.length && id.length <= MAX_ID_LENGTH
    );
  }
}
