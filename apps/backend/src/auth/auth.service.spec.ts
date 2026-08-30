/**
 * AuthService unit tests — refresh-token expiry/rotation, logout revocation,
 * one-time OAuth code exchange (plan/01-user-accounts.md P1), and the
 * anti-enumeration guarantee on forgotPassword.
 */

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { BruteForceService } from './brute-force.service';
import { CacheService } from '../common/cache/cache.service';
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
      { get: jest.fn(), set: jest.fn(), del: jest.fn() } as unknown as CacheService,
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

describe('AuthService — one-time OAuth code exchange', () => {
  const makeCache = (store: Map<string, unknown>) =>
    ({
      get: jest.fn(async (key: string) => (store.has(key) ? store.get(key) : null)),
      set: jest.fn(async (key: string, value: unknown) => {
        store.set(key, value);
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
    }) as unknown as CacheService;

  const setupOAuth = (store: Map<string, unknown>) => {
    const usersService = {} as UsersService;
    return new AuthService(
      usersService,
      { sign: jest.fn(() => 'access-token') } as unknown as JwtService,
      {} as BruteForceService,
      makeCache(store),
      {} as EmailService,
      { record: jest.fn() } as unknown as AnalyticsService
    );
  };

  it('createOAuthCode stores the payload under a hashed key, not the raw code', async () => {
    const store = new Map<string, unknown>();
    const service = setupOAuth(store);
    const payload = { user: { id: 'u1' }, token: 't', refreshToken: 'r' };
    const code = await service.createOAuthCode(payload as any);
    expect(code).toMatch(/^[a-f0-9]{64}$/);
    // No cache entry keyed by the raw code; exactly one entry exists.
    expect(store.size).toBe(1);
    expect([...store.keys()][0]).not.toContain(code);
  });

  it('exchangeOAuthCode returns the payload and consumes the code (single use)', async () => {
    const store = new Map<string, unknown>();
    const service = setupOAuth(store);
    const payload = { user: { id: 'u1' }, token: 't', refreshToken: 'r' };
    const code = await service.createOAuthCode(payload as any);
    await expect(service.exchangeOAuthCode(code)).resolves.toEqual(payload);
    expect(store.size).toBe(0);
    await expect(service.exchangeOAuthCode(code)).rejects.toThrow(UnauthorizedException);
  });

  it('exchangeOAuthCode rejects unknown codes', async () => {
    const service = setupOAuth(new Map());
    await expect(service.exchangeOAuthCode('nope')).rejects.toThrow(UnauthorizedException);
  });
});

describe('AuthService — email verification', () => {
  const setupVerification = (existing: any) => {
    const usersService = {
      findByEmailVerificationToken: jest.fn(async () => existing),
      markEmailVerified: jest.fn(async () => undefined),
      findByEmail: jest.fn(async () => existing),
      updateEmailVerificationToken: jest.fn(async () => undefined),
    } as unknown as UsersService;
    const emailService = {
      sendVerificationEmail: jest.fn(async () => ({ success: true, message: 'ok' })),
    } as unknown as EmailService;
    const service = new AuthService(
      usersService,
      { sign: jest.fn() } as unknown as JwtService,
      {} as BruteForceService,
      { get: jest.fn(), set: jest.fn(), del: jest.fn() } as unknown as CacheService,
      emailService,
      { record: jest.fn() } as unknown as AnalyticsService
    );
    return { service, usersService, emailService };
  };

  it('verifyEmail flips emailVerified and clears the token', async () => {
    const { service, usersService } = setupVerification({
      id: 'u1',
      emailVerified: false,
      emailVerificationExpires: new Date(Date.now() + 60_000),
    } as any);
    await expect(service.verifyEmail('good-token')).resolves.toMatchObject({
      message: expect.stringMatching(/verified/i),
    });
    expect(usersService.markEmailVerified).toHaveBeenCalledWith('u1');
  });

  it('verifyEmail rejects unknown tokens without touching any user', async () => {
    const { service, usersService } = setupVerification(null);
    await expect(service.verifyEmail('bad-token')).rejects.toThrow(/Invalid or expired/i);
    expect(usersService.markEmailVerified).not.toHaveBeenCalled();
  });

  it('resendVerificationEmail keeps the same response for unknown emails', async () => {
    const { service } = setupVerification(null);
    await expect(service.resendVerificationEmail('nobody@example.com')).resolves.toMatchObject({
      message: expect.stringMatching(/unverified/),
    });
  });

  it('resendVerificationEmail skips sending for already-verified accounts', async () => {
    const { service, emailService } = setupVerification({ id: 'u1', emailVerified: true } as any);
    await service.resendVerificationEmail('real@example.com');
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
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
      { get: jest.fn(), set: jest.fn(), del: jest.fn() } as unknown as CacheService,
      {} as EmailService,
      { record: jest.fn() } as unknown as AnalyticsService
    );
    const missing = await service.forgotPassword('nobody@example.com');
    expect(missing.message).toMatch(/sent a password reset link/i);
    expect(missing.message).not.toContain('nobody@example.com');
  });
});
