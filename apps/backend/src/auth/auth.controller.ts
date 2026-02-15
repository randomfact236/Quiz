import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

/**
 * Authentication response type
 */
interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

/**
 * Authentication controller handling user registration and login
 * 
 * @description Provides endpoints for user authentication including
 * registration of new users and login for existing users. Returns
 * JWT tokens upon successful authentication.
 * 
 * @class
 * @example
 * // Register a new user
 * POST /auth/register
 * { "email": "user@example.com", "password": "secret", "name": "John" }
 * 
 * // Login existing user
 * POST /auth/login
 * { "email": "user@example.com", "password": "secret" }
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  /**
   * Creates an instance of AuthController
   * 
   * @param {AuthService} authService - The authentication service for handling business logic
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user account
   * 
   * @description Creates a new user with the provided credentials and returns
   * the user data along with a JWT token for immediate authentication.
   * 
   * @param {string} email - User's email address (unique identifier)
   * @param {string} password - User's password (will be hashed)
   * @param {string} name - User's display name
   * @returns {Promise<AuthResponse>} User data and JWT token
   * @throws {UnauthorizedException} When email already exists
   * @example
   * const result = await authController.register('user@example.com', 'password', 'John');
   * // Returns: { user: { id, email, name }, token: 'eyJhbGciOiJIUzI1NiIs...' }
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('name') name: string,
  ): Promise<AuthResponse> {
    return this.authService.register(email, password, name);
  }

  /**
   * Authenticate an existing user
   * 
   * @description Validates user credentials and returns a JWT token
   * upon successful authentication.
   * 
   * @param {string} email - User's registered email address
   * @param {string} password - User's password
   * @returns {Promise<AuthResponse>} User data and JWT token
   * @throws {UnauthorizedException} When credentials are invalid
   * @example
   * const result = await authController.login('user@example.com', 'password');
   * // Returns: { user: { id, email, name }, token: 'eyJhbGciOiJIUzI1NiIs...' }
   */
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<AuthResponse> {
    return this.authService.login(email, password);
  }
}
