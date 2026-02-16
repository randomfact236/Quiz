import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';

/**
 * JWT payload interface representing decoded token data
 * 
 * @interface
 */
interface JwtPayload {
  /** User's unique identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's role (e.g., 'admin', 'user') */
  role: string;
}

/**
 * JWT Strategy for Passport authentication
 * 
 * @description Implements Passport JWT strategy for extracting and validating
 * JWT tokens from Authorization headers. Validates token signature using the
 * configured JWT secret and loads user data from the database.
 * 
 * @class
 * @extends {PassportStrategy(Strategy)}
 * @example
 * // Strategy is automatically registered by AuthModule
 * // Used by JwtAuthGuard for route protection
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Creates an instance of JwtStrategy
   * 
   * @param {ConfigService} configService - Service for accessing configuration values
   * @param {AuthService} authService - Service for user validation
   */
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT payload and return user data
   * 
   * @description Called by Passport after JWT signature validation.
   * Loads the full user entity from the database using the ID from the JWT payload.
   * The returned user object is attached to the request for use in controllers.
   * 
   * @param {JwtPayload} payload - Decoded JWT payload containing user claims
   * @returns {Promise<User | null>} User entity from database or null
   * @example
   * // Automatically called by Passport on protected routes
   * const user = await strategy.validate({ id: 'user-id', email: 'user@example.com', role: 'user' });
   * // Returns: User entity that gets attached to request.user
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.authService.validateUser(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }
}
