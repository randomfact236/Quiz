/**
 * Riddle play-mode URL param parsing.
 *
 * Lives outside the page module because Next.js forbids non-standard
 * exports from app directory page files (full-build entry type check).
 */

export type RiddlePlayMode = 'practice' | 'timer';

const VALID_MODES: RiddlePlayMode[] = ['practice', 'timer'];

export function parseModeParam(raw: string | null): RiddlePlayMode | null {
  return VALID_MODES.includes(raw as RiddlePlayMode) ? (raw as RiddlePlayMode) : null;
}
