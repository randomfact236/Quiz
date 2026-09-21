import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  alternates: { canonical: '/terms' },
  description: 'The rules for using PigZap.',
};

export default function TermsPage(): JSX.Element {
  return (
    <LegalPage title="Terms of Service">
      <p className="text-sm text-secondary-500 dark:text-secondary-400">
        Last updated: September 16, 2026
      </p>
      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Acceptance</h2>
      <p>
        By using PigZap you agree to these terms. If you don&apos;t agree with them, please
        don&apos;t use the site. We may update the terms from time to time; continued use after an
        update means you accept the revised terms.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">The service</h2>
      <p>
        PigZap is a free entertainment and learning platform: quizzes, riddles, jokes and mini
        games, provided &quot;as is&quot;. Features may change, be interrupted, or be discontinued
        at any time without notice. We aim for accuracy in our quiz content but provide no guarantee
        that every question, answer or score is error-free.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Accounts</h2>
      <p>
        Accounts are optional. If you create one, you are responsible for keeping your credentials
        safe and for activity under your account. You must provide accurate information and not
        impersonate other people. Accounts used for abuse may be suspended.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Acceptable use</h2>
      <p>
        Play fair and be respectful. Don&apos;t attempt to disrupt the service, scrape it at scale,
        exploit bugs for scores, upload malicious content, or post unlawful, hateful or harassing
        material in public areas such as comments. We may remove content and restrict access for
        violations.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">
        Content &amp; ownership
      </h2>
      <p>
        The site&apos;s questions, riddles, jokes, games, design and code are protected by copyright
        and may not be reproduced wholesale without permission. You keep ownership of anything you
        post in public areas, and grant us a license to display it on the site.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">
        Limitation of liability
      </h2>
      <p>
        To the maximum extent permitted by law, PigZap and its operators are not liable for any
        indirect or consequential damages arising from your use of the site. The site is provided
        without warranties of any kind, except where the law says otherwise.
      </p>

      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Contact</h2>
      <p>Questions about these terms? Reach us through the contact page.</p>
    </LegalPage>
  );
}
