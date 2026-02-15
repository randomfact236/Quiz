import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

/**
 * Authenticated user interface representing the user object attached to requests
 * 
 * @interface
 */
interface AuthUser {
  /** User's unique identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's name */
  name: string;
  /** User's role (e.g., 'admin', 'user') */
  role: string;
  /** Optional avatar URL */
  avatar?: string;
}

/**
 * Passport validation info interface
 * 
 * @interface
 */
interface PassportInfo {
  /** Error message if validation failed */
  message?: string;
  /** Additional info properties */
  [key: string]: unknown;
}

/**
 * JWT Authentication Guard protecting routes with JWT token validation
 * 
 * @description Extends Passport's AuthGuard to provide JWT-based route protection.
 * Supports public routes via the @Public() decorator. Checks for valid JWT tokens
 * in the Authorization header and attaches user data to the request.
 * 
 * @class
 * @extends {AuthGuard('jwt')}
 * @example
 * // Protect a controller or route
 * @UseGuards(JwtAuthGuard)
 * @Controller('protected')
 * export class ProtectedController {}
 * 
 * // Allow public access to specific routes
 * @Public()
 * @Get('public')
 * publicRoute() { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Creates an instance of JwtAuthGuard
   * 
   * @param {Reflector} reflector - Core reflector for accessing metadata
   */
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determine if the current request is allowed to proceed
   * 
   * @description Checks if the route is marked as public using the @Public()
   * decorator. If public, allows access without authentication. Otherwise,
   * delegates to parent AuthGuard for JWT validation.
   * 
   * @param {ExecutionContext} context - Execution context containing request information
   * @returns {boolean | Promise<boolean> | Observable<boolean>} True if access is granted
   * @example
   * // Guard is applied automatically by @UseGuards decorator
   * const canActivate = await guard.canActivate(executionContext);
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | import('rxjs').Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }

  /**
   * Handle the result of JWT validation
   * 
   * @description Processes the result of JWT token validation. Throws
   * UnauthorizedException if validation fails or returns the authenticated user.
   * 
   * @param {Error | null} err - Error from JWT validation if any
   * @param {unknown} user - Authenticated user data from JWT payload
   * @param {unknown} info - Additional info from Passport strategy
   * @returns {AuthUser} The authenticated user object
   * @throws {UnauthorizedException} When JWT validation fails or no user is found
   * @example
   * // Called automatically by Passport after JWT validation
   * const user = guard.handleRequest(null, { id: 'user-id', email: 'user@example.com' }, null);
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest<TUser = AuthUser>(
    err: Error | null,
    user: unknown,
    info: unknown,
    _context?: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Please login to access this resource');
    }
    return user as TUser;
  }
}
