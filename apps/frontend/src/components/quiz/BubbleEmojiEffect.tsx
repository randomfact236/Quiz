/**
 * ============================================================================
 * Bubble Emoji Effect Component
 * ============================================================================
 * Displays popping bubble emojis on correct/wrong answers
 * Dense pop-in/out effect in small area on left side
 * ============================================================================
 */

'use client';

import { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BubbleEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  delay: number;
}

export interface BubbleEmojiEffectRef {
  clear: () => void;
}

interface BubbleEmojiEffectProps {
  /** Trigger the effect */
  trigger: boolean;
  /** Type of effect */
  type: 'correct' | 'wrong';
  /** Number of emojis (default: 20) */
  count?: number;
  /** Callback when effect completes */
  onComplete?: () => void;
}

// Emoji sets for different feedback types
const EMOJI_SETS = {
  correct: ['⭐', '✨', '⚡', '❤️', '💙', '💚', '💛', '💜', '✅', '✔️', '☀️', '🌟', '💫', '🎉', '🎊', '🎈'],
  wrong: ['😢', '😞', '😔', '💭', '🤔', '📚', '🔍', '💡', '🧠', '❓', '🤷', '📝', '📖'],
};

export const BubbleEmojiEffect = forwardRef<BubbleEmojiEffectRef, BubbleEmojiEffectProps>(
  function BubbleEmojiEffect({ trigger, type, count = 20, onComplete }, ref): JSX.Element {
    const [bubbles, setBubbles] = useState<BubbleEmoji[]>([]);
    const [isActive, setIsActive] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Clear bubbles instantly
    const clearBubbles = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setBubbles([]);
      setIsActive(false);
    }, []);

    // Expose clear function via ref
    useImperativeHandle(ref, () => ({
      clear: clearBubbles,
    }));

    const createBubbles = useCallback(() => {
      const emojis = EMOJI_SETS[type];
      // Dense cluster: small area on left side, vertically centered
      const newBubbles: BubbleEmoji[] = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)] || '⭐',
        // Very narrow horizontal range (2-8% from left)
        x: 2 + Math.random() * 6,
        // Dense vertical cluster (35-55% - middle of screen)
        y: 35 + Math.random() * 20,
        scale: 0.9 + Math.random() * 0.6, // 0.9-1.5x scale
        delay: Math.random() * 0.3, // Quick stagger 0-0.3s
      }));
      
      setBubbles(newBubbles);
      setIsActive(true);

      // Clear after animation completes
      timeoutRef.current = setTimeout(() => {
        setBubbles([]);
        setIsActive(false);
        onComplete?.();
      }, 2000);
    }, [type, count, onComplete]);

    useEffect(() => {
      if (trigger && !isActive) {
        createBubbles();
      }
    }, [trigger, isActive, createBubbles]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <AnimatePresence mode="popLayout">
        {bubbles.map((bubble) => (
          <motion.span
            key={bubble.id}
            layout
            initial={{ 
              scale: 0, 
              opacity: 0,
            }}
            animate={{ 
              scale: [0, bubble.scale * 1.2, bubble.scale, 0],
              opacity: [0, 1, 1, 0],
            }}
            exit={{ 
              scale: 0, 
              opacity: 0,
              transition: { duration: 0.1 }
            }}
            transition={{
              duration: 1.5,
              delay: bubble.delay,
              ease: 'easeOut',
              times: [0, 0.2, 0.6, 1],
            }}
            className="fixed z-50 text-xl pointer-events-none"
            style={{
              left: `${bubble.x}vw`,
              top: `${bubble.y}vh`,
              textShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}
          >
            {bubble.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    );
  }
);
