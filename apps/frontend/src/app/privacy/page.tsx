import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How AI Quiz collects, uses, and protects your data.',
};

export default function PrivacyPage(): JSX.Element {
  return (
    <LegalPage title="Privacy Policy">
      <p className="font-semibold">
        PLACEHOLDER — replace with owner-approved legal copy before public launch.
      </p>
      <p>
        AI Quiz is designed to be playable without an account. When you play as a guest, we store a
        random identifier in your browser so your progress, scores, and achievements stay on your
        device. If you create an account, we store your email, display name, and password (hashed)
        solely to provide sign-in and profile features.
      </p>
      <p>
        We do not sell personal data. Anonymous, aggregated play statistics (e.g. total votes or
        solves per riddle) may be used to improve the site. Comments you post publicly are visible
        to other visitors and moderators.
      </p>
      <p>
        To request deletion of your account or content, use the contact page. Session cookies and
        local storage are used only for authentication and preferences (e.g. dark mode).
      </p>
    </LegalPage>
  );
}
