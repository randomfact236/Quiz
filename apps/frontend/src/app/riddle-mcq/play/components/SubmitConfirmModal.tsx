'use client';

import { motion } from 'framer-motion';

interface SubmitConfirmModalProps {
  answeredCount: number;
  totalRiddles: number;
  onContinue: () => void;
  onSubmit: () => void;
}

/** Confirm-submit dialog with unanswered warning and "add more riddles" escape hatch. */
export function SubmitConfirmModal({
  answeredCount,
  totalRiddles,
  onContinue,
  onSubmit,
}: SubmitConfirmModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-2 text-xl font-bold text-gray-800">Submit Riddles?</h2>

        {answeredCount < totalRiddles ? (
          <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-yellow-800">
            <p className="font-medium">⚠️ Not all riddles answered!</p>
            <p className="text-sm">
              You&apos;ve answered {answeredCount} of {totalRiddles} riddles.
            </p>
          </div>
        ) : (
          <p className="mb-4 text-gray-600">
            You&apos;ve answered all riddles. Ready to see your results?
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
          >
            Continue
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
