/**
 * ============================================================================
 * Practice Mode Page - Redirect to Practice Mode
 * ============================================================================
 * This page redirects to the new Practice Mode page
 * URL: /quiz-mcq/practice
 * ============================================================================
 */

import { redirect } from 'next/navigation';

export default function PracticePage(): JSX.Element {
  redirect('/quiz-mcq/practice-mode');
}
