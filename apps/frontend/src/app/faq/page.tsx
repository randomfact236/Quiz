import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Answers about AI Quiz: how to play, accounts and guests, scoring, mini games, and how your data is handled.',
};

const FAQS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: 'What is AI Quiz?',
    a: 'A free brain-training playground: multiple-choice quizzes, riddles, image riddles, dad jokes and a collection of one-handed mini games. Everything runs in your browser — no install, no signup.',
  },
  {
    q: 'Do I need an account to play?',
    a: 'No. You can play everything as a guest — a random identifier in your browser keeps your progress, scores and achievements on your device. Creating an account (email + password) simply carries your progress across devices.',
  },
  {
    q: 'What content is there to play?',
    a: 'Thousands of multiple-choice questions across academic, entertainment and everyday-life subjects, five difficulty levels, timed challenge sessions and a relaxed practice mode — plus riddle chapters, image-riddle difficulty tiers, dad-joke categories and eight mini games.',
  },
  {
    q: 'How does scoring work?',
    a: 'Each correct answer is worth one point. Your score updates live as you answer, and at the end of a session you get a full results breakdown. Strong sessions feed your achievements.',
  },
  {
    q: 'What happens when I answer a question?',
    a: 'You get instant feedback — your pick turns red or green and the correct answer is highlighted. A few seconds later the quiz moves on to the next question by itself; you can always advance earlier with the Next button (or Enter).',
  },
  {
    q: 'Are the mini games really free?',
    a: 'Yes — all eight games (Tic Tac Toe, Sliding Puzzle, Word Puzzle, Memory Quiz and more) are free, work offline once loaded, and never ask for an account.',
  },
  {
    q: 'What data do you collect?',
    a: 'Only first-party, anonymous play analytics (answers, session results and coarse device info) used to improve the site. We do not sell personal data. Details are in the Privacy Policy.',
  },
  {
    q: 'How do I give feedback or report a problem?',
    a: 'Use the Contact page — messages go straight to the team and we read every one.',
  },
];

export default function FaqPage(): JSX.Element {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
          })),
        }}
      />
      <LegalPage title="Frequently Asked Questions">
        {FAQS.map((faq) => (
          <div key={faq.q}>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{faq.q}</h2>
            <p>{faq.a}</p>
          </div>
        ))}
      </LegalPage>
    </>
  );
}
