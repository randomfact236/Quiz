'use client';

import { COOKIE_SETTINGS_EVENT } from '@/components/CookieConsent';

/**
 * Reopens the cookie consent banner (CookieConsent listens for the event).
 * Used in the footer legal links and on the Privacy page so visitors can
 * change their Google Analytics choice at any time.
 */
export function CookieSettingsButton({ className }: { className?: string }): JSX.Element {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
    >
      Cookie Settings
    </button>
  );
}
