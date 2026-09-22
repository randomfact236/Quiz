import { GuestTokenService } from './guest-token.service';

/**
 * HARD-03 (SEC-12): the signed guest pair. Signatures must be deterministic
 * (same secret + id → same token), verification constant-time-safe against
 * wrong-length inputs, and only legacy-shaped requested ids may be signed
 * as-is (everything else gets a fresh server-minted id).
 */
describe('GuestTokenService', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  const make = () => new GuestTokenService();

  it('signs deterministically and verifies the exact pair', () => {
    const svc = make();
    const token = svc.sign('guest_abc123');
    expect(svc.sign('guest_abc123')).toBe(token);
    expect(svc.verify('guest_abc123', token)).toBe(true);
  });

  it('rejects wrong ids, wrong tokens, empty values, and wrong-length tokens', () => {
    const svc = make();
    const token = svc.sign('guest_abc123');
    expect(svc.verify('guest_other', token)).toBe(false);
    expect(svc.verify('guest_abc123', 'not-a-token')).toBe(false);
    expect(svc.verify('guest_abc123', '')).toBe(false);
    expect(svc.verify('', token)).toBe(false);
    expect(svc.verify('guest_abc123', 'x')).toBe(false); // length mismatch path
  });

  it('issues a fresh server-minted id when no legacy id is requested', () => {
    const pair = make().issue();
    expect(pair.guestId.startsWith('srv_')).toBe(true);
    expect(pair.token).toBeTruthy();
    expect(make().verify(pair.guestId, pair.token)).toBe(true);
  });

  it('signs a legacy-shaped requested id AS-IS (migration keeps old rows matching)', () => {
    const legacy = 'guest_abc123def456';
    const pair = make().issue(legacy);
    expect(pair.guestId).toBe(legacy);
    expect(make().verify(legacy, pair.token)).toBe(true);
  });

  it('never signs non-legacy requested values — mints a server id instead', () => {
    const svc = make();
    for (const requested of ['randomstring', '', 'guest_', 'guest_' + 'x'.repeat(80), 'srv_fake']) {
      const pair = svc.issue(requested);
      expect(pair.guestId.startsWith('srv_')).toBe(true);
      expect(svc.verify(pair.guestId, pair.token)).toBe(true);
    }
  });

  it('different secrets never verify each other\u2019s tokens', () => {
    const a = new GuestTokenService();
    const token = a.sign('guest_abc123');
    (a as unknown as { secret: string }).secret = 'other-secret';
    expect(a.verify('guest_abc123', token)).toBe(false);
  });
});
