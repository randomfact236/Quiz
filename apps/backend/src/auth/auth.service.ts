import * as crypto from 'crypto';
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { BruteForceService } from './brute-force.service';
import { EmailService } from '../common/services/email.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private bruteForceService: BruteForceService,
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

  async validateUser(id: string): Promise<User | null> {
    return this.usersService.findById(id);
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
      throw new BadRequestException('Failed to send reset email. Please try again later.');
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
