/**
 * ============================================================================
 * guest-token-store.ts — synchronous access to the cached signed guest pair
 * ============================================================================
 * Split out of `guest-id.ts` so `api-client.ts` can read the cached token
 * without importing `guest-id.ts` (which imports the api client — a cycle).
 *
 * Why sync: every guest-scoped GET carries `?guestId=`, and the backend
 * GuestTokenGuard now demands the signed pair on those reads too. Rather than
 * making each call site await `ensureGuestToken()`, the api client attaches
 * the header centrally whenever the request URL carries a guestId. A cache
 * miss simply means the header is absent and the server answers 403 — the
 * same shape the write paths already recover from by re-issuing the pair.
 * ============================================================================
 */

const GUEST_TOKEN_KEY = 'aiquiz:guest-token';

export interface GuestTokenPair {
  guestId: string;
  token: string;
}

/** The cached pair, or null. Sync and SSR-safe (returns null on the server). */
export function readGuestToken(): GuestTokenPair | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GUEST_TOKEN_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const pair = parsed as Partial<GuestTokenPair> | null;
    if (pair?.guestId && pair?.token) return { guestId: pair.guestId, token: pair.token };
    return null;
  } catch {
    return null;
  }
}

export function writeGuestToken(pair: GuestTokenPair): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_TOKEN_KEY, JSON.stringify(pair));
}

/** Drop the cached signed pair (id rotated or the backend rejected it). */
export function clearGuestToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GUEST_TOKEN_KEY);
}

/**
 * The token to send for a request scoped to `guestId`, or undefined when there
 * is nothing usable cached. A pair stored for a DIFFERENT (rotated) id is
 * deliberately not returned — sending it would just earn a 403.
 */
export function guestTokenFor(guestId: string | null | undefined): string | undefined {
  if (!guestId) return undefined;
  const pair = readGuestToken();
  return pair && pair.guestId === guestId ? pair.token : undefined;
}
