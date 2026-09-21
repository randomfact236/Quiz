'use client';

import Link from 'next/link';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Cookie consent + Google Analytics gate — modeled on the affiliate site's
 * banner (profitbenefit.com): there is no "decline"; the visitor either
 * accepts everything, accepts essential-only, or customizes the mix.
 *
 * Consent is stored as a preferences object; GA (third-party cookies) loads
 * only when `analytics` is true. Essential first-party storage (session,
 * guest ID, theme, anonymous play analytics POSTed to our own backend) is
 * covered by the Privacy Policy and always on — the banner never turns it
 * off, it only arbitrates Google Analytics.
 *
 * The component stays mounted on every route (including /admin, where the
 * banner itself is hidden) so an accepted consent keeps GA loaded across
 * client-side navigation instead of re-firing gtag on every admin visit.
 * Footer/privacy "Cookie settings" buttons reopen the banner via the
 * COOKIE_SETTINGS_EVENT window event.
 */

const CONSENT_KEY = 'pigzap-cookie-consent';

export const COOKIE_SETTINGS_EVENT = 'pigzap:cookie-settings';

export interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
}

function readConsent(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    // Legacy binary choices from the first banner revision.
    if (raw === 'granted') return { analytics: true, marketing: true };
    if (raw === 'denied') return { analytics: false, marketing: false };
    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (parsed && typeof parsed.analytics === 'boolean') {
      return { analytics: !!parsed.analytics, marketing: !!parsed.marketing };
    }
    return null;
  } catch {
    return null;
  }
}

function writeConsent(prefs: ConsentPreferences): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable — the in-memory choice still applies this visit.
  }
}

export function CookieConsent({
  gaMeasurementId,
}: {
  gaMeasurementId: string;
}): JSX.Element | null {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [customAnalytics, setCustomAnalytics] = useState(true);
  const [customMarketing, setCustomMarketing] = useState(true);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = readConsent();
    setPrefs(stored);
    setBannerOpen(stored === null);
    setReady(true);

    const reopen = () => setBannerOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  // Focus management: on open, remember focus and move it to the first
  // button; on close, hand it back.
  useEffect(() => {
    if (bannerOpen) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      bannerRef.current?.querySelector('button')?.focus();
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current.focus?.();
      restoreFocusRef.current = null;
    }
  }, [bannerOpen, customizing]);

  const save = (choice: ConsentPreferences) => {
    writeConsent(choice);
    setPrefs(choice);
    setBannerOpen(false);
    setCustomizing(false);
  };

  // GA loader must stay active on /admin too; only the banner is hidden there.
  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const showBanner = ready && !isAdmin && (prefs === null || bannerOpen);
  const gaActive = !!prefs?.analytics;

  return (
    <>
      {gaMeasurementId && gaActive && (
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
                `gtag('config', '${gaMeasurementId}', { anonymize_ip: true });`,
            }}
          />
        </>
      )}

      {showBanner && (
        <div
          className="fixed inset-x-0 bottom-[4.5rem] z-50 px-4 pb-4 md:bottom-0"
          role="region"
          aria-label="Cookie consent"
        >
          <div
            ref={bannerRef}
            className="container mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border border-secondary-200 bg-white p-4 shadow-lg dark:border-secondary-700 dark:bg-secondary-800"
          >
            <p className="flex-1 text-sm text-secondary-600 dark:text-secondary-300">
              We use essential browser storage to keep the site working — always on. Beyond that,
              only with your permission: Google Analytics cookies to understand traffic
              (anonymized), and optional marketing measurement for future campaigns. Details in our{' '}
              <Link
                href="/privacy"
                className="font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                Privacy Policy
              </Link>
              .
            </p>

            {customizing && (
              <div className="flex flex-col gap-2 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
                <label className="flex items-center gap-3 text-sm font-medium text-secondary-700 dark:text-secondary-200">
                  <input
                    type="checkbox"
                    checked={customAnalytics}
                    onChange={(e) => setCustomAnalytics(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Analytics — traffic measurement (Google Analytics, anonymized)
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-secondary-700 dark:text-secondary-200">
                  <input
                    type="checkbox"
                    checked={customMarketing}
                    onChange={(e) => setCustomMarketing(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Marketing — campaign measurement (reserved for future use)
                </label>
                <button
                  type="button"
                  onClick={() => save({ analytics: customAnalytics, marketing: customMarketing })}
                  className="mt-1 self-start rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Save choices
                </button>
              </div>
            )}

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {!customizing && (
                <button
                  type="button"
                  onClick={() => setCustomizing(true)}
                  className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 dark:border-secondary-600 dark:text-secondary-200 dark:hover:bg-secondary-700"
                >
                  Customize
                </button>
              )}
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 dark:border-secondary-600 dark:text-secondary-200 dark:hover:bg-secondary-700"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: true, marketing: true })}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
