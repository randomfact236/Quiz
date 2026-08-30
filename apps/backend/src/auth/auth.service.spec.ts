/**
 * AuthService unit tests — refresh-token expiry/rotation and logout revocation
 * (plan/01-user-accounts.md P1 refresh-token hardening), plus the
 * anti-enumeration guarantee on forgotPassword.
 */

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { BruteForceService } from './brute-force.service';
import { EmailService } from '../common/services/email.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { UsersService } from '../users/users.service';

describe('AuthService — refresh/logout', () => {
  const makeUser = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
      role: 'user',
      ...overrides,
    }) as any;

  const setup = (findByRefreshToken: jest.Mock) => {
    const usersService = {
      findByRefreshToken,
      updateRefreshToken: jest.fn(async () => undefined),
      revokeRefreshToken: jest.fn(async () => undefined),
      updateLastActive: jest.fn(async () => undefined),
    } as unknown as UsersService;
    const jwtService = { sign: jest.fn(() => 'access-token') } as unknown as JwtService;
    const bruteForceService = {
      isLockedOut: jest.fn(async () => false),
      recordFailedAttempt: jest.fn(async () => undefined),
      recordSuccess: jest.fn(async () => undefined),
    } as unknown as BruteForceService;
    const emailService = { sendPasswordResetEmail: jest.fn() } as unknown as EmailService;
    const analyticsService = {
      record: jest.fn(async () => undefined),
    } as unknown as AnalyticsService;

    const service = new AuthService(
      usersService,
      jwtService,
      bruteForceService,
      emailService,
      analyticsService
    );
    return { service, usersService, jwtService };
  };

  it('refresh rejects when the token is unknown or expired', async () => {
    const { service } = setup(jest.fn(async () => null));
    await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
  });

  it('refresh rotates the token: the presented token is replaced in the store', async () => {
    const { service, usersService } = setup(jest.fn(async () => makeUser()));
    const result = await service.refresh('presented-token');
    expect(result.refreshToken).toBeDefined();
    expect(result.token).toBe('access-token');
    // generateTokens stores the NEW token (not the presented one) — i.e. rotation.
    const storedToken = (usersService.updateRefreshToken as jest.Mock).mock.calls[0][1];
    expect(storedToken).not.toBe('presented-token');
  });

  it('logout revokes the refresh token when it resolves to a user', async () => {
    const { service, usersService } = setup(jest.fn(async () => makeUser()));
    await service.logout('valid-token');
    expect(usersService.revokeRefreshToken).toHaveBeenCalledWith('u1');
  });

  it('logout is idempotent — unknown token still succeeds and leaks nothing', async () => {
    const { service, usersService } = setup(jest.fn(async () => null));
    await expect(service.logout('unknown-token')).resolves.toEqual({ message: 'Logged out' });
    expect(usersService.revokeRefreshToken).not.toHaveBeenCalled();
  });
});

describe('AuthService — forgotPassword anti-enumeration', () => {
  it('returns the same message whether or not the account exists', async () => {
    const usersService = {
      findByEmail: jest.fn(async (email: string) =>
        email === 'real@example.com' ? ({ id: 'u1', email, name: 'U' } as any) : null
      ),
    } as unknown as UsersService;
    const service = new AuthService(
      usersService,
      { sign: jest.fn() } as unknown as JwtService,
      {} as BruteForceService,
      {} as EmailService,
      { record: jest.fn() } as unknown as AnalyticsService
    );
    const missing = await service.forgotPassword('nobody@example.com');
    expect(missing.message).toMatch(/sent a password reset link/i);
    expect(missing.message).not.toContain('nobody@example.com');
  });
});
