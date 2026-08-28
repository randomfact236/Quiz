/**
 * useRiddleKeyboardNav — Escape closes the modal; arrows navigate prev/next.
 * Arrow navigation is suppressed while the user is typing in an input.
 */

'use client';

import { useEffect } from 'react';

export function useRiddleKeyboardNav(
  active: boolean,
  onClose: () => void,
  onNavigate: (direction: 'next' | 'prev') => void
): void {
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (document.activeElement?.tagName !== 'INPUT') {
        if (e.key === 'ArrowRight') onNavigate('next');
        if (e.key === 'ArrowLeft') onNavigate('prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, onClose, onNavigate]);
}
