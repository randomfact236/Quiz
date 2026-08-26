/**
 * ============================================================================
 * Riddle Timer Challenge route (kept alive for back-links)
 * ============================================================================
 * Mode is now chosen inline on the unified hub. This route redirects there
 * with the Timer card pre-expanded.
 * ============================================================================
 */

import { redirect } from 'next/navigation';

export default function RiddleChallengePage(): JSX.Element {
  redirect('/riddle-mcq?mode=timer');
}
