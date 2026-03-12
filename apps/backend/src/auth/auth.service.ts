import * as crypto from 'crypto';

import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { BruteForceService } from './brute-force.service';

/**
 * Authentication service handling user registration, login, and validation
 * 
 * @description Core authentication service that manages user registration,
 * password validation, and JWT token generation. Integrates with UsersService
 * for user data management and JwtService for token operations.
 * 
 * @class
 * @example
 * // Inject and use in controllers or other services
 * constructor(private authService: AuthService) {}
 * 
 * const result = await this.authService.login(email, password);
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private bruteForceService: BruteForceService,
  ) { }

  /**
   * Register a new user with email, password, and name
   * 
   * @description Creates a new user account after checking for existing
   * email conflicts. Automatically generates a JWT token upon successful
   * registration for immediate authentication.
   * 
   * @param {string} email - User's email address (must be unique)
   * @param {string} password - Plain text password (will be hashed)
   * @param {string} name - User's display name
   * @returns {Promise<{ user: Partial<User>, token: string }>} User data without password and JWT token
   * @throws {UnauthorizedException} When email is already registered
   * @example
   * const result = await authService.register('user@example.com', 'password123', 'John Doe');
   * // Returns: { user: { id: 'uuid', email: 'user@example.com', name: 'John Doe' }, token: 'jwt-token' }
   */
  private async generateTokens(user: Partial<User>) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    await this.usersService.updateRefreshToken(user.id as string, refreshToken);
    return { token, refreshToken };
  }

  async register(email: string, password: string, name: string): Promise<{ user: { id: string; email: string; name: string; role: string }; token: string; refreshToken: string }> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.usersService.create(email, password, name);
    const tokens = await this.generateTokens(user);

    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens };
  }

  /**
   * Authenticate user with email and password
   * 
   * @description Validates user credentials by checking email existence
   * and password match. Returns a JWT token upon successful authentication.
   * 
   * @param {string} email - User's registered email address
   * @param {string} password - Plain text password to verify
   * @returns {Promise<{ user: Partial<User>, token: string }>} User data without password and JWT token
   * @throws {UnauthorizedException} When email doesn't exist or password is invalid
   * @example
   * const result = await authService.login('user@example.com', 'password123');
   * // Returns: { user: { id: 'uuid', email: 'user@example.com', name: 'John Doe' }, token: 'jwt-token' }
   */
  async login(email: string, password: string): Promise<{ user: { id: string; email: string; name: string; role: string }; token: string; refreshToken: string }> {
    // Check if account is locked due to brute force
    if (await this.bruteForceService.isLockedOut(email)) {
      const remainingAttempts = await this.bruteForceService.getRemainingAttempts(email);
      throw new UnauthorizedException(`Account locked. Too many failed attempts. Try again later.`);
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.bruteForceService.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.usersService.validatePassword(password, user.password);
    if (!isValid) {
      await this.bruteForceService.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Record successful login to reset brute force counter
    await this.bruteForceService.recordSuccess(email);

    const tokens = await this.generateTokens(user);
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens };
  }

  async refresh(refreshToken: string): Promise<{ user: { id: string; email: string; name: string; role: string }; token: string; refreshToken: string }> {
    const user = await this.usersService.findByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const tokens = await this.generateTokens(user);
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens };
  }

  /**
   * Validate a user by ID (used by JWT strategy)
   * 
   * @description Retrieves user data for JWT token validation.
   * Used internally by Passport JWT strategy during authentication.
   * 
   * @param {string} id - User's unique identifier from JWT payload
   * @returns {Promise<User | null>} User entity or null if not found
   * @example
   * const user = await authService.validateUser('user-uuid');
   * // Returns: User entity or null
   */
  async validateUser(id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }
}
