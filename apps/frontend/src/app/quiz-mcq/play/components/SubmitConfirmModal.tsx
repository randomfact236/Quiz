/**
 * Confirm submit modal — warns when questions are unanswered.
 * Extracted from play/page.tsx (P1 refactor).
 */

'use client';

import { motion } from 'framer-motion';

interface SubmitConfirmModalProps {
  answeredCount: number;
  totalQuestions: number;
  /** "Continue Quiz" — closes and opens the extend-session modal upstream. */
  onCancel: () => void;
  onSubmit: () => void;
}

export function SubmitConfirmModal({
  answeredCount,
  totalQuestions,
  onCancel,
  onSubmit,
}: SubmitConfirmModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-2 text-xl font-bold text-gray-800">Submit Quiz?</h2>

        {answeredCount < totalQuestions ? (
          <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-yellow-800">
            <p className="font-medium">⚠️ Not all questions answered!</p>
            <p className="text-sm">
              You&apos;ve answered {answeredCount} of {totalQuestions} questions.
            </p>
          </div>
        ) : (
          <p className="mb-4 text-gray-600">
            You&apos;ve answered all questions. Ready to see your results?
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
          >
            Continue Quiz
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Submit
          </button>
        </div>
      </motion.div>
    </div>
  );
}
