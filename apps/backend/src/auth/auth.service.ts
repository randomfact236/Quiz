import * as crypto from 'crypto';
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { BruteForceService } from './brute-force.service';
import { CacheService } from '../common/cache/cache.service';
import { EmailService } from '../common/services/email.service';
import { AnalyticsService } from '../analytics/analytics.service';

/** One-time OAuth codes live 60 seconds and are deleted on first use. */
const OAUTH_CODE_TTL_S = 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private bruteForceService: BruteForceService,
    private cacheService: CacheService,
    private emailService: EmailService,
    private analyticsService: AnalyticsService
  ) {}

  private async generateTokens(user: Partial<User>) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    await this.usersService.updateRefreshToken(user.id as string, refreshToken);
    return { token, refreshToken };
  }

  async register(
    email: string,
    password: string,
    name: string
  ): Promise<{
    user: { id: string; email: string; name: string; role: string };
    token: string;
    refreshToken: string;
  }> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const user = await this.usersService.create(email, password, name);
    const tokens = await this.generateTokens(user);
    // Verification link goes out asynchronously; registration never blocks on
    // email delivery (the link is logged in dev when Resend is unconfigured).
    void this.sendVerificationEmail(user).catch(() => undefined);
    // Analytics plan §2.2 — no PII, userId only. record() swallows its own errors.
    void this.analyticsService.record({
      eventName: 'user_registered',
      module: 'site',
      userId: user.id,
      properties: { method: 'email' },
    });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{
    user: { id: string; email: string; name: string; role: string };
    token: string;
    refreshToken: string;
  }> {
    if (await this.bruteForceService.isLockedOut(email)) {
      void this.analyticsService.record({ eventName: 'login_locked', module: 'site' });
      throw new UnauthorizedException(`Account locked. Too many failed attempts. Try again later.`);
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.bruteForceService.recordFailedAttempt(email);
      void this.analyticsService.record({ eventName: 'login_failed', module: 'site' });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.usersService.validatePassword(password, user.password);
    if (!isValid) {
      await this.bruteForceService.recordFailedAttempt(email);
      void this.analyticsService.record({ eventName: 'login_failed', module: 'site' });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.bruteForceService.recordSuccess(email);
    const tokens = await this.generateTokens(user);
    // lastActive was persisted but never updated anywhere (plan audit §2.1).
    void this.usersService.updateLastActive(user.id).catch(() => undefined);
    void this.analyticsService.record({
      eventName: 'user_login',
      module: 'site',
      userId: user.id,
      properties: { method: 'email' },
    });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<{
    user: { id: string; email: string; name: string; role: string };
    token: string;
    refreshToken: string;
  }> {
    const user = await this.usersService.findByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    // Rotation: issuing a new pair invalidates the presented token (it is
    // overwritten in the DB), so a replayed token fails the lookup above.
    const tokens = await this.generateTokens(user);
    void this.usersService.updateLastActive(user.id).catch(() => undefined);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  /**
   * Server-side revocation for logout. Idempotent: an unknown token still
   * returns success so logout never leaks whether a token was valid.
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    const user = await this.usersService.findByRefreshToken(refreshToken);
    if (user) {
      await this.usersService.revokeRefreshToken(user.id);
    }
    return { message: 'Logged out' };
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await this.usersService.updateEmailVerificationToken(user.id, hashedToken, expires);
    const result = await this.emailService.sendVerificationEmail(user.email, token, user.name);
    if (!result.success) {
      throw new BadRequestException('Failed to send verification email');
    }
  }

  /** Consumes a hashed one-time token and flips emailVerified. */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByEmailVerificationToken(hashedToken);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }
    await this.usersService.markEmailVerified(user.id);
    return { message: 'Email verified successfully' };
  }

  /** Anti-enumeration: same response whether or not the account exists. */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.emailVerified) {
      return {
        message:
          'If an account with that email exists and is unverified, a verification link has been sent.',
      };
    }
    try {
      await this.sendVerificationEmail(user);
    } catch {
      // Swallow send failures to keep the response uniform (anti-enumeration).
    }
    return {
      message:
        'If an account with that email exists and is unverified, a verification link has been sent.',
    };
  }

  async validateUser(id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  /**
   * OAuth login results are handed to the browser as a single-use,
   * 60-second code instead of token-in-URL (plan/01-user-accounts.md P1 #2).
   * The code is stored hashed; the raw value only ever appears in the
   * one redirect URL and is consumed by exchangeOAuthCode().
   */
  async createOAuthCode(result: {
    user: { id: string; email: string; name: string; role: string };
    token: string;
    refreshToken: string;
  }): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    const key = `oauth:code:${crypto.createHash('sha256').update(code).digest('hex')}`;
    await this.cacheService.set(key, result, OAUTH_CODE_TTL_S);
    return code;
  }

  async exchangeOAuthCode(code: string): Promise<{
    user: { id: string; email: string; name: string; role: string };
    token: string;
    refreshToken: string;
  }> {
    const key = `oauth:code:${crypto.createHash('sha256').update(code).digest('hex')}`;
    const cached = await this.cacheService.get<{
      user: { id: string; email: string; name: string; role: string };
      token: string;
      refreshToken: string;
    }>(key);
    // Single-use: consume before validating so a replay always misses.
    await this.cacheService.del(key);
    if (!cached) {
      throw new UnauthorizedException('Invalid or expired OAuth code');
    }
    return cached;
  }

  async googleLogin(googleData: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<{
    user: { id: string; email: string; name: string; role: string };
    token: string;
    refreshToken: string;
  }> {
    let user = await this.usersService.findByGoogleId(googleData.googleId);
    let isNewUser = false;

    if (!user) {
      const existingEmailUser = await this.usersService.findByEmail(googleData.email);
      if (existingEmailUser) {
        await this.usersService.updateGoogleId(existingEmailUser.id, googleData.googleId);
        user = await this.usersService.findById(existingEmailUser.id);
      } else {
        user = await this.usersService.createWithGoogle(
          googleData.email,
          googleData.name,
          googleData.googleId,
          googleData.avatar
        );
        isNewUser = true;
      }
    }

    const tokens = await this.generateTokens(user);
    void this.analyticsService.record({
      eventName: isNewUser ? 'user_registered' : 'user_login',
      module: 'site',
      userId: user.id,
      properties: { method: 'google' },
    });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we don't reveal it
    if (!user) {
      return {
        message: 'If an account with that email exists, we have sent a password reset link.',
      };
    }
    void this.analyticsService.record({
      eventName: 'password_reset_requested',
      module: 'site',
      userId: user.id,
    });

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed token in database
    await this.usersService.updatePasswordResetToken(user.id, hashedToken, resetExpires);

    // Send email
    const result = await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name
    );

    if (!result.success) {
      // NEVER surface send failures differentially — a 400 here would let
      // attackers enumerate registered emails (nonexistent addresses always
      // get the success message below). Log server-side and stay constant.
      this.logger.error(
        `Password reset email failed for an existing account (token was stored; user can retry)`
      );
    }

    return { message: 'If an account with that email exists, we have sent a password reset link.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this reset token that hasn't expired
    const user = await this.usersService.findByPasswordResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    // Update password
    await this.usersService.updatePassword(user.id, newPassword);

    // Clear reset token
    await this.usersService.clearPasswordResetToken(user.id);

    void this.analyticsService.record({
      eventName: 'password_reset_completed',
      module: 'site',
      userId: user.id,
    });

    return {
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }
}
