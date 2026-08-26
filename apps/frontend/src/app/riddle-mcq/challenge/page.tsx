/**
 * ============================================================================
 * Riddle Timer Challenge Mode Page
 * ============================================================================
 * Thin wrapper around the shared RiddleChallengeHub (mode = timer).
 * URL: /riddle-mcq/challenge
 * ============================================================================
 */

'use client';

import { RiddleChallengeHub } from '@/components/riddle-mcq/RiddleChallengeHub';

export default function RiddleChallengePage(): JSX.Element {
  return <RiddleChallengeHub mode="timer" />;
}
