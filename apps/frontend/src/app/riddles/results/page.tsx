/**
 * ============================================================================
 * Riddle Results Page
 * ============================================================================
 * Displays riddle session results with score breakdown and review
 * URL: /riddles/results?session=uuid
 * ============================================================================
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Share2, Home, Trophy } from 'lucide-react';

import type { RiddleSession, RiddleResult } from '@/types/riddles';
import { getRiddleSessionById } from '@/lib/riddle-session';
import { ScoreCard } from '@/components/quiz/ScoreCard';
import { ResultsCelebration } from '@/components/quiz/ResultsCelebration';
import { RiddleReview } from '../components/RiddleReview';

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
function calculateResult(session: RiddleSession): RiddleResult {
    let correctCount = 0;
    let incorrectCount = 0;

    const byDifficulty = {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 },
        expert: { correct: 0, total: 0 },
    };

    session.riddles.forEach((r) => {
        const isCorrect = session.answers[r.id] === r.correctOption;
        const diff = r.difficulty as keyof typeof byDifficulty;

        // Safety check just in case difficulty is missing or invalid
        if (byDifficulty[diff]) {
            byDifficulty[diff].total++;
            if (isCorrect) {
                correctCount++;
                byDifficulty[diff].correct++;
            } else if (session.answers[r.id]) {
                // only count as incorrect if they answered it
                incorrectCount++;
            }
        }
    });

    const percentage = session.riddles.length > 0
        ? (correctCount / session.riddles.length) * 100
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
    const sessionId = searchParams?.get('session') || '';

    const [result, setResult] = useState<RiddleResult | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // Load session from storage
    useEffect(() => {
        const session = getRiddleSessionById(sessionId);

        if (!session) {
            // Session not found, redirect to riddles home
            router.push('/riddles');
            return;
        }

        setResult(calculateResult(session));
        // Trigger celebration after a short delay
        setTimeout(() => setShowCelebration(true), 500);
    }, [sessionId, router]);

    // Share results
    const handleShare = async () => {
        if (!result) return;

        const gameMode = result.session.mode === 'timer' ? 'Challenge' : 'Practice';
        const text = `I scored ${result.correctCount}/${result.session.riddles.length} (${Math.round(result.percentage)}%) in the ${result.session.chapterName} Riddle ${gameMode}! Grade: ${result.grade}`;

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
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8]">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                    <p className="text-xl font-semibold text-indigo-900">Calculating results...</p>
                </div>
            </div>
        );
    }

    const { session, correctCount, incorrectCount, percentage, grade, byDifficulty } = result;

    const backPath = session.mode === 'timer' ? '/riddles/challenge' : '/riddles/practice';
    const retryPath = `/riddles/play?chapterId=${session.chapterId}&level=${session.difficulty}&mode=${session.mode}`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
            {/* Results Celebration */}
            <ResultsCelebration
                trigger={showCelebration}
                score={correctCount || 0}
                maxScore={session.riddles.length || 10}
            />

            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href={backPath}
                        className="inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 font-medium text-gray-700 shadow-sm transition-colors hover:bg-white/60"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back to {session.mode === 'timer' ? 'Challenge' : 'Practice'}
                    </Link>

                    <div className="flex gap-2">
                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                        >
                            <Share2 className="h-4 w-4" />
                            {copied ? 'Copied!' : 'Share Results'}
                        </button>
                    </div>
                </div>

                {/* Score Card */}
                <div className="mb-8">
                    <ScoreCard
                        score={correctCount}
                        total={session.riddles.length}
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
                    className="mb-8 rounded-3xl bg-white p-6 shadow-lg sm:p-8"
                >
                    <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-gray-800">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Performance by Difficulty
                    </h3>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {(['easy', 'medium', 'hard', 'expert'] as const).map(
                            (level) => {
                                const data = byDifficulty[level];
                                const pct =
                                    data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

                                return (
                                    <div
                                        key={level}
                                        className={`rounded-2xl p-4 text-center border-2 ${data.total === 0
                                            ? 'bg-gray-50 border-gray-100'
                                            : pct >= 70
                                                ? 'bg-green-50 border-green-200'
                                                : pct >= 50
                                                    ? 'bg-yellow-50 border-yellow-200'
                                                    : 'bg-red-50 border-red-200'
                                            }`}
                                    >
                                        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                                            {level}
                                        </p>
                                        <p
                                            className={`text-2xl font-black ${data.total === 0
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
                                            <p className="mt-1 font-medium text-sm text-gray-500">{pct}% Success</p>
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
                    className="mb-8 rounded-3xl bg-white p-6 shadow-lg sm:p-8"
                >
                    <div className="grid grid-cols-2 gap-6 text-center divide-x border-gray-100">
                        <div>
                            <p className="text-4xl font-black text-green-600 mb-1">{correctCount}</p>
                            <p className="text-sm font-bold uppercase tracking-wide text-gray-400">Correct Riddles</p>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-red-600 mb-1">{incorrectCount}</p>
                            <p className="text-sm font-bold uppercase tracking-wide text-gray-400">Incorrect</p>
                        </div>
                    </div>
                </motion.div>

                {/* Riddle Review Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => setShowReview(!showReview)}
                        className="w-full rounded-2xl bg-white p-5 text-center text-lg font-bold text-gray-800 shadow-lg transition-colors hover:bg-gray-50 border-2 border-transparent hover:border-gray-200"
                    >
                        {showReview ? 'Hide' : 'Show'} Riddle Review ({session.riddles.length} riddles)
                    </button>

                    {showReview && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 space-y-4"
                        >
                            {session.riddles.map((r, index) => (
                                <RiddleReview
                                    key={r.id}
                                    riddle={r}
                                    userAnswer={session.answers[r.id] || 'N/A'}
                                    riddleNumber={index + 1}
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
                        href={retryPath}
                        className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-indigo-600 p-6 text-white shadow-lg transition-colors hover:bg-indigo-700"
                    >
                        <RotateCcw className="h-8 w-8" />
                        <span className="font-bold text-lg">Play Again</span>
                    </Link>

                    <Link
                        href={backPath}
                        className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-6 text-gray-800 shadow-lg transition-all hover:bg-gray-50 hover:-translate-y-1"
                    >
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        <span className="font-bold text-lg">Change Level</span>
                    </Link>

                    <Link
                        href="/"
                        className="flex flex-col items-center justify-center gap-3 col-span-2 sm:col-span-1 rounded-2xl bg-white p-6 text-gray-800 shadow-lg transition-all hover:bg-gray-50 hover:-translate-y-1"
                    >
                        <Home className="h-8 w-8 text-indigo-500" />
                        <span className="font-bold text-lg">Home Menu</span>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

export default function RiddleResultsPage(): JSX.Element {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8]">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        <p className="text-xl font-semibold text-indigo-900">Loading...</p>
                    </div>
                </div>
            }
        >
            <ResultsContent />
        </Suspense>
    );
}
