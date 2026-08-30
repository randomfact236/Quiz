import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

/**
 * Optional JWT guard — like JwtAuthGuard but never rejects.
 *
 * Analytics ingest is public (guests track events too), but a logged-in
 * user's Bearer token should still be resolved so events carry the real
 * userId. The global JwtAuthGuard short-circuits on @_Public() routes
 * before Passport runs, so this controller-level guard re-runs the 'jwt'
 * strategy softly: valid token → request.user set, anything else →
 * anonymous, request allowed.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | import('rxjs').Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) {
      // Route is already protected by the global guard — nothing to soften.
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (!request?.headers?.authorization) {
      return true;
    }
    return super.canActivate(context);
  }

  // err is intentionally unused: never throw — an invalid/expired token just
  // means "treat as guest"; _info is underscore-prefixed as unused.
  handleRequest<TUser = unknown>(err: Error | null, user: unknown, _info: unknown): TUser {
    return (user ?? undefined) as TUser;
  }
}
