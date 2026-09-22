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
import { motion, useReducedMotion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { AnswerOptions } from './AnswerOptions';
import { BubbleEmojiEffect, type BubbleEmojiEffectRef } from './BubbleEmojiEffect';
import { isAnswerCorrect } from '@/lib/quiz-mcq-scoring';
import { QuestionComments } from '@/components/quiz-mcq/QuestionComments';
import { getCommentCounts } from '@/lib/comments-api';
import { getShareCounts } from '@/lib/share-counts-api';
import { MessageCircle } from 'lucide-react';
import { LikeButton } from '@/components/likes/LikeButton';
import type { Question } from '@/types/quiz-mcq';

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
  /** BUG-040: comments panel open state — while open, the play page blocks
   *  advancing; closing it proceeds to the next question. */
  commentsOpen?: boolean;
  onToggleComments?: () => void;
  /** Closing proceeds to the next question (page-owned navigation). */
  onCloseComments?: () => void;
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
    commentsOpen,
    onToggleComments,
    onCloseComments,
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

  // Respect prefers-reduced-motion: skip decorative loops and bubbles
  const prefersReducedMotion = useReducedMotion();

  // Derive question type from level: extreme = open-ended, others = mcq
  const isOpenEnded = question.level === 'extreme';
  const correctLetter = question.correctLetter || null;

  // Single grading path — the shared scorer (normalizes extreme free text).
  const isCorrect = selectedAnswer ? isAnswerCorrect(question, selectedAnswer) : false;

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

  // BUG-048: public comment count for the action-row chip
  const [commentCount, setCommentCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    getCommentCounts('quiz-question', [question.id])
      .then((c) => {
        if (!cancelled) setCommentCount(c[question.id] ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [question.id]);

  // BUG-048: public share count for the action-row chip
  const [shareCount, setShareCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    getShareCounts('quiz-question', [question.id])
      .then((c) => {
        if (!cancelled) setShareCount(c[question.id] ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [question.id]);

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
        className="relative mx-auto w-full max-w-5xl rounded-3xl bg-white dark:bg-secondary-800 p-5 shadow-xl sm:p-8"
      >
        {/* Time Up Indicator */}
        {timeUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 text-center"
          >
            <span className="text-xl font-bold text-red-600 dark:text-red-300">⏰ TIME UP!</span>
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
          <h2 className="text-lg font-medium leading-relaxed text-gray-800 dark:text-secondary-100 sm:text-xl sm:leading-relaxed">
            {question.question}
          </h2>
        </div>

        {/* Floating Emojis - Below Question (static under reduced motion) */}
        <div className="mb-4 flex items-center justify-center gap-4">
          {relatedEmojis.map((emoji, index) => (
            <motion.span
              key={index}
              animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 2,
                      delay: index * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
              className="text-3xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {/* Score Display + question actions (owner order: like · comment · share) */}
        {score !== undefined && maxScore !== undefined && (
          <div className="mb-2 flex items-center justify-center gap-3">
            <span className="text-base font-semibold text-indigo-600 dark:text-indigo-300">
              Score: {score}/{maxScore}
            </span>
            <div className="flex items-center gap-2">
              <LikeButton contentType="quiz" questionId={question.id} />
              {onToggleComments && (
                <button
                  onClick={onToggleComments}
                  aria-expanded={commentsOpen}
                  aria-label={commentsOpen ? 'Hide comments' : 'Comment on this question'}
                  title={commentsOpen ? 'Hide comments' : 'Comment on this question'}
                  className={`flex h-7 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    commentsOpen
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Comment
                  {commentCount !== null && commentCount > 0 && (
                    <span className="font-black">{commentCount}</span>
                  )}
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                  title="Share this question"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                  {shareCount !== null && shareCount > 0 && (
                    <span className="font-black">{shareCount}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-secondary-400">
            <span>
              Question {questionNumber} of {totalQuestions}
            </span>
            <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-secondary-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500"
            />
          </div>
        </div>

        {/* Feedback Text - Randomized with Emoji (announced to screen readers) */}
        {selectedAnswer && showFeedback && feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 text-center"
            role="status"
            aria-live="polite"
          >
            <span
              className={`text-base font-semibold ${isCorrect ? 'text-green-600 dark:text-green-300' : 'text-red-500'}`}
            >
              {feedback.text} {feedback.emoji}
            </span>
          </motion.div>
        )}

        {/* Answer Options - Smaller */}
        <div className="-mx-5 sm:-mx-8">
          <AnswerOptions
            options={options}
            selectedKey={selectedAnswer}
            answerVerdict={selectedAnswer ? isCorrect : undefined}
            correctKey={
              showFeedback ? (isOpenEnded ? question.correctAnswer : correctLetter || '') : ''
            }
            onSelect={handleSelectAnswer}
            disabled={disabled || timeUp}
            showFeedback={showFeedback || false}
            level={question.level}
          />
        </div>

        {/* BUG-040: comments panel — opened from the action row above; while
            open, the play page blocks advancing; closing proceeds onward. */}
        {commentsOpen && (
          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-secondary-700">
            <QuestionComments contentType="quiz-question" questionId={question.id} autoOpen />
            <button
              onClick={() => onCloseComments?.()}
              className="mt-3 w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-500 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-indigo-500/10"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
});
