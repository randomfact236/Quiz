/**
 * ============================================================================
 * Timer Challenge Mode Page
 * ============================================================================
 * Multiple quiz modes with timer - Subject wise, Level wise, Complete Mix
 * URL: /quiz-mcq/timer-challenge
 *
 * Thin wrapper around the shared ChallengeHub component; timer-specific
 * features go here (or in ChallengeHub config/extraContent).
 * ============================================================================
 */

'use client';

import { Timer } from 'lucide-react';

import { ChallengeHub } from '@/components/quiz-mcq/ChallengeHub';

export default function TimerChallengePage(): JSX.Element {
  return (
    <ChallengeHub
      config={{
        mode: 'timer',
        title: 'Timer Challenge Mode',
        titleEmoji: '⏱️',
        startIcon: Timer,
        completeMixTagline: 'All subjects, all levels - Ultimate challenge!',
        completeMixBody:
          'Challenge yourself with questions from all subjects and all difficulty levels!',
        completeMixButtonLabel: 'Start Complete Mix Challenge',
      }}
    />
  );
}
