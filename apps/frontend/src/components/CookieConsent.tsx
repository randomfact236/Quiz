'use client';

import Link from 'next/link';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Cookie consent + Google Analytics gate. GA (third-party cookies) loads only
 * after an explicit "Accept"; "Decline" (and no answer) keeps it disabled.
 * Essential first-party storage (session, guest ID, theme, anonymous play
 * analytics POSTed to our own backend) is covered by the Privacy Policy and
 * always on — the banner only arbitrates Google Analytics.
 *
 * The component stays mounted on every route (including /admin, where the
 * banner itself is hidden) so an accepted consent keeps GA loaded across
 * client-side navigation instead of re-firing gtag on every admin visit.
 * Footer/privacy "Cookie settings" buttons reopen the banner via the
 * COOKIE_SETTINGS_EVENT window event.
 */

const CONSENT_KEY = 'pigzap-cookie-consent';

export const COOKIE_SETTINGS_EVENT = 'pigzap:cookie-settings';

type Consent = 'granted' | 'denied';

function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function CookieConsent({
  gaMeasurementId,
}: {
  gaMeasurementId: string;
}): JSX.Element | null {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    setConsent(stored);
    setBannerOpen(stored === null);
    setReady(true);

    const reopen = () => setBannerOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const save = (choice: Consent) => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Storage unavailable — the in-memory choice still applies this visit.
    }
    setConsent(choice);
    setBannerOpen(false);
  };

  // GA loader must stay active on /admin too; only the banner is hidden there.
  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const showBanner = ready && !isAdmin && (consent === null || bannerOpen);

  return (
    <>
      {gaMeasurementId && consent === 'granted' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html:
                'window.dataLayer = window.dataLayer || [];\n' +
                'function gtag(){dataLayer.push(arguments);}\n' +
                "gtag('js', new Date());\n" +
                `gtag('config', '${gaMeasurementId}');`,
            }}
          />
        </>
      )}

      {showBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
          role="region"
          aria-label="Cookie consent"
        >
          <div className="container mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border border-secondary-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center dark:border-secondary-700 dark:bg-secondary-800">
            <p className="flex-1 text-sm text-secondary-600 dark:text-secondary-300">
              We use essential browser storage to keep the site working, and — only with your
              permission — Google Analytics cookies to understand traffic. Details in our{' '}
              <Link
                href="/privacy"
                className="font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => save('denied')}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 dark:border-secondary-600 dark:text-secondary-200 dark:hover:bg-secondary-700"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => save('granted')}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
