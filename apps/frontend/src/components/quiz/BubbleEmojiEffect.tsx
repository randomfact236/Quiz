/**
 * ============================================================================
 * Bubble Emoji Effect Component
 * ============================================================================
 * Displays popping bubble emojis on correct/wrong answers
 * Pop-in/out effect at left side (like foam bubbles)
 * ============================================================================
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BubbleEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  delay: number;
}

interface BubbleEmojiEffectProps {
  /** Trigger the effect */
  trigger: boolean;
  /** Type of effect */
  type: 'correct' | 'wrong';
  /** Number of emojis (default: 15) */
  count?: number;
  /** Callback when effect completes */
  onComplete?: () => void;
}

// Emoji sets for different feedback types
const EMOJI_SETS = {
  correct: ['⭐', '✨', '⚡', '❤️', '💙', '💚', '💛', '💜', '✅', '✔️', '☀️', '🌟', '💫', '🎉', '🎊', '🎈'],
  wrong: ['😢', '😞', '😔', '💭', '🤔', '📚', '🔍', '💡', '🧠', '❓', '🤷', '📝', '📖'],
};

export function BubbleEmojiEffect({
  trigger,
  type,
  count = 15,
  onComplete,
}: BubbleEmojiEffectProps): JSX.Element {
  const [bubbles, setBubbles] = useState<BubbleEmoji[]>([]);
  const [isActive, setIsActive] = useState(false);

  const createBubbles = useCallback(() => {
    const emojis = EMOJI_SETS[type];
    const newBubbles: BubbleEmoji[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)] || '⭐',
      x: Math.random() * 15, // 0-15% from left (left side concentration)
      y: 5 + Math.random() * 75, // 5-80% vertical spread
      scale: 0.8 + Math.random() * 0.7, // 0.8-1.5x scale
      delay: Math.random() * 0.5, // 0-0.5s stagger
    }));
    
    setBubbles(newBubbles);
    setIsActive(true);

    // Clear after animation completes
    setTimeout(() => {
      setBubbles([]);
      setIsActive(false);
      onComplete?.();
    }, 2500);
  }, [type, count, onComplete]);

  useEffect(() => {
    if (trigger && !isActive) {
      createBubbles();
    }
  }, [trigger, isActive, createBubbles]);

  return (
    <AnimatePresence>
      {bubbles.map((bubble) => (
        <motion.span
          key={bubble.id}
          initial={{ 
            scale: 0, 
            opacity: 0,
            x: `${bubble.x}vw`,
            y: `${bubble.y}vh`,
          }}
          animate={{ 
            scale: [0, bubble.scale * 1.3, bubble.scale, bubble.scale * 0.8, 0],
            opacity: [0, 1, 1, 1, 0],
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            duration: 2,
            delay: bubble.delay,
            ease: 'easeInOut',
            times: [0, 0.15, 0.5, 0.85, 1],
          }}
          className="fixed z-50 text-2xl pointer-events-none"
          style={{
            left: `${bubble.x}vw`,
            top: `${bubble.y}vh`,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {bubble.emoji}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}
