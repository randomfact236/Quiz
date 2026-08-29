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
