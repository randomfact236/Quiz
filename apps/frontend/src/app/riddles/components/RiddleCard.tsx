/**
 * ============================================================================
 * Riddle Card Component
 * ============================================================================
 * Displays a single riddle with answer options and instant feedback.
 * Mirrors QuestionCard structure — uses shared AnswerOptions component.
 * Layout: Question → Floating Emojis → Score + Progress → Answers
 * Features: Randomized feedback, bubble emoji effects
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { AnswerOptions } from '@/components/quiz/AnswerOptions';
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

    // Floating emojis based on difficulty
    const floatingEmojis = getFloatingEmojis(riddle.difficulty);

    // Build options array from riddle data
    const options = riddle.options.map((text, index) => ({
        key: String.fromCharCode(65 + index),
        text,
    }));

    // Map riddle difficulty to AnswerOptions level prop
    const level = (riddle.difficulty as 'easy' | 'medium' | 'hard' | 'expert') || 'expert';

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
        onSelectAnswer(optionLetter);
    }, [onSelectAnswer]);

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

                {/* Floating Emojis — Below Question */}
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

                {/* Answer Options — Using shared AnswerOptions for level-aware option count */}
                <AnswerOptions
                    options={options}
                    selectedKey={selectedAnswer}
                    correctKey={showFeedback ? riddle.correctOption : ''}
                    onSelect={handleSelectAnswer}
                    disabled={disabled || timeUp}
                    showFeedback={showFeedback || false}
                    level={level}
                />
            </motion.div>
        </>
    );
});
