/**
 * ============================================================================
 * Bubble Emoji Effect Component
 * ============================================================================
 * Displays continuous popping bubble emojis on correct/wrong answers
 * Each emoji appears/disappears randomly with its own continuous loop
 * Emojis visible only in main content area (not header/footer)
 * ============================================================================
 */

'use client';

import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BubbleEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  baseScale: number;
  popInDuration: number;
  stayDuration: number;
  popOutDuration: number;
  initialDelay: number;
}

export interface BubbleEmojiEffectRef {
  clear: () => void;
}

interface BubbleEmojiEffectProps {
  trigger: boolean;
  type: 'correct' | 'wrong';
  count?: number;
}

// Appropriate emoji sets - positive for correct, neutral/appropriate for wrong
const EMOJI_SETS = {
  correct: ['⭐', '✨', '⚡', '🔥', '💯', '🎯', '💪', '👍', '☀️', '🌟', '💫', '🚀', '🎆', '🎇', '💎', '🏆', '🥇', '🎊', '🎉', '✅'],
  wrong: ['🤔', '❓', '💭', '📚', '🔍', '📝', '📖', '💡', '🧩', '🎓', '📌', '📍', '🔎', '🧐', '📋', '✏️', '📊', '📐', '🧮', '⏳'],
};

export const BubbleEmojiEffect = forwardRef<BubbleEmojiEffectRef, BubbleEmojiEffectProps>(
  function BubbleEmojiEffect({ trigger, type, count = 60 }, ref): JSX.Element {
    const [bubbles, setBubbles] = useState<BubbleEmoji[]>([]);
    const [isActive, setIsActive] = useState(false);

    const clearBubbles = useCallback(() => {
      setBubbles([]);
      setIsActive(false);
    }, []);

    useImperativeHandle(ref, () => ({
      clear: clearBubbles,
    }));

    const createBubbles = useCallback(() => {
      const emojis = EMOJI_SETS[type];
      const newBubbles: BubbleEmoji[] = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)] ?? (type === 'correct' ? '⭐' : '🤔'),
        // Horizontal: left side near question card (1-12%)
        x: 1 + Math.random() * 11,
        // Vertical: from just below header (6%) to above footer (82%) - includes area above question
        y: 6 + Math.random() * 76,
        baseScale: 0.6 + Math.random() * 0.9,
        popInDuration: 0.15 + Math.random() * 0.25,
        stayDuration: 0.3 + Math.random() * 0.7,
        popOutDuration: 0.1 + Math.random() * 0.2,
        initialDelay: Math.random() * 2.5,
      }));
      
      setBubbles(newBubbles);
      setIsActive(true);
    }, [type, count]);

    useEffect(() => {
      if (trigger && !isActive) {
        createBubbles();
      }
    }, [trigger, isActive, createBubbles]);

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]">
        {bubbles.map((bubble) => (
          <ContinuousBubble key={bubble.id} bubble={bubble} type={type} />
        ))}
      </div>
    );
  }
);

interface ContinuousBubbleProps {
  bubble: BubbleEmoji;
  type: 'correct' | 'wrong';
}

function ContinuousBubble({ bubble, type }: ContinuousBubbleProps): JSX.Element {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<'waiting' | 'in' | 'stay' | 'out'>('waiting');
  const [currentEmoji, setCurrentEmoji] = useState(bubble.emoji);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const runCycle = () => {
      if (cycle === 0 && phase === 'waiting') {
        timeout = setTimeout(() => {
          setPhase('in');
        }, bubble.initialDelay * 1000);
        return;
      }

      if (phase === 'in') {
        timeout = setTimeout(() => {
          setPhase('stay');
        }, bubble.popInDuration * 1000);
        return;
      }

      if (phase === 'stay') {
        timeout = setTimeout(() => {
          setPhase('out');
        }, bubble.stayDuration * 1000);
        return;
      }

      if (phase === 'out') {
        timeout = setTimeout(() => {
          const emojis = EMOJI_SETS[type];
          setCurrentEmoji(emojis[Math.floor(Math.random() * emojis.length)] ?? (type === 'correct' ? '⭐' : '🤔'));
          setCycle(c => c + 1);
          setPhase('in');
        }, bubble.popOutDuration * 1000);
        return;
      }
    };

    runCycle();
    return () => clearTimeout(timeout);
  }, [bubble, cycle, phase, type]);

  const isVisible = phase === 'in' || phase === 'stay' || phase === 'out';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.span
          initial={phase === 'in' && cycle === 0 ? { scale: 0, opacity: 0 } : false}
          animate={{ 
            scale: phase === 'in' ? bubble.baseScale : phase === 'stay' ? bubble.baseScale : 0,
            opacity: phase === 'in' ? 1 : phase === 'stay' ? 1 : 0,
          }}
          transition={{
            duration: phase === 'in' ? bubble.popInDuration : phase === 'out' ? bubble.popOutDuration : 0.05,
            ease: phase === 'in' ? 'easeOut' : phase === 'out' ? 'easeIn' : 'linear',
          }}
          className="fixed pointer-events-none select-none"
          style={{
            left: `${bubble.x}vw`,
            top: `${bubble.y}vh`,
            fontSize: `${bubble.baseScale}rem`,
            zIndex: 9999,
            textShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        >
          {currentEmoji}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
