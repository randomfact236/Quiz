'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ContentOption {
  label: string;
  emoji: string;
  blurb: string;
  href: string;
  gradient: string;
}

interface ModeCardConfig {
  id: 'timer' | 'practice';
  emoji: string;
  title: string;
  subtitle: string;
  options: ContentOption[];
}

/** These two mode cards use the Topics-style section toggle; open by default. */
const MODE_CARDS: ModeCardConfig[] = [
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

/** These stay direct links. Order is shuffled on every visit (owner request 2026-09-16):
 *  Quiz / Riddles / Image Riddles / Dad Jokes always render, in random positions. */
const DIRECT_LINKS = [
  { href: '/quiz-mcq', emoji: '🧠', title: 'Quiz', subtitle: 'Test Your Knowledge' },
  { href: '/riddle-mcq', emoji: '🎭', title: 'Riddles', subtitle: 'Brain Teasers' },
  { href: '/image-riddles', emoji: '🖼️', title: 'Image Riddles', subtitle: 'Visual Puzzles' },
  { href: '/games', emoji: '🎮', title: 'Games', subtitle: 'Brain Exercise' },
  { href: '/jokes', emoji: '😂', title: 'Dad Jokes', subtitle: 'Fun Time' },
];

/** Fisher–Yates; returns a new array. */
function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

function ModeSection({
  card,
  expanded,
  onToggle,
}: {
  card: ModeCardConfig;
  expanded: boolean;
  onToggle: () => void;
}): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl bg-card/95 shadow-lg">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-secondary-800/70 dark:hover:bg-white/5"
        aria-label={expanded ? `Collapse ${card.title} section` : `Expand ${card.title} section`}
        aria-expanded={expanded}
      >
        <div>
          <h2 className="text-xl font-bold text-foreground">
            <span className="mr-2">{card.emoji}</span>
            {card.title}
          </h2>
          <p className="text-sm text-muted-foreground">{card.subtitle}</p>
        </div>
        <span
          className={`text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-3 p-4 pt-0 sm:gap-4">
          {card.options.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              className={`rounded-2xl bg-gradient-to-r ${opt.gradient} p-5 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-xl`}
            >
              <span className="mb-1 block text-3xl">{opt.emoji}</span>
              <span className="block font-bold">{opt.label}</span>
              <span className="block text-xs text-white/90">{opt.blurb}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ModeCards(): JSX.Element {
  // Shuffle after mount: SSR/prerender uses the fixed order so hydration matches,
  // then every visit gets a fresh random order.
  const [directLinks, setDirectLinks] = useState(DIRECT_LINKS);

  // BUG-003: both cards start open (Topics-section parity), but they act as
  // one accordion group — the first header click switches to exclusive mode,
  // so picking a card collapses the other instead of leaving both open.
  const [openCard, setOpenCard] = useState<'both' | 'timer' | 'practice' | null>('both');

  const toggleCard = (id: 'timer' | 'practice'): void => {
    setOpenCard((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    setDirectLinks(shuffled(DIRECT_LINKS));
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-4">
      {MODE_CARDS.map((card) => (
        <ModeSection
          key={card.id}
          card={card}
          expanded={openCard === 'both' || openCard === card.id}
          onToggle={() => toggleCard(card.id)}
        />
      ))}

      {directLinks.map((mode) => (
        <Link
          key={mode.title}
          href={mode.href}
          className="flex flex-col items-center rounded-2xl bg-card/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl dark:hover:bg-secondary-800"
        >
          <span className="text-4xl">{mode.emoji}</span>
          <span className="mt-2 font-bold text-foreground">{mode.title}</span>
          <span className="text-sm text-muted-foreground">{mode.subtitle}</span>
        </Link>
      ))}
    </div>
  );
}
