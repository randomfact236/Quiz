import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      // Fail CLOSED. This used to `return true`, which meant a controller that
      // applied RolesGuard but forgot its @Roles decorator silently authorized
      // ANY signed-in user — the guard existed but enforced nothing. Every
      // current caller declares @Roles at class or method level (verified), so
      // this branch is only reachable by a misconfiguration; it should fail
      // loudly at the route, not quietly open it.
      throw new ForbiddenException(
        'Access denied. RolesGuard is applied without a @Roles() requirement — declare the roles or drop the guard.'
      );
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role: string) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
