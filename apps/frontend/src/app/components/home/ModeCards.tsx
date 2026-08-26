'use client';

import Link from 'next/link';

interface ContentOption {
  label: string;
  emoji: string;
  blurb: string;
  href: string;
  gradient: string;
}

interface ExpandableCardConfig {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  options: ContentOption[];
}

/** The two mode cards always show their Quiz/Riddle options in a row. */
const MODE_CARDS: ExpandableCardConfig[] = [
  {
    id: 'timer',
    emoji: '⏱️',
    title: 'Timer Challenges',
    subtitle: 'Mix - All Subjects',
    options: [
      {
        label: 'Quiz',
        emoji: '🧠',
        blurb: 'Timed sessions',
        href: '/quiz-mcq/timer-challenge',
        gradient: 'from-blue-500 to-indigo-600',
      },
      {
        label: 'Riddle',
        emoji: '🧩',
        blurb: 'Timed sessions',
        href: '/riddle-mcq/challenge',
        gradient: 'from-purple-500 to-pink-600',
      },
    ],
  },
  {
    id: 'practice',
    emoji: '🎯',
    title: 'Practice Mode',
    subtitle: 'Mix - No Timer',
    options: [
      {
        label: 'Quiz',
        emoji: '🧠',
        blurb: 'No timer',
        href: '/quiz-mcq/practice-mode',
        gradient: 'from-blue-500 to-indigo-600',
      },
      {
        label: 'Riddle',
        emoji: '🧩',
        blurb: 'No timer',
        href: '/riddle-mcq/practice',
        gradient: 'from-purple-500 to-pink-600',
      },
    ],
  },
];

/** These stay direct links. */
const DIRECT_LINKS = [
  { href: '/riddles', emoji: '🎭', title: 'Riddles', subtitle: 'Brain Teasers' },
  { href: '/image-riddles', emoji: '🖼️', title: 'Image Riddles', subtitle: 'Visual Puzzles' },
  { href: '/jokes', emoji: '😂', title: 'Dad Jokes', subtitle: 'Fun Time' },
];

export function ModeCards(): JSX.Element {
  return (
    <div className="grid grid-cols-2 items-start gap-4">
      {MODE_CARDS.map((card) => (
        <div
          key={card.id}
          className="rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-shadow hover:bg-white hover:shadow-xl"
        >
          <span className="text-4xl">{card.emoji}</span>
          <span className="mt-2 block font-bold text-gray-800">{card.title}</span>
          <span className="block text-sm text-gray-500">{card.subtitle}</span>

          {/* Quiz / Riddle options — always visible, one row */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {card.options.map((opt) => (
              <Link
                key={opt.href}
                href={opt.href}
                className={`flex flex-col items-center rounded-xl bg-gradient-to-r ${opt.gradient} px-3 py-2.5 text-white shadow-md transition-all hover:scale-[1.04] hover:shadow-lg`}
              >
                <span className="text-xl leading-none">{opt.emoji}</span>
                <span className="mt-1 block font-bold">{opt.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {DIRECT_LINKS.map((mode) => (
        <Link
          key={mode.title}
          href={mode.href}
          className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl"
        >
          <span className="text-4xl">{mode.emoji}</span>
          <span className="mt-2 font-bold text-gray-800">{mode.title}</span>
          <span className="text-sm text-gray-500">{mode.subtitle}</span>
        </Link>
      ))}
    </div>
  );
}
