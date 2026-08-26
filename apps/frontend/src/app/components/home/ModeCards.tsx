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

interface ExpandableCardConfig {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  options: ContentOption[];
}

/** The two mode cards expand accordion-style to reveal Quiz/Riddle targets. */
const EXPANDABLE_CARDS: ExpandableCardConfig[] = [
  {
    id: 'timer',
    emoji: '⏱️',
    title: 'Timer Challenges',
    subtitle: 'Mix - All Subjects',
    options: [
      {
        label: 'Quiz',
        emoji: '🧠',
        blurb: 'Timed quiz sessions',
        href: '/quiz-mcq/timer-challenge',
        gradient: 'from-blue-500 to-indigo-600',
      },
      {
        label: 'Riddle',
        emoji: '🧩',
        blurb: 'Timed riddle sessions',
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
        blurb: 'Practice quizzes',
        href: '/quiz-mcq/practice-mode',
        gradient: 'from-blue-500 to-indigo-600',
      },
      {
        label: 'Riddle',
        emoji: '🧩',
        blurb: 'Practice riddles',
        href: '/riddle-mcq/practice',
        gradient: 'from-purple-500 to-pink-600',
      },
    ],
  },
];

/** These stay direct links — no expand behavior. */
const DIRECT_LINKS = [
  { href: '/riddles', emoji: '🎭', title: 'Riddles', subtitle: 'Brain Teasers' },
  { href: '/image-riddles', emoji: '🖼️', title: 'Image Riddles', subtitle: 'Visual Puzzles' },
  { href: '/jokes', emoji: '😂', title: 'Dad Jokes', subtitle: 'Fun Time' },
];

export function ModeCards(): JSX.Element {
  // Accordion: at most one card open; clicking elsewhere collapses it
  const [openId, setOpenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openId) return;

    const handlePointerDown = (e: PointerEvent): void => {
      const container = containerRef.current;
      if (!container) return;
      const target = e.target as HTMLElement | null;
      // Collapse unless the click is inside the currently-open card
      const openEl = container.querySelector(`[data-card-id="${openId}"]`);
      if (!openEl || !target || !openEl.contains(target)) {
        setOpenId(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [openId]);

  return (
    <div ref={containerRef} className="grid grid-cols-2 items-start gap-4">
      {EXPANDABLE_CARDS.map((card) => {
        const isOpen = openId === card.id;
        return (
          <div
            key={card.id}
            data-card-id={card.id}
            className="overflow-hidden rounded-2xl bg-white/95 shadow-lg transition-shadow hover:shadow-xl"
          >
            {/* Card header — click toggles expansion */}
            <button
              onClick={() => setOpenId(isOpen ? null : card.id)}
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

            {/* Expanded sub-options */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 px-4 pb-4">
                    {card.options.map((opt) => (
                      <Link
                        key={opt.href}
                        href={opt.href}
                        className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${opt.gradient} p-3 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg`}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="flex-1 text-left">
                          <span className="block font-bold">{opt.label}</span>
                          <span className="block text-xs text-white/90">{opt.blurb}</span>
                        </span>
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
