/**
 * ============================================================================
 * Riddle Review Component
 * ============================================================================
 * Shows riddle with user's answer and correct answer
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import type { Riddle } from '@/types/riddles';

interface RiddleReviewProps {
    /** The riddle */
    riddle: Riddle;
    /** User's answer (A/B/C/D) */
    userAnswer: string;
    /** Riddle number */
    riddleNumber: number;
}

export function RiddleReview({
    riddle,
    userAnswer,
    riddleNumber,
}: RiddleReviewProps): JSX.Element {
    const [isExpanded, setIsExpanded] = useState(false);

    const isCorrect = userAnswer === riddle.correctOption;
    const options = [
        { key: 'A', text: riddle.options[0] },
        { key: 'B', text: riddle.options[1] },
        { key: 'C', text: riddle.options[2] },
        { key: 'D', text: riddle.options[3] },
    ].filter(o => o.text !== undefined && o.text !== null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border-2 p-4 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
        >
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between gap-4 text-left"
            >
                <div className="flex items-center gap-3">
                    {/* Riddle Number */}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-700 shadow-sm border border-gray-100">
                        {riddleNumber}
                    </span>

                    {/* Riddle Preview */}
                    <p className="line-clamp-1 font-medium text-gray-800">
                        {riddle.question}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status Icon */}
                    {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                    )}

                    {/* Expand Icon */}
                    <motion.span
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    </motion.span>
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            {/* Difficulty Badge */}
                            <div className="mb-3">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold
                    ${riddle.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                        riddle.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            riddle.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                    }`}
                                >
                                    {riddle.difficulty.toUpperCase()}
                                </span>
                            </div>

                            {/* Full Riddle Question */}
                            <p className="mb-4 text-gray-800 text-lg font-medium">{riddle.question}</p>

                            {/* Options */}
                            <div className="space-y-2">
                                {options.map((opt) => {
                                    const isUserChoice = opt.key === userAnswer;
                                    const isCorrectAnswer = opt.key === riddle.correctOption;

                                    let style = 'rounded-lg border-2 p-3 ';
                                    if (isCorrectAnswer) {
                                        style += 'border-green-500 bg-green-100 text-green-800';
                                    } else if (isUserChoice && !isCorrect) {
                                        style += 'border-red-500 bg-red-100 text-red-800';
                                    } else {
                                        style += 'border-gray-200 bg-white text-gray-600';
                                    }

                                    return (
                                        <div key={opt.key} className={style}>
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-sm font-bold shadow-sm ${isCorrectAnswer
                                                            ? 'bg-green-500 text-white'
                                                            : isUserChoice && !isCorrect
                                                                ? 'bg-red-500 text-white'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}
                                                >
                                                    {opt.key}
                                                </span>
                                                <span className="flex-1 font-medium">{opt.text}</span>
                                                {isCorrectAnswer && (
                                                    <span className="text-sm font-bold text-green-600 uppercase tracking-widest">
                                                        Correct
                                                    </span>
                                                )}
                                                {isUserChoice && !isCorrect && (
                                                    <span className="text-sm font-bold text-red-600 uppercase tracking-widest">
                                                        Your answer
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Explanation / Hint */}
                            {(riddle.explanation || riddle.hint) && (
                                <div className="mt-5 rounded-xl bg-indigo-50 p-4 border border-indigo-100">
                                    {riddle.explanation && (
                                        <div className="mb-3">
                                            <p className="font-bold text-indigo-800 flex items-center gap-2 mb-1">💡 Explanation</p>
                                            <p className="text-sm text-indigo-900">{riddle.explanation}</p>
                                        </div>
                                    )}
                                    {riddle.hint && (
                                        <div className={`${riddle.explanation ? 'border-t border-indigo-200 pt-3' : ''}`}>
                                            <p className="font-bold text-indigo-800 flex items-center gap-2 mb-1">🔑 Hint</p>
                                            <p className="text-sm text-indigo-900">{riddle.hint}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
