import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The rules for using AI Quiz.',
};

export default function TermsPage(): JSX.Element {
  return (
    <LegalPage title="Terms of Service">
      <p className="font-semibold">
        PLACEHOLDER — replace with owner-approved legal copy before public launch.
      </p>
      <p>
        AI Quiz is provided as-is, for entertainment and practice. By using the site you agree to
        keep comments and guesses respectful and lawful; abusive content may be removed by
        moderators. You are responsible for keeping your credentials safe.
      </p>
      <p>
        Content on the site (questions, riddles, jokes) may not be reproduced wholesale without
        permission. The service may change or discontinue features at any time.
      </p>
    </LegalPage>
  );
}
