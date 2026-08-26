/**
 * ============================================================================
 * Unified Game Picker
 * ============================================================================
 * Single entry point across content types: pick Quiz-MCQ or Riddle-MCQ first,
 * then Timer Challenge or Practice mode, then jump into that feature's
 * existing flow. Direct feature URLs (/quiz-mcq/*, /riddle-mcq/*) keep working
 * unchanged.
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, GraduationCap, Timer } from 'lucide-react';

type ContentType = 'quiz' | 'riddle' | null;
type ModeType = 'timer' | 'practice' | null;

const ROUTE_MATRIX: Record<Exclude<ContentType, null>, Record<Exclude<ModeType, null>, string>> = {
  quiz: {
    timer: '/quiz-mcq/timer-challenge',
    practice: '/quiz-mcq/practice-mode',
  },
  riddle: {
    timer: '/riddle-mcq/challenge',
    practice: '/riddle-mcq/practice',
  },
};

const CONTENT_OPTIONS: {
  key: Exclude<ContentType, null>;
  label: string;
  emoji: string;
  blurb: string;
  gradient: string;
}[] = [
  {
    key: 'quiz',
    label: 'Quiz MCQ',
    emoji: '🧠',
    blurb: 'Subjects with chapters of multiple-choice questions',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    key: 'riddle',
    label: 'Riddle MCQ',
    emoji: '🧩',
    blurb: 'Brain teasers across difficulty levels',
    gradient: 'from-purple-500 to-pink-600',
  },
];

const MODE_OPTIONS: {
  key: Exclude<ModeType, null>;
  label: string;
  blurb: string;
  icon: typeof Timer;
}[] = [
  {
    key: 'timer',
    label: 'Timer Challenge',
    blurb: 'Beat the session clock — forced submit at zero',
    icon: Timer,
  },
  {
    key: 'practice',
    label: 'Practice',
    blurb: 'No time pressure — learn at your own pace',
    icon: GraduationCap,
  },
];

export default function UnifiedGamePickerPage(): JSX.Element {
  const router = useRouter();
  const [content, setContent] = useState<ContentType>(null);
  const [mode, setMode] = useState<ModeType>(null);

  const ready = content !== null && mode !== null;
  const target = ready ? ROUTE_MATRIX[content][mode] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
      <div className="mx-auto max-w-3xl">
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
          Pick your content, then your style — we&apos;ll take you there.
        </p>

        {/* Step 1 — Content type */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-2xl bg-white p-6 shadow-lg"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
              1
            </span>
            <h2 className="text-xl font-bold text-gray-800">What do you want to play?</h2>
            {content && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                <Check className="h-3 w-3" />
                {content === 'quiz' ? 'Quiz MCQ' : 'Riddle MCQ'}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {CONTENT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setContent(opt.key)}
                aria-pressed={content === opt.key}
                className={`rounded-xl border-2 p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${
                  content === opt.key
                    ? `border-transparent bg-gradient-to-r ${opt.gradient} text-white shadow-lg`
                    : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-200'
                }`}
              >
                <span className="mb-2 block text-3xl">{opt.emoji}</span>
                <span className="block text-lg font-bold">{opt.label}</span>
                <span
                  className={`mt-1 block text-sm ${content === opt.key ? 'text-white/90' : 'text-gray-500'}`}
                >
                  {opt.blurb}
                </span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Step 2 — Game mode */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mb-8 rounded-2xl bg-white p-6 shadow-lg transition-opacity ${
            content ? '' : 'pointer-events-none opacity-40'
          }`}
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
              2
            </span>
            <h2 className="text-xl font-bold text-gray-800">How do you want to play?</h2>
            {mode && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                <Check className="h-3 w-3" />
                {mode === 'timer' ? 'Timer Challenge' : 'Practice'}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => setMode(opt.key)}
                  disabled={!content}
                  aria-pressed={mode === opt.key}
                  className={`flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                    mode === opt.key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block font-bold text-gray-800">{opt.label}</span>
                    <span className="mt-1 block text-sm text-gray-500">{opt.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Step 3 — Launch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={() => target && router.push(target)}
            disabled={!ready}
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            {ready ? (
              <>
                <BookOpen className="h-5 w-5" />
                Start {content === 'quiz' ? 'Quiz' : 'Riddle'}{' '}
                {mode === 'timer' ? 'Challenge' : 'Practice'}
                <ArrowRight className="h-5 w-5" />
              </>
            ) : (
              'Pick content and mode above'
            )}
          </button>

          {ready && target && (
            <p className="mt-3 text-xs text-gray-400">
              Continues into <code>{target}</code> — subject and level selection happens there.
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Brain className="h-4 w-4" />
            Know what you want already?
            <Link href="/riddle-mcq" className="font-medium text-indigo-600 hover:underline">
              Riddles home
            </Link>
            ·
            <Link href="/quiz-mcq" className="font-medium text-indigo-600 hover:underline">
              Quiz home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
