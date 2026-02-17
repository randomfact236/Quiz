/**
 * ============================================================================
 * Challenge Mode Page - Redirect to Timer Challenge
 * ============================================================================
 * This page redirects to the new Timer Challenge page
 * URL: /quiz/challenge
 * ============================================================================
 */

import { redirect } from 'next/navigation';

export default function ChallengePage(): JSX.Element {
  redirect('/quiz/timer-challenge');
}
