/**
 * ============================================================================
 * Riddle Practice Mode route (kept alive for back-links)
 * ============================================================================
 * Mode is now chosen inline on the unified hub. This route redirects there
 * with the Normal card pre-expanded.
 * ============================================================================
 */

import { redirect } from 'next/navigation';

export default function RiddlePracticePage(): JSX.Element {
  redirect('/riddle-mcq?mode=practice');
}
