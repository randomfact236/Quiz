/**
 * ============================================================================
 * Unified Game Picker
 * ============================================================================
 * Single entry point across content types: pick Timer Challenge or Practice,
 * then click Quiz or Riddle to jump straight into that feature's existing
 * flow. Direct feature URLs (/quiz-mcq/*, /riddle-mcq/*) keep working.
 * ============================================================================
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, GraduationCap, Timer } from 'lucide-react';

interface ContentOption {
  label: string;
  emoji: string;
  blurb: string;
  href: string;
  gradient: string;
}

interface ModeColumn {
  title: string;
  blurb: string;
  icon: typeof Timer;
  headerGradient: string;
  options: ContentOption[];
}

const MODES: ModeColumn[] = [
  {
    title: 'Timer Challenge',
    blurb: 'Beat the session clock — forced submit at zero',
    icon: Timer,
    headerGradient: 'from-pink-500 to-rose-600',
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
    title: 'Practice Mode',
    blurb: 'No time pressure — learn at your own pace',
    icon: GraduationCap,
    headerGradient: 'from-emerald-500 to-teal-600',
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

export default function UnifiedGamePickerPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white/60 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-center text-4xl font-extrabold text-gray-800 tracking-tight"
        >
          Choose Your Game
        </motion.h1>
        <p className="mb-10 text-center text-gray-600">
          Pick a style, then choose Quiz or Riddle — one click and you&apos;re in.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {MODES.map((m, idx) => {
            const Icon = m.icon;
            return (
              <motion.section
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                className="rounded-2xl bg-white p-6 shadow-lg"
              >
                {/* Mode header */}
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${m.headerGradient} text-white shadow-md`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{m.title}</h2>
                    <p className="text-sm text-gray-500">{m.blurb}</p>
                  </div>
                </div>

                {/* Content options — click through to the feature flow */}
                <div className="space-y-3">
                  {m.options.map((opt) => (
                    <Link
                      key={opt.href}
                      href={opt.href}
                      className={`flex items-center gap-4 rounded-xl bg-gradient-to-r ${opt.gradient} p-4 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg`}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="flex-1">
                        <span className="block font-bold">{opt.label}</span>
                        <span className="block text-sm text-white/90">{opt.blurb}</span>
                      </span>
                      <Brain className="h-5 w-5 opacity-80" />
                    </Link>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-gray-500">
          Know what you want already?
          <Link href="/riddle-mcq" className="font-medium text-indigo-600 hover:underline">
            Riddles home
          </Link>
          ·
          <Link href="/quiz-mcq" className="font-medium text-indigo-600 hover:underline">
            Quiz home
          </Link>
        </div>
      </div>
    </div>
  );
}
