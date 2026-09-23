/**
 * ============================================================================
 * /quiz-mcq/daily — Daily Challenge (NOW-08)
 * ============================================================================
 * Ten questions, the SAME ten for every visitor that day (server picks them
 * deterministically from the date), ONE attempt per identity per day, streaks
 * for consecutive days. Reuses the shared quiz card, the shared scorer and
 * the server-side grader (HARD-02) — the answer key never reaches the client
 * before an answer is committed.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Flame, Share2 } from 'lucide-react';

import { QuestionCard } from '@/components/quiz-mcq/QuestionCard';
import type { Question } from '@/types/quiz-mcq';
import {
  checkQuizAnswer,
  getDailyChallenge,
  getDailyStatus,
  submitDailyResult,
} from '@/lib/quiz-mcq-api';
import { getGuestId } from '@/lib/guest-id';
import { calculateScore, quizOptionText } from '@/lib/quiz-mcq-scoring';
import { convertQuizQuestion } from '@/hooks/use-quiz-mcq/quiz-engine.utils';

type Phase = 'loading' | 'error' | 'played' | 'playing' | 'finished';

/** Client-LOCAL calendar day — the server anchors streaks to what we send. */
function localDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function shareText(correct: number, total: number, streak: number): string {
  return `I scored ${correct}/${total} on today's PigZap Daily Challenge 🔥 ${streak}-day streak. Play it: https://pigzap.com/quiz-mcq/daily`;
}

export default function DailyChallengePage(): JSX.Element {
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dailyDate, setDailyDate] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ streak: number; bestStreak: number }>({
    streak: 0,
    bestStreak: 0,
  });
  const [playedResult, setPlayedResult] = useState<{
    score: number;
    correctCount: number;
    total: number;
  } | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const date = localDate();
    const guestId = getGuestId();
    void (async () => {
      try {
        const [set, status] = await Promise.all([
          getDailyChallenge(date),
          getDailyStatus(guestId, date),
        ]);
        if (cancelled) return;
        setDailyDate(set.date);
        setStatus({ streak: status.streak, bestStreak: status.bestStreak });
        if (status.played && status.result) {
          setPlayedResult(status.result);
          setPhase('played');
          return;
        }
        setQuestions(set.questions.map(convertQuizQuestion));
        setPhase('playing');
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = questions[index];

  const handleSelect = useCallback(
    async (option: string) => {
      const question = questions[index];
      if (!question || answers[question.id] !== undefined) return;
      // Grade by option TEXT (BUG-041 shuffle-safe), exactly like the engine.
      const answerText = quizOptionText(question, option) ?? option;
      let verdict = false;
      let explanation: string | null = null;
      try {
        const result = await checkQuizAnswer(question.id, answerText);
        verdict = !!result.correct;
        explanation = result.explanation ?? null;
      } catch {
        // Key-free payloads grade unanswerable offline — keep the flow moving
        // and let the submit total reflect the answered count.
        verdict = false;
      }
      const nextAnswers = { ...answers, [question.id]: option };
      const nextQuestions = questions.map((q) =>
        q.id === question.id ? { ...q, verdict, explanation: q.explanation ?? explanation } : q
      );
      setAnswers(nextAnswers);
      setQuestions(nextQuestions);
    },
    [answers, index, questions]
  );

  const finish = useCallback(async () => {
    const correctCount = questions.filter((q) => q.verdict === true).length;
    // The shared scorer counts correct answers (score == correct count).
    const score = calculateScore(questions, answers);
    setFinalScore(score);
    setPhase('finished');
    try {
      const result = await submitDailyResult({
        date: dailyDate || localDate(),
        score,
        correctCount,
        total: questions.length,
        guestId: getGuestId(),
      });
      setStatus({ streak: result.streak, bestStreak: result.bestStreak });
    } catch {
      // Result stays local; the streak catches up server-side next visit.
    }
  }, [answers, dailyDate, questions]);

  const handleShare = useCallback(async () => {
    const text = shareText(
      questions.filter((q) => q.verdict === true).length,
      questions.length,
      status.streak
    );
    try {
      if (navigator.share) {
        await navigator.share({ title: 'PigZap Daily Challenge', text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // Share dismissed — nothing to do.
    }
  }, [finalScore, questions, status.streak]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8 dark:from-indigo-950 dark:to-rose-950/70">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/quiz-mcq"
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white hover:shadow-md dark:bg-secondary-800/40 dark:text-secondary-200 dark:hover:bg-secondary-700/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Quiz hub
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md">
            <CalendarDays className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-secondary-100">
              Daily Challenge
            </h1>
            <p className="text-sm text-gray-600 dark:text-secondary-300">
              {dailyDate || localDate()} · same 10 questions for everyone · one attempt a day
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-black text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
            <Flame className="h-4 w-4" /> {status.streak}
          </span>
        </div>

        {phase === 'loading' && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-lg dark:bg-secondary-800 dark:text-secondary-300">
            Loading today&apos;s challenge…
          </div>
        )}

        {phase === 'error' && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-lg dark:bg-secondary-800">
            <p className="text-gray-600 dark:text-secondary-300">
              Couldn&apos;t load today&apos;s challenge. Please try again later.
            </p>
          </div>
        )}

        {phase === 'played' && playedResult && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-secondary-800">
            <p className="text-4xl">✅</p>
            <h2 className="mt-3 text-xl font-black text-gray-800 dark:text-secondary-100">
              Today is done — nice!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-secondary-300">
              You scored {playedResult.score} points ({playedResult.correctCount}/
              {playedResult.total} correct).
            </p>
            <div className="mt-5 flex items-center justify-center gap-6">
              <span className="flex items-center gap-1 text-lg font-black text-orange-600 dark:text-orange-300">
                <Flame className="h-5 w-5" /> {status.streak}-day streak
              </span>
              <span className="text-sm text-gray-500 dark:text-secondary-400">
                Best: {status.bestStreak}
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-secondary-400">
              A new set unlocks at midnight — keep the streak alive.
            </p>
          </div>
        )}

        {phase === 'playing' && current && (
          <div>
            <QuestionCard
              question={current}
              questionNumber={index + 1}
              totalQuestions={questions.length}
              selectedAnswer={answers[current.id] ?? null}
              onSelectAnswer={(option) => void handleSelect(option)}
              showFeedback={answers[current.id] !== undefined}
              disabled={answers[current.id] !== undefined}
              subjectEmoji="📅"
              score={calculateScore(questions, answers)}
              maxScore={questions.length}
            />
            {answers[current.id] !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <button
                  onClick={() =>
                    index + 1 < questions.length ? setIndex(index + 1) : void finish()
                  }
                  className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-indigo-500"
                >
                  {index + 1 < questions.length ? 'Next question' : 'See my result'}
                </button>
              </motion.div>
            )}
          </div>
        )}

        {phase === 'finished' && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-secondary-800">
            <p className="text-4xl">🏁</p>
            <h2 className="mt-3 text-2xl font-black text-gray-800 dark:text-secondary-100">
              {finalScore}/{questions.length} correct
            </h2>
            <p className="mt-1 text-gray-600 dark:text-secondary-300">Daily Challenge complete</p>
            <div className="mt-5 flex items-center justify-center gap-6">
              <span className="flex items-center gap-1 text-lg font-black text-orange-600 dark:text-orange-300">
                <Flame className="h-5 w-5" /> {status.streak}-day streak
              </span>
              <span className="text-sm text-gray-500 dark:text-secondary-400">
                Best: {status.bestStreak}
              </span>
            </div>
            <button
              onClick={() => void handleShare()}
              className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-md transition-transform hover:scale-[1.02]"
            >
              <Share2 className="h-4 w-4" />
              {shareCopied ? 'Copied!' : 'Share my result'}
            </button>
            <p className="mt-4 text-sm text-gray-500 dark:text-secondary-400">
              Come back tomorrow for a fresh set.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
