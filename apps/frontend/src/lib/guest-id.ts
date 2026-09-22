/**
 * ============================================================================
 * guest-id.ts — client-issued guest identity + server-signed token (HARD-03)
 * ============================================================================
 * Single source of truth for the guest identity used by guest-scoped
 * endpoints (comments, likes, activity heartbeat). The id is generated once per browser
 * and persisted in localStorage; the backend upserts the guest_users row
 * on first write (findOrCreate), so no bootstrap round-trip is needed.
 *
 * SEC-12 fix: writes additionally carry a SERVER-SIGNED token (HMAC over the
 * guestId) issued by `POST /guest-users/token` — see ensureGuestToken(). The
 * pair is cached in localStorage and re-issued whenever the id rotates or
 * the backend rejects it (one retry at the call sites).
 * ============================================================================
 */

import { api } from './api-client';

const GUEST_ID_KEY = 'aiquiz:guest-id';
const GUEST_NAME_KEY = 'aiquiz:guest-name';
const GUEST_TOKEN_KEY = 'aiquiz:guest-token';

export interface GuestTokenPair {
  guestId: string;
  token: string;
}

function generateGuestId(): string {
  return (
    'guest_' +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/** Get (or lazily create) this browser's guest identity. */
export function getGuestId(): string {
  if (typeof window === 'undefined') return '';
  let guestId = window.localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = generateGuestId();
    window.localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

/**
 * Retire this browser's guest identity and mint a fresh one. Called after a
 * login merge (the old id's likes/comments now belong to the account) and on
 * logout, so the next person on a shared device can never see — or merge —
 * the previous guest's activity. Returns the new id.
 */
export function rotateGuestId(): string {
  if (typeof window === 'undefined') return '';
  const fresh = generateGuestId();
  window.localStorage.setItem(GUEST_ID_KEY, fresh);
  // The signed pair belongs to the RETIRED id — drop it so the next write
  // re-issues a token for the fresh id.
  window.localStorage.removeItem(GUEST_TOKEN_KEY);
  return fresh;
}

function readStoredGuestToken(): GuestTokenPair | null {
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

/** Drop the cached signed pair (id rotated or the backend rejected it). */
export function invalidateGuestToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GUEST_TOKEN_KEY);
}

/**
 * Get the server-signed {guestId, token} pair required on guest WRITE
 * endpoints (likes, comments, merge, activity). Cached; re-issued when the
 * id rotated. The CURRENT legacy `guest_…` id is passed as legacyId so the
 * backend signs it as-is and every like/comment stored before this upgrade
 * keeps matching. Returns null when the endpoint is unreachable — callers
 * send the write unsigned, and on a 403 they invalidate + retry once.
 */
export async function ensureGuestToken(): Promise<GuestTokenPair | null> {
  if (typeof window === 'undefined') return null;
  const guestId = getGuestId();
  const stored = readStoredGuestToken();
  if (stored && stored.guestId === guestId) return stored;
  try {
    const response = await api.post<GuestTokenPair>('/guest-users/token', {
      legacyId: guestId,
    });
    const pair = { guestId: response.data.guestId, token: response.data.token };
    window.localStorage.setItem(GUEST_TOKEN_KEY, JSON.stringify(pair));
    return pair;
  } catch {
    return null;
  }
}

/**
 * Display name for comments — set once by the visitor (any name they like)
 * and reused for every comment from this device. Empty string when unset
 * (feeds render those entries as "Guest").
 */
export function getGuestName(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(GUEST_NAME_KEY) ?? '';
}

export function setGuestName(name: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_NAME_KEY, name.trim().slice(0, 50));
}
