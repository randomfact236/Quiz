'use client';

import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

interface ResumePromptModalProps {
  onResume: () => void;
  onStartNew: () => void;
}

/** Full-screen resume dialog shown when an unfinished session matches the URL. */
export function ResumePromptModal({ onResume, onStartNew }: ResumePromptModalProps): JSX.Element {
  return (
    <div className="flex items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Resume Session?</h2>
          <p className="text-gray-600">
            You have an unfinished riddle session. Would you like to continue where you left off?
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Resume Session
          </button>
          <button
            onClick={onStartNew}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Start New Session
          </button>
        </div>
      </motion.div>
    </div>
  );
}
