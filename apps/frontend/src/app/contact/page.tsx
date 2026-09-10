import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach the AI Quiz team.',
};

export default function ContactPage(): JSX.Element {
  return (
    <LegalPage title="Contact">
      <p>
        Questions, content feedback, or data-deletion requests? Email us at{' '}
        <a
          href="mailto:contact@pigzap.com"
          className="font-medium text-primary-600 hover:underline"
        >
          contact@pigzap.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
