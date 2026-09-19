import type { Metadata } from 'next';

import { CookieSettingsButton } from '@/components/CookieSettingsButton';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How PigZap collects, uses, and protects your data.',
};

export default function PrivacyPage(): JSX.Element {
  return (
    <LegalPage title="Privacy Policy">
      <p className="text-sm text-secondary-500 dark:text-secondary-400">
        Last updated: September 19, 2026
      </p>
      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Overview</h2>
      <p>
        PigZap (&quot;we&quot;, &quot;the site&quot;) is an entertainment and learning platform.
        This policy explains what we collect when you play, why we collect it, and the choices you
        have. The short version: we collect as little as possible, everything stays first-party, and
        we never sell personal data.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Playing as a guest</h2>
      <p>
        You can play everything without an account. To remember your progress, scores and
        achievements between visits we store a random identifier (a &quot;guest ID&quot;) in your
        browser&apos;s local storage. It contains no personal information and is never linked to
        your identity unless you sign in with the same browser.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Accounts</h2>
      <p>
        If you create an account, we store your email address, display name and a securely hashed
        password (we never store the password itself). This is used solely to provide sign-in, your
        profile, and your saved progress. You can request account deletion at any time via the
        contact page.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Play analytics</h2>
      <p>
        We operate our own first-party, anonymous analytics to understand how the site is used and
        to improve it. When you play, we record events such as questions answered, answers chosen,
        session results, and coarse technical context (device type, browser, screen size). IP
        addresses are truncated before storage and only a rough region is derived from them. This
        data is aggregated, never sold, and not shared with advertising networks.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">
        Storage &amp; cookies
      </h2>
      <p>
        We use browser local storage (not tracking cookies) for essential purposes only:
        authentication sessions, your guest ID, and preferences such as dark mode. There are no
        advertising cookies.
      </p>
      <p>
        With your consent — asked once via the cookie banner — we also use Google Analytics, which
        sets cookies (such as <code>_ga</code>) to measure site traffic and usage. If you decline,
        Google Analytics stays disabled. You can change your choice at any time:
      </p>
      <p>
        <CookieSettingsButton className="font-medium text-primary-600 hover:underline dark:text-primary-400" />
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Newsletter</h2>
      <p>
        If you subscribe to the optional newsletter, we store your email address for the sole
        purpose of sending occasional quiz updates. Every email contains an unsubscribe link, and
        you can also ask us to remove you via the contact page.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Content you post</h2>
      <p>
        Comments and display names you post publicly are visible to other visitors and moderators.
        Please don&apos;t share personal information in public areas.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Your rights</h2>
      <p>
        You can clear locally stored data any time by clearing your browser storage. Your Google
        Analytics choice can be changed any time via the cookie banner (the &quot;Cookie
        Settings&quot; link above and in the footer). To access, correct or delete account data, or
        ask anything about this policy, use the contact page and we will respond promptly.
      </p>
    </LegalPage>
  );
}
