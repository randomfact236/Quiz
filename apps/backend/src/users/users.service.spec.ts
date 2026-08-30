/**
 * UsersService unit tests — refresh tokens are stored hashed with an expiry
 * and revoked (null) on logout (plan/01-user-accounts.md P1).
 */

import { UsersService } from './users.service';

describe('UsersService — refresh-token storage', () => {
  const setup = () => {
    const userRepo = {
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
      update: jest.fn(async () => undefined),
      findOne: jest.fn(async () => null),
    } as any;
    return { service: new UsersService(userRepo), userRepo };
  };

  it('stores a SHA-256 hash of the refresh token plus an expiry, never the raw token', async () => {
    const { service, userRepo } = setup();
    await service.updateRefreshToken('u1', 'raw-opaque-token');
    const [id, data] = userRepo.update.mock.calls[0];
    expect(id).toBe('u1');
    expect(data.refreshToken).not.toBe('raw-opaque-token');
    expect(data.refreshToken).toMatch(/^[a-f0-9]{64}$/);
    expect(data.refreshTokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('revocation clears both the token and its expiry', async () => {
    const { service, userRepo } = setup();
    await service.updateRefreshToken('u1', null);
    expect(userRepo.update).toHaveBeenCalledWith('u1', {
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });
  });

  it('token lookups hash the presented value before querying', async () => {
    const { service, userRepo } = setup();
    userRepo.findOne.mockResolvedValueOnce({ id: 'u1' });
    await service.findByRefreshToken('presented-token');
    const where = userRepo.findOne.mock.calls[0][0].where;
    expect(where.refreshToken).toMatch(/^[a-f0-9]{64}$/);
    expect(where.refreshToken).not.toBe('presented-token');
    expect(where.refreshTokenExpiresAt).toBeDefined();
  });
});
