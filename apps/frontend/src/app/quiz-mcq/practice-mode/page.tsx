/**
 * ============================================================================
 * Practice Mode Page
 * ============================================================================
 * Multiple quiz modes without timer - Subject wise, Level wise, Complete Mix
 * URL: /quiz-mcq/practice-mode
 *
 * Thin wrapper around the shared ChallengeHub component; practice-specific
 * features go here (or in ChallengeHub config/extraContent).
 * ============================================================================
 */

'use client';

import { GraduationCap } from 'lucide-react';

import { ChallengeHub } from '@/components/quiz-mcq/ChallengeHub';

export default function PracticeModePage(): JSX.Element {
  return (
    <ChallengeHub
      config={{
        mode: 'practice',
        title: 'Practice Mode',
        titleEmoji: '📚',
        startIcon: GraduationCap,
        completeMixTagline: 'All subjects, all levels - Ultimate practice!',
        completeMixBody: 'Practice with questions from all subjects and all difficulty levels!',
        completeMixButtonLabel: 'Start Complete Mix Practice',
        showComingSoon: true,
      }}
    />
  );
}
