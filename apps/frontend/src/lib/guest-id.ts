/**
 * ============================================================================
 * guest-id.ts — client-issued guest identity
 * ============================================================================
 * Single source of truth for the guest identity used by guest-scoped
 * endpoints (comments, demographics). The id is generated once per browser
 * and persisted in localStorage; the backend upserts the guest_users row
 * on first write (findOrCreate), so no bootstrap round-trip is needed.
 * ============================================================================
 */

const GUEST_ID_KEY = 'aiquiz:guest-id';
const GUEST_NAME_KEY = 'aiquiz:guest-name';

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
