/**
 * ============================================================================
 * Practice Mode Page - Redirect to Practice Mode
 * ============================================================================
 * This page redirects to the new Practice Mode page
 * URL: /quiz/practice
 * ============================================================================
 */

import { redirect } from 'next/navigation';

export default function PracticePage(): JSX.Element {
  redirect('/quiz/practice-mode');
}
