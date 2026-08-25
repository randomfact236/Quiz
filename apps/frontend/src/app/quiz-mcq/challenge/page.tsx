/**
 * ============================================================================
 * Challenge Mode Page - Redirect to Timer Challenge
 * ============================================================================
 * This page redirects to the new Timer Challenge page
 * URL: /quiz-mcq/challenge
 * ============================================================================
 */

import { redirect } from 'next/navigation';

export default function ChallengePage(): JSX.Element {
  redirect('/quiz-mcq/timer-challenge');
}
