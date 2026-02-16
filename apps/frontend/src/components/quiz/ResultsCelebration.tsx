/**
 * ============================================================================
 * Results Celebration Component
 * ============================================================================
 * Displays celebration emojis on quiz results based on score
 * 15-20 emojis launched based on performance tier
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationEmoji {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  scale: number;
}

interface ResultsCelebrationProps {
  /** Trigger the celebration */
  trigger: boolean;
  /** Score (0-10) */
  score: number;
  /** Max score (typically 10) */
  maxScore: number;
}

// Emoji sets based on performance tier
const CELEBRATION_EMOJIS = {
  perfect: ['🎉', '🌟', '⭐', '✨', '💫', '🏆', '🥇', '👏', '🎊', '🎯', '💡', '🔥'],
  good: ['👍', '📚', '💪', '🎯', '📖', '✅', '😊', '⭐', '✨', '🎉'],
  tryAgain: ['📝', '📚', '💭', '🔍', '📖', '💡', '🌱', '💪', '👍', '🎯'],
};

export function ResultsCelebration({
  trigger,
  score,
  maxScore,
}: ResultsCelebrationProps): JSX.Element {
  const [emojis, setEmojis] = useState<CelebrationEmoji[]>([]);

  useEffect(() => {
    if (!trigger) {
      setEmojis([]);
      return;
    }

    const percentage = (score / maxScore) * 100;
    
    // Determine tier and emoji set
    let emojiSet: string[];
    let count: number;
    
    if (percentage >= 80) {
      emojiSet = CELEBRATION_EMOJIS.perfect;
      count = 20;
    } else if (percentage >= 40) {
      emojiSet = CELEBRATION_EMOJIS.good;
      count = 15;
    } else {
      emojiSet = CELEBRATION_EMOJIS.tryAgain;
      count = 12;
    }

    // Generate celebration emojis
    const newEmojis: CelebrationEmoji[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji: emojiSet[i % emojiSet.length] || '🎉',
      x: 10 + Math.random() * 80, // 10-90% horizontal spread
      delay: i * 0.1, // Staggered launch
      duration: 2 + Math.random() * 1, // 2-3s duration
      scale: 0.8 + Math.random() * 0.6, // 0.8-1.4x scale
    }));

    setEmojis(newEmojis);

    // Clear after animation
    const timer = setTimeout(() => {
      setEmojis([]);
    }, 4000);

    return () => clearTimeout(timer);
  }, [trigger, score, maxScore]);

  return (
    <AnimatePresence>
      {emojis.map((emoji) => (
        <motion.span
          key={emoji.id}
          initial={{ 
            y: '100vh',
            x: `${emoji.x}vw`,
            scale: 0,
            opacity: 0,
            rotate: 0,
          }}
          animate={{ 
            y: '-20vh',
            scale: [0, emoji.scale, emoji.scale * 0.8, 0],
            opacity: [0, 1, 1, 0],
            rotate: Math.random() * 360 - 180,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: emoji.duration,
            delay: emoji.delay,
            ease: 'easeOut',
          }}
          className="fixed z-50 text-3xl pointer-events-none"
          style={{
            left: `${emoji.x}vw`,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {emoji.emoji}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}
