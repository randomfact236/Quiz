/**
 * ============================================================================
 * Quiz Results Page
 * ============================================================================
 * Displays quiz results with score breakdown and review
 * URL: /quiz/results?session=uuid
 * ============================================================================
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Share2, Home, Trophy } from 'lucide-react';

import type { QuizSession, QuizResult } from '@/types/quiz';
import { STORAGE_KEYS, getItem } from '@/lib/storage';
import { ScoreCard } from '@/components/quiz/ScoreCard';
import { QuestionReview } from '@/components/quiz/QuestionReview';

/** Calculate grade from percentage */
function calculateGrade(percentage: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentage >= 97) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/** Calculate result details from session */
function calculateResult(session: QuizSession): QuizResult {
  let correctCount = 0;
  let incorrectCount = 0;

  const byDifficulty = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
    expert: { correct: 0, total: 0 },
    extreme: { correct: 0, total: 0 },
  };

  session.questions.forEach((q) => {
    const isCorrect = session.answers[q.id] === q.correctAnswer;
    
    byDifficulty[q.level].total++;
    if (isCorrect) {
      correctCount++;
      byDifficulty[q.level].correct++;
    } else {
      incorrectCount++;
    }
  });

  const percentage = session.maxScore > 0 
    ? (session.score / session.maxScore) * 100 
    : 0;

  return {
    session,
    correctCount,
    incorrectCount,
    percentage,
    grade: calculateGrade(percentage),
    byDifficulty,
  };
}

function ResultsContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session') || '';
  
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load session from history
  useEffect(() => {
    const history = getItem<QuizSession[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
    const session = history.find((s) => s.id === sessionId);

    if (!session) {
      // Session not found, redirect to quiz
      router.push('/quiz');
      return;
    }

    setResult(calculateResult(session));
  }, [sessionId, router]);

  // Share results
  const handleShare = async () => {
    if (!result) return;

    const text = `I scored ${result.session.score}/${result.session.maxScore} (${Math.round(result.percentage)}%) on ${result.session.subjectName} - ${result.session.chapter}! Grade: ${result.grade}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      alert('Results copied to clipboard!');
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
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/quiz"
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
            {(['easy', 'medium', 'hard', 'expert', 'extreme'] as const).map(
              (level) => {
                const data = byDifficulty[level];
                const pct =
                  data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

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
                    <p className="mb-1 text-xs font-medium uppercase text-gray-500">
                      {level}
                    </p>
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
                    {data.total > 0 && (
                      <p className="text-xs text-gray-500">{pct}%</p>
                    )}
                  </div>
                );
              }
            )}
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
            className="w-full rounded-xl bg-white p-4 text-center font-semibold text-gray-800 shadow-lg transition-colors hover:bg-gray-50"
          >
            {showReview ? 'Hide' : 'Show'} Question Review ({session.questions.length} questions)
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

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          <Link
            href={`/quiz/play?subject=${session.subject}&chapter=${encodeURIComponent(
              session.chapter
            )}&level=${session.level}`}
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-indigo-600 p-4 text-white shadow-lg transition-colors hover:bg-indigo-700"
          >
            <RotateCcw className="h-6 w-6" />
            <span className="font-semibold">Retry Quiz</span>
          </Link>

          <Link
            href={`/quiz?subject=${session.subject}`}
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white p-4 text-gray-800 shadow-lg transition-colors hover:bg-gray-50"
          >
            <Trophy className="h-6 w-6 text-indigo-500" />
            <span className="font-semibold">More Chapters</span>
          </Link>

          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white p-4 text-gray-800 shadow-lg transition-colors hover:bg-gray-50"
          >
            <Home className="h-6 w-6 text-indigo-500" />
            <span className="font-semibold">Home</span>
          </Link>
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
