'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ContentOption {
  label: string;
  emoji: string;
  blurb: string;
  href: string;
  gradient: string;
}

interface ModeCardConfig {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  options: ContentOption[];
}

/** These two mode cards are accordions — open by default, collapsible by click. */
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

/** These stay direct links. */
const DIRECT_LINKS = [
  { href: '/riddles', emoji: '🎭', title: 'Riddles', subtitle: 'Brain Teasers' },
  { href: '/image-riddles', emoji: '🖼️', title: 'Image Riddles', subtitle: 'Visual Puzzles' },
  { href: '/jokes', emoji: '😂', title: 'Dad Jokes', subtitle: 'Fun Time' },
];

export function ModeCards(): JSX.Element {
  // Accordion state — both cards start open; each toggles independently
  const [openIds, setOpenIds] = useState<string[]>(MODE_CARDS.map((c) => c.id));
  const containerRef = useRef<HTMLDivElement>(null);

  // Clicking anywhere outside the cards collapses all of them
  useEffect(() => {
    if (openIds.length === 0) return;

    const handlePointerDown = (e: PointerEvent): void => {
      const container = containerRef.current;
      if (!container) return;
      const target = e.target as HTMLElement | null;
      if (!target || !container.contains(target)) {
        setOpenIds([]);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [openIds.length]);

  const toggle = (id: string): void => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div ref={containerRef} className="grid grid-cols-2 items-start gap-4">
      {MODE_CARDS.map((card) => {
        const isOpen = openIds.includes(card.id);
        return (
          <div
            key={card.id}
            className="overflow-hidden rounded-2xl bg-white/95 shadow-lg transition-shadow hover:bg-white hover:shadow-xl"
          >
            {/* Card header — click toggles this card only */}
            <button
              onClick={() => toggle(card.id)}
              aria-expanded={isOpen}
              className="flex w-full flex-col items-center p-6 text-center transition-colors hover:bg-white"
            >
              <span className="text-4xl">{card.emoji}</span>
              <span className="mt-2 flex items-center gap-1 font-bold text-gray-800">
                {card.title}
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </span>
              <span className="text-sm text-gray-500">{card.subtitle}</span>
            </button>

            {/* Quiz / Riddle options — one row, always laid out horizontally */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 px-4 pb-4">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

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
