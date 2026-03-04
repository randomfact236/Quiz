/**
 * ============================================================================
 * Riddle Card Component
 * ============================================================================
 * Displays a single riddle with answer options and instant feedback
 * Layout: Question → Floating Emojis → Score + Progress → Answers
 * Features: Randomized feedback, bubble emoji effects
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { BubbleEmojiEffect, type BubbleEmojiEffectRef } from '@/components/quiz/BubbleEmojiEffect';
import type { Riddle } from '@/types/riddles';

interface RiddleCardProps {
    /** The riddle to display */
    riddle: Riddle;
    /** Current riddle number (1-based) */
    riddleNumber: number;
    /** Total number of riddles */
    totalRiddles: number;
    /** Currently selected answer (A/B/C/D) */
    selectedAnswer: string | null;
    /** Callback when answer is selected */
    onSelectAnswer: (option: string) => void;
    /** Whether to show feedback immediately */
    showFeedback?: boolean;
    /** Whether the card is disabled */
    disabled?: boolean;
    /** Current score */
    score?: number;
    /** Max possible score (usually totalRiddles) */
    maxScore?: number;
    /** Time up indicator */
    timeUp?: boolean;
    /** Ref to track which riddles have shown bubbles */
    shownBubblesRef?: React.MutableRefObject<Set<string>>;
}

export interface RiddleCardRef {
    clearBubbles: () => void;
}

/** Randomized feedback messages */
const FEEDBACK_MESSAGES = {
    correct: [
        { text: 'Brilliant Mind!', emoji: '🧠' },
        { text: 'Nailed it!', emoji: '🎯' },
        { text: 'Outstanding!', emoji: '🌟' },
        { text: 'Riddle Solved!', emoji: '🔓' },
        { text: 'Genius!', emoji: '💡' },
    ],
    wrong: [
        { text: 'Not quite right', emoji: '🤔' },
        { text: 'Keep guessing', emoji: '🧐' },
        { text: 'Tricky one!', emoji: '🧩' },
        { text: 'Try another', emoji: '🔄' },
        { text: 'Almost there', emoji: '🤏' },
    ],
};

function getRandomFeedback(type: 'correct' | 'wrong'): { text: string; emoji: string } {
    const messages = FEEDBACK_MESSAGES[type];
    const index = Math.floor(Math.random() * messages.length);
    return messages[index]!;
}

/** Get floaty emojis based on riddle difficulty */
function getFloatingEmojis(difficulty?: string): string[] {
    const map: Record<string, string[]> = {
        easy: ['🧩', '🔐'],
        medium: ['🤔', '💭'],
        hard: ['🔍', '🧠'],
        expert: ['⚡', '🎯'],
    };
    return map[difficulty ?? ''] ?? ['🧩', '💡'];
}

export const RiddleCard = forwardRef<RiddleCardRef, RiddleCardProps>(function RiddleCard({
    riddle,
    riddleNumber,
    totalRiddles,
    selectedAnswer,
    onSelectAnswer,
    showFeedback = true,
    disabled = false,
    score,
    maxScore,
    timeUp = false,
    shownBubblesRef,
}, ref): JSX.Element {

    // Check if answer is correct for feedback display
    const isCorrect = selectedAnswer === riddle.correctOption;
    const isWrong = selectedAnswer && selectedAnswer !== riddle.correctOption;

    // Randomized feedback state
    const [feedback, setFeedback] = useState<{ text: string; emoji: string } | null>(null);

    // Bubble effect trigger
    const [bubbleTrigger, setBubbleTrigger] = useState(false);
    const [bubbleType, setBubbleType] = useState<'correct' | 'wrong'>('correct');

    // Ref to control bubble effect
    const bubbleRef = useRef<BubbleEmojiEffectRef>(null);

    // Use the passed ref or create a local one if not provided
    const localShownBubblesRef = useRef<Set<string>>(new Set());
    const activeShownBubblesRef = shownBubblesRef || localShownBubblesRef;
    const prevRiddleIdRef = useRef<string>(riddle.id);

    // Floating emojis
    const floatingEmojis = getFloatingEmojis(riddle.difficulty);

    // Expose clearBubbles function via ref
    useImperativeHandle(ref, () => ({
        clearBubbles: () => {
            bubbleRef.current?.clear();
            setBubbleTrigger(false);
        },
    }));

    // Handle riddle navigation - clear bubbles when riddle changes
    useEffect(() => {
        if (riddle.id !== prevRiddleIdRef.current) {
            bubbleRef.current?.clear();
            setBubbleTrigger(false);
            prevRiddleIdRef.current = riddle.id;
        }
    }, [riddle.id]);

    // Trigger bubbles when answer is selected - only once per riddle
    useEffect(() => {
        if (selectedAnswer && showFeedback) {
            if (!activeShownBubblesRef.current.has(riddle.id)) {
                activeShownBubblesRef.current.add(riddle.id);
                if (isCorrect) {
                    setFeedback(getRandomFeedback('correct'));
                    setBubbleType('correct');
                    setBubbleTrigger(true);
                } else if (isWrong) {
                    setFeedback(getRandomFeedback('wrong'));
                    setBubbleType('wrong');
                    setBubbleTrigger(true);
                }
            }
        } else if (!selectedAnswer) {
            setFeedback(null);
        }
    }, [selectedAnswer, showFeedback, isCorrect, isWrong, riddle.id]);

    // Handle answer selection
    const handleSelectAnswer = useCallback((optionLetter: string) => {
        if (!disabled && !selectedAnswer) {
            onSelectAnswer(optionLetter);
        }
    }, [onSelectAnswer, disabled, selectedAnswer]);

    // Build options array from riddle
    const options = riddle.options.map((text, index) => ({
        key: String.fromCharCode(65 + index),
        text,
    }));

    // Get option style — mirrors AnswerOptions component logic
    const getOptionStyle = (key: string): string => {
        const base = 'relative flex items-center justify-center rounded-xl border-2 py-3 px-4 text-center text-base font-medium transition-all duration-200 w-full ';

        if (selectedAnswer && showFeedback) {
            if (key === riddle.correctOption) {
                return base + 'border-green-500 bg-green-50 text-green-800';
            }
            if (key === selectedAnswer && key !== riddle.correctOption) {
                return base + 'border-red-500 bg-red-50 text-red-800';
            }
            return base + 'border-gray-200 bg-gray-50 text-gray-400 opacity-60';
        }

        if (selectedAnswer === key) {
            return base + 'border-indigo-400 bg-indigo-50 text-indigo-900 shadow-md';
        }

        return base + 'border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50';
    };

    // Grid layout: 2 cols for 2 options, 2 cols for 4 options, 3 cols for 3
    const gridClass = options.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : options.length === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2';

    return (
        <>
            {/* Bubble Emoji Effect */}
            <BubbleEmojiEffect
                ref={bubbleRef}
                trigger={bubbleTrigger}
                type={bubbleType}
                count={60}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative mx-auto w-full max-w-5xl rounded-3xl bg-white p-5 shadow-xl sm:p-8"
            >
                {/* Time Up Indicator */}
                {timeUp && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-4 text-center"
                    >
                        <span className="text-xl font-bold text-red-600">⏰ TIME UP!</span>
                    </motion.div>
                )}

                {/* Riddle Question Text */}
                <div className="mb-4 text-center">
                    <h2 className="text-lg font-medium leading-relaxed text-gray-800 sm:text-xl sm:leading-relaxed">
                        {riddle.question}
                    </h2>
                </div>

                {/* Floating Emojis — Below Question, like QuestionCard */}
                <div className="mb-4 flex items-center justify-center gap-4">
                    {floatingEmojis.map((emoji, index) => (
                        <motion.span
                            key={index}
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                                duration: 2,
                                delay: index * 0.3,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            className="text-3xl"
                        >
                            {emoji}
                        </motion.span>
                    ))}
                </div>

                {/* Score Display */}
                {score !== undefined && maxScore !== undefined && (
                    <div className="mb-2 text-center">
                        <span className="text-base font-semibold text-indigo-600">
                            Score: {score}/{maxScore}
                        </span>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mb-5">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                        <span>Riddle {riddleNumber} of {totalRiddles}</span>
                        <span>{Math.round((riddleNumber / totalRiddles) * 100)}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(riddleNumber / totalRiddles) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500"
                        />
                    </div>
                </div>

                {/* Feedback Text */}
                {selectedAnswer && showFeedback && feedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-4 text-center"
                    >
                        <span className={`text-base font-semibold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                            {feedback.text} {feedback.emoji}
                        </span>
                    </motion.div>
                )}

                {/* Answer Options — Grid layout matching AnswerOptions component */}
                <div className={`grid gap-4 ${gridClass}`}>
                    {options.map((option) => {
                        const isSelected = selectedAnswer === option.key;
                        const isOptionCorrect = showFeedback && riddle.correctOption === option.key;
                        const isOptionWrong = showFeedback && isSelected && riddle.correctOption !== option.key;

                        return (
                            <motion.button
                                key={option.key}
                                onClick={() => handleSelectAnswer(option.key)}
                                whileHover={!disabled && !selectedAnswer ? { scale: 1.02 } : {}}
                                whileTap={!disabled && !selectedAnswer ? { scale: 0.98 } : {}}
                                disabled={disabled || selectedAnswer !== null}
                                className={getOptionStyle(option.key)}
                            >
                                {/* Option Text */}
                                <span className="text-lg font-medium">{option.text}</span>

                                {/* Status Icon */}
                                {showFeedback && selectedAnswer && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {isOptionCorrect && <span className="text-2xl text-green-600">✓</span>}
                                        {isOptionWrong && <span className="text-2xl text-red-500">✕</span>}
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
        </>
    );
});
