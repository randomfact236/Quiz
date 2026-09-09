import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Marks OAuth initiations coming from the mobile app so the callback can
 * redirect the one-time code to aiquiz://auth/callback instead of the web
 * login page. The marker is a short-lived cookie on the API origin — the
 * Google round-trip stays on this origin, so the callback sees it.
 */
@Injectable()
export class OAuthPlatformMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.query.platform === 'mobile') {
      res.cookie('oauth_platform', 'mobile', {
        maxAge: 10 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      // Security (security-audit-2026-09-09.md A4): bind the one-time code to a
      // nonce the app generates and keeps in memory. A malicious app that
      // hijacks the aiquiz:// redirect gets the code but not the nonce, and
      // POST /auth/oauth/exchange rejects the mismatch.
      const nonce = req.query.nonce;
      if (typeof nonce === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(nonce)) {
        res.cookie('oauth_nonce', nonce, {
          maxAge: 10 * 60 * 1000,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        });
      }
    }
    next();
  }
}
