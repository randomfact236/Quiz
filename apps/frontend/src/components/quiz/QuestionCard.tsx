/**
 * ============================================================================
 * Question Card Component
 * ============================================================================
 * Displays a single question with answer options
 * ============================================================================
 */

'use client';

import { motion } from 'framer-motion';
import { AnswerOptions } from './AnswerOptions';
import type { Question } from '@/types/quiz';

interface QuestionCardProps {
  /** The question to display */
  question: Question;
  /** Current question number (1-based) */
  questionNumber: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Currently selected answer (A/B/C/D) */
  selectedAnswer: string | null;
  /** Callback when answer is selected */
  onSelectAnswer: (option: string) => void;
  /** Whether to show feedback immediately */
  showFeedback?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  showFeedback = false,
  disabled = false,
}: QuestionCardProps): JSX.Element {
  // Map question options to the format AnswerOptions expects
  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  // Get difficulty color
  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'easy':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'hard':
        return 'text-orange-600 bg-orange-50';
      case 'expert':
        return 'text-red-600 bg-red-50';
      case 'extreme':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-white p-6 shadow-lg sm:p-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span
            className={`rounded-lg px-3 py-1 text-xs font-medium capitalize ${getDifficultyColor(
              question.level
            )}`}
          >
            {question.level}
          </span>
        </div>
        {question.chapter && (
          <span className="text-sm text-gray-500">{question.chapter}</span>
        )}
      </div>

      {/* Question Text */}
      <h2 className="mb-8 text-xl font-semibold leading-relaxed text-gray-800 sm:text-2xl">
        {question.question}
      </h2>

      {/* Answer Options */}
      <AnswerOptions
        options={options}
        selectedKey={selectedAnswer}
        correctKey={showFeedback ? question.correctAnswer : ''}
        onSelect={onSelectAnswer}
        disabled={disabled}
        showFeedback={showFeedback}
      />
    </motion.div>
  );
}
