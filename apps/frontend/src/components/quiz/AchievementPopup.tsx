/**
 * ============================================================================
 * Achievement Popup Component
 * ============================================================================
 * Shows popup when achievement is unlocked
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Achievement } from '@/types/quiz';

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementPopup({
  achievement,
  onClose,
}: AchievementPopupProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!achievement) return undefined;
    
    setIsVisible(true);
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {isVisible && achievement && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -100, x: '-50%' }}
          className="fixed left-1/2 top-6 z-50 w-full max-w-md px-4"
        >
          <div className="relative flex items-center gap-4 rounded-2xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 shadow-2xl">
            {/* Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-3xl">
              {achievement.icon}
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className="text-xs font-bold uppercase text-yellow-600">
                Achievement Unlocked!
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                {achievement.name}
              </h3>
              <p className="text-sm text-gray-600">{achievement.description}</p>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-yellow-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Confetti effect decoration */}
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400" />
            <div className="absolute -bottom-1 -left-1 flex h-3 w-3 items-center justify-center rounded-full bg-orange-400" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hook to show achievement popups */
export function useAchievementPopup() {
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  const showAchievement = (newAchievement: Achievement) => {
    setAchievement(newAchievement);
  };

  const hideAchievement = () => {
    setAchievement(null);
  };

  const PopupComponent = (
    <AchievementPopup achievement={achievement} onClose={hideAchievement} />
  );

  return {
    showAchievement,
    hideAchievement,
    PopupComponent,
    achievement,
  };
}
