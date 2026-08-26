/**
 * ============================================================================
 * Riddle Practice Mode Page
 * ============================================================================
 * Thin wrapper around the shared RiddleChallengeHub (mode = practice).
 * URL: /riddle-mcq/practice
 * ============================================================================
 */

'use client';

import { RiddleChallengeHub } from '@/components/riddle-mcq/RiddleChallengeHub';

export default function RiddlePracticePage(): JSX.Element {
  return <RiddleChallengeHub mode="practice" />;
}
