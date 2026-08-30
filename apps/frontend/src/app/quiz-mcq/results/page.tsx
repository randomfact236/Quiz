/**
 * ============================================================================
 * Quiz Results Page
 * ============================================================================
 * Displays quiz results with score breakdown and review
 * URL: /quiz-mcq/results?session=uuid
 * ============================================================================
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  RotateCcw,
  Share2,
  Home,
  Trophy,
  ChevronDown,
  ChevronUp,
  BookOpen,
  List,
} from 'lucide-react';
import toast from '@/lib/toast';

import type { QuizSession, QuizResult } from '@/types/quiz-mcq';
import { STORAGE_KEYS, getItem } from '@/lib/storage';
import { calculateResult } from '@/lib/quiz-mcq-scoring';
import { getQuizSessionHighScores, type QuizHighScore } from '@/lib/quiz-mcq-api';
import { getGuestId } from '@/lib/guest-id';
import { ScoreCard } from '@/components/quiz-mcq/ScoreCard';
import { QuestionReview } from '@/components/quiz-mcq/QuestionReview';
import { ResultsCelebration } from '@/components/quiz-mcq/ResultsCelebration';

function ResultsContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams?.get('session') || '';

  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [personalBest, setPersonalBest] = useState<QuizHighScore | null>(null);

  // Load session from history
  useEffect(() => {
    const history = getItem<QuizSession[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
    const session = history.find((s) => s.id === sessionId);

    if (!session) {
      // Session not found, redirect to quiz
      router.push('/quiz-mcq');
      return;
    }

    setResult(calculateResult(session));
    setShowCelebration(true);

    // Server-side high score (plan/02-mcq-quiz.md P1 #1) — survives browser loss.
    getQuizSessionHighScores(getGuestId()).then((scores) => {
      const match = scores.find((s) => s.subjectSlug === session.subject);
      setPersonalBest(match ?? null);
    });
  }, [sessionId, router]);

  // Share results
  const handleShare = async () => {
    if (!result) return;

    const text = `I scored ${result.session.score}/${result.session.maxScore} (${Math.round(result.percentage)}%) on ${result.session.subjectName} - ${result.session.chapter}! Grade: ${result.grade}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Results copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      toast.error('Failed to copy results to clipboard.');
    }
  };

  // Loading state
  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-xl font-semibold text-white">Loading results...</p>
        </div>
      </div>
    );
  }

  const { session, correctCount, incorrectCount, percentage, grade, byDifficulty } = result;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-3 py-4">
      {/* Results Celebration */}
      <ResultsCelebration
        trigger={showCelebration}
        score={result?.session.score || 0}
        maxScore={result?.session.maxScore || 10}
      />

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/quiz-mcq"
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz
          </Link>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
            >
              <Share2 className="h-4 w-4" />
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Action Buttons - Moved to Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-3"
        >
          {/* Primary Actions - Row 1 */}
          <div className="grid grid-cols-3 gap-3">
            <Link
              href={`/quiz-mcq/play?subject=${session.subject}&chapter=${encodeURIComponent(session.chapter)}&level=${session.level}`}
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-indigo-600 p-3 text-white shadow-lg transition-colors hover:bg-indigo-700"
            >
              <RotateCcw className="h-5 w-5" />
              <span className="text-xs font-semibold">Retry Quiz</span>
            </Link>

            <Link
              href={`/quiz-mcq?subject=${session.subject}&chapter=${encodeURIComponent(session.chapter)}`}
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white p-3 text-gray-800 shadow-lg transition-colors hover:bg-gray-50"
            >
              <List className="h-5 w-5 text-indigo-500" />
              <span className="text-xs font-semibold">Difficulty</span>
            </Link>

            <Link
              href={`/quiz-mcq?subject=${session.subject}`}
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white p-3 text-gray-800 shadow-lg transition-colors hover:bg-gray-50"
            >
              <BookOpen className="h-5 w-5 text-indigo-500" />
              <span className="text-xs font-semibold">Chapters</span>
            </Link>
          </div>

          {/* Secondary Actions - Row 2 */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/quiz-mcq"
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white p-3 text-gray-800 shadow-lg transition-colors hover:bg-gray-50"
            >
              <Trophy className="h-5 w-5 text-indigo-500" />
              <span className="text-xs font-semibold">All Subjects</span>
            </Link>

            <Link
              href="/"
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white p-3 text-gray-800 shadow-lg transition-colors hover:bg-gray-50"
            >
              <Home className="h-5 w-5 text-indigo-500" />
              <span className="text-xs font-semibold">Home</span>
            </Link>
          </div>
        </motion.div>

        {/* Score Card */}
        <div className="mb-6">
          <ScoreCard
            score={session.score}
            total={session.maxScore}
            percentage={percentage}
            grade={grade}
            timeTaken={session.timeTaken}
          />
        </div>

        {/* Server-side personal best for this subject (may not exist yet) */}
        {personalBest && personalBest.bestScore >= session.score && (
          <div className="mb-6 rounded-2xl bg-white/90 p-4 text-center shadow-lg">
            <p className="text-sm font-medium text-gray-700">
              <Trophy className="mr-1 inline h-4 w-4 text-yellow-500" />
              Your best on {personalBest.subjectName || 'this subject'}: {personalBest.bestScore}/
              {personalBest.maxScore} across {personalBest.sessions} saved session
              {personalBest.sessions === 1 ? '' : 's'}
            </p>
          </div>
        )}

        {/* Performance Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-2xl bg-white p-6 shadow-lg"
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Performance by Difficulty
          </h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {(['easy', 'medium', 'hard', 'expert', 'extreme'] as const).map((level) => {
              const data = byDifficulty[level];
              const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

              return (
                <div
                  key={level}
                  className={`rounded-xl p-3 text-center ${
                    data.total === 0
                      ? 'bg-gray-100'
                      : pct >= 70
                        ? 'bg-green-50'
                        : pct >= 50
                          ? 'bg-yellow-50'
                          : 'bg-red-50'
                  }`}
                >
                  <p className="mb-1 text-xs font-medium uppercase text-gray-500">{level}</p>
                  <p
                    className={`text-xl font-bold ${
                      data.total === 0
                        ? 'text-gray-400'
                        : pct >= 70
                          ? 'text-green-600'
                          : pct >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                    }`}
                  >
                    {data.total === 0 ? '-' : `${data.correct}/${data.total}`}
                  </p>
                  {data.total > 0 && <p className="text-xs text-gray-500">{pct}%</p>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 rounded-2xl bg-white p-6 shadow-lg"
        >
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">{correctCount}</p>
              <p className="text-sm text-gray-500">Correct Answers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">{incorrectCount}</p>
              <p className="text-sm text-gray-500">Incorrect Answers</p>
            </div>
          </div>
        </motion.div>

        {/* Question Review Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowReview(!showReview)}
            className="w-full rounded-xl bg-white p-4 text-center font-semibold text-gray-800 shadow-lg transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            {showReview ? 'Hide' : 'Show'} Question Review ({session.questions.length} questions)
            {showReview ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {showReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {session.questions.map((q, index) => (
                <QuestionReview
                  key={q.id}
                  question={q}
                  userAnswer={session.answers[q.id] || 'N/A'}
                  questionNumber={index + 1}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function QuizResultsPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-xl font-semibold text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
