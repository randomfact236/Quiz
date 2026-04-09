/**
 * ============================================================================
 * Question Card Component
 * ============================================================================
 * Displays a single question with answer options and instant feedback
 * Layout: Question → Floating Emojis → Score + Progress → Answers
 * Features: Randomized feedback, bubble emoji effects
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { AnswerOptions } from './AnswerOptions';
import { BubbleEmojiEffect, type BubbleEmojiEffectRef } from './BubbleEmojiEffect';
import type { Question } from '@/types/quiz';

interface QuestionCardProps {
  /** The question to display */
  question: Question;
  /** Current question number (1-based) */
  questionNumber: number;
  /** Total number of questions (max 10) */
  totalQuestions: number;
  /** Currently selected answer (A/B/C/D) */
  selectedAnswer: string | null;
  /** Callback when answer is selected */
  onSelectAnswer: (option: string) => void;
  /** Whether to show feedback immediately */
  showFeedback?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Subject emoji to display */
  subjectEmoji?: string;
  /** Current score */
  score?: number;
  /** Max possible score */
  maxScore?: number;
  /** Time up indicator */
  timeUp?: boolean;
  /** Ref to track which questions have shown bubbles */
  shownBubblesRef?: React.MutableRefObject<Set<string>>;
  /** Per-question time remaining (seconds) — shows countdown ring when provided */
  questionTimeRemaining?: number;
  /** Per-question time limit (seconds) — used to calculate ring progress */
  questionTimeLimit?: number;
  /** Share callback */
  onShare?: () => void;
}

export interface QuestionCardRef {
  clearBubbles: () => void;
}

/** Get related emojis based on subject/chapter */
function getRelatedEmojis(subjectEmoji?: string): string[] {
  const emojiMap: Record<string, string[]> = {
    '🔬': ['⚛️', '🧪'],
    '🔢': ['➕', '📐'],
    '📜': ['🏛️', '⚔️'],
    '🌍': ['🗺️', '🧭'],
    '📖': ['✏️', '📚'],
    '🌱': ['🍃', '🌿'],
    '💻': ['💾', '🖱️'],
    '💼': ['📊', '📈'],
    '💪': ['🏃', '🥗'],
    '👶': ['🍼', '🧸'],
    '🐸': ['🦎', '🐊'],
    '🦁': ['🐯', '🐆'],
    '🐶': ['🐕', '🦴'],
    '🐱': ['🐈', '🐟'],
    '🐦': ['🦅', '🪶'],
  };

  return emojiMap[subjectEmoji || ''] || ['❓', '❔'];
}

/** Randomized feedback messages */
const FEEDBACK_MESSAGES = {
  correct: [
    { text: 'Excellent!', emoji: '🌟' },
    { text: 'Perfect!', emoji: '✨' },
    { text: 'Outstanding!', emoji: '🎯' },
    { text: 'Brilliant!', emoji: '💡' },
    { text: 'Superb!', emoji: '🏆' },
  ],
  wrong: [
    { text: 'Try next', emoji: '📚' },
    { text: 'Keep learning', emoji: '📖' },
    { text: 'Review this', emoji: '🔍' },
    { text: 'Study more', emoji: '💪' },
    { text: 'Not quite', emoji: '❌' },
  ],
};

function getRandomFeedback(type: 'correct' | 'wrong'): { text: string; emoji: string } {
  const messages = FEEDBACK_MESSAGES[type];
  const index = Math.floor(Math.random() * messages.length);
  return messages[index]!;
}

/** Circular countdown ring — shown inside the card per question */
function QuestionTimerRing({
  timeRemaining,
  timeLimit,
}: {
  timeRemaining: number;
  timeLimit: number;
}): JSX.Element {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, timeRemaining / timeLimit));
  const strokeDashoffset = circumference * (1 - progress);
  const isWarning = timeRemaining <= 10;
  const isCritical = timeRemaining <= 5;
  const color = isCritical ? '#ef4444' : isWarning ? '#f97316' : '#6366f1';

  return (
    <div
      className={`relative flex items-center justify-center ${isCritical ? 'animate-pulse' : ''}`}
    >
      <svg width={56} height={56} className="-rotate-90">
        <circle cx={28} cy={28} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={4} />
        <circle
          cx={28}
          cy={28}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>
        {timeRemaining}
      </span>
    </div>
  );
}

export const QuestionCard = forwardRef<QuestionCardRef, QuestionCardProps>(function QuestionCard(
  {
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    onSelectAnswer,
    showFeedback,
    disabled = false,
    subjectEmoji,
    score,
    maxScore,
    timeUp = false,
    shownBubblesRef,
    questionTimeRemaining,
    questionTimeLimit,
    onShare,
  },
  ref
): JSX.Element {
  // Map question options to the format AnswerOptions expects
  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  // Get 2 related emojis
  const relatedEmojis = getRelatedEmojis(subjectEmoji);

  // Derive question type from level: extreme = open-ended, others = mcq
  const isOpenEnded = question.level === 'extreme';
  const correctLetter = question.correctLetter || null;

  const isCorrect = isOpenEnded
    ? selectedAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()
    : selectedAnswer === correctLetter;

  const isWrong = selectedAnswer && !isCorrect;

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
  const prevQuestionIdRef = useRef<string>(question.id);

  // Expose clearBubbles function via ref
  useImperativeHandle(ref, () => ({
    clearBubbles: () => {
      bubbleRef.current?.clear();
      setBubbleTrigger(false); // Reset trigger so bubbles disappear
    },
  }));

  // Handle question navigation - clear bubbles when question changes
  useEffect(() => {
    if (question.id !== prevQuestionIdRef.current) {
      // Question changed - clear bubbles immediately
      bubbleRef.current?.clear();
      setBubbleTrigger(false);
      prevQuestionIdRef.current = question.id;
    }
  }, [question.id]);

  // Trigger bubbles when answer is selected - only once per question
  useEffect(() => {
    if (selectedAnswer && showFeedback) {
      // Only trigger if not already shown for this question
      if (!activeShownBubblesRef.current.has(question.id)) {
        activeShownBubblesRef.current.add(question.id);
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
      // Reset feedback when no answer
      setFeedback(null);
    }
  }, [selectedAnswer, showFeedback, isCorrect, isWrong, question.id]);

  // Handle answer selection - DON'T clear bubbles
  const handleSelectAnswer = useCallback(
    (option: string) => {
      // Bubbles stay visible until navigation buttons clicked
      onSelectAnswer(option);
    },
    [onSelectAnswer]
  );

  return (
    <>
      {/* Bubble Emoji Effect */}
      <BubbleEmojiEffect ref={bubbleRef} trigger={bubbleTrigger} type={bubbleType} count={60} />

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

        {/* Per-Question Countdown Ring */}
        {questionTimeRemaining !== undefined && questionTimeLimit !== undefined && !timeUp && (
          <div className="mb-3 flex justify-center">
            <QuestionTimerRing
              timeRemaining={questionTimeRemaining}
              timeLimit={questionTimeLimit}
            />
          </div>
        )}

        {/* Question Text - Top */}
        <div className="mb-4 text-center">
          <h2 className="text-lg font-medium leading-relaxed text-gray-800 sm:text-xl sm:leading-relaxed">
            {question.question}
          </h2>
        </div>

        {/* Floating Emojis - Below Question */}
        <div className="mb-4 flex items-center justify-center gap-4">
          {relatedEmojis.map((emoji, index) => (
            <motion.span
              key={index}
              animate={{
                y: [0, -8, 0],
              }}
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

        {/* Score Display - Above Progress Bar */}
        {score !== undefined && maxScore !== undefined && (
          <div className="mb-2 flex items-center justify-center gap-3">
            <span className="text-base font-semibold text-indigo-600">
              Score: {score}/{maxScore}
            </span>
            {onShare && (
              <button
                onClick={onShare}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                title="Share this question"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>
              Question {questionNumber} of {totalQuestions}
            </span>
            <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500"
            />
          </div>
        </div>

        {/* Feedback Text - Randomized with Emoji */}
        {selectedAnswer && showFeedback && feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 text-center"
          >
            <span
              className={`text-base font-semibold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}
            >
              {feedback.text} {feedback.emoji}
            </span>
          </motion.div>
        )}

        {/* Answer Options - Smaller */}
        <AnswerOptions
          options={options}
          selectedKey={selectedAnswer}
          correctKey={
            showFeedback ? (isOpenEnded ? question.correctAnswer : correctLetter || '') : ''
          }
          onSelect={handleSelectAnswer}
          disabled={disabled || timeUp}
          showFeedback={showFeedback || false}
          level={question.level}
        />
      </motion.div>
    </>
  );
});
