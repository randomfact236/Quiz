/**
 * ============================================================================
 * Floating Background Component
 * ============================================================================
 * Displays floating emojis/numbers moving upward in the background
 * ============================================================================
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface FloatingItem {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

interface FloatingBackgroundProps {
  /** Number of floating items */
  count?: number;
  /** Emojis to display (default: question marks and numbers) */
  emojis?: string[];
}

// Default emojis as a constant outside component to prevent re-renders
const DEFAULT_EMOJIS = ['❓', '❔', '🔢', '1', '2', '3', '4', '?', '!'];

export function FloatingBackground({
  count = 15,
  emojis = DEFAULT_EMOJIS,
}: FloatingBackgroundProps): JSX.Element {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent infinite re-renders - only initialize once
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const generated: FloatingItem[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)] || '❓',
      x: Math.random() * 100, // Random horizontal position (0-100%)
      delay: Math.random() * 10, // Random delay (0-10s)
      duration: 8 + Math.random() * 8, // Random duration (8-16s)
      size: 1.5 + Math.random() * 1.5, // Random size (1.5-3rem)
    }));
    setItems(generated);
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{
            y: '110vh',
            x: `${item.x}vw`,
            opacity: 0,
            rotate: 0,
          }}
          animate={{
            y: '-10vh',
            x: `${item.x}vw`,
            opacity: [0, 0.15, 0.15, 0],
            rotate: 360,
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute text-gray-400"
          style={{
            fontSize: `${item.size}rem`,
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
}
