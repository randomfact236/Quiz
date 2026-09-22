/**
 * ============================================================================
 * Riddle Scoring — single source of truth
 * ============================================================================
 * Shared by the play page (live score) and the results page.
 *
 * Rules:
 *  - MCQ levels: user answer is a letter (A/B/C/D) compared to correctOption.
 *  - expert (open-ended): case-insensitive, trimmed text comparison against
 *    correctAnswer (falling back to correctOption).
 * ============================================================================
 */

interface ScoreableRiddle {
  level?: string;
  difficulty?: string;
  correctOption?: string;
  correctAnswer?: string;
  options?: string[] | null;
  /** HARD-02/H1: server grading verdict (attached after checkRiddleAnswer). */
  verdict?: boolean;
}

/** HARD-02: option TEXT for a served letter (letters are per-serve after the
 *  BUG-041 shuffle; the text is the stable grading key). */
export function riddleOptionText(
  riddle: { options?: string[] | null; correctAnswer?: string },
  letter: string
): string | null {
  if (riddle.options && riddle.options.length > 0) {
    const letters = 'ABCDEFGH';
    const idx = letters.indexOf(String(letter).trim().toUpperCase());
    const value = idx >= 0 && idx < riddle.options.length ? riddle.options[idx] : null;
    return typeof value === 'string' && value.trim() !== '' ? value : null;
  }
  return riddle.correctAnswer ?? null;
}

/** Whether a single user answer is correct for the given riddle. */
export function isRiddleAnswerCorrect(
  riddle: ScoreableRiddle,
  userAnswer: string | undefined
): boolean {
  if (!userAnswer) return false;

  // HARD-02 (H1): server verdict is the single source of truth when present.
  if (typeof riddle.verdict === 'boolean') return riddle.verdict;

  const isOpenEnded = riddle.level === 'extreme' || riddle.difficulty === 'expert';
  if (isOpenEnded) {
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect =
      riddle.correctAnswer?.toLowerCase().trim() ||
      riddle.correctOption?.toLowerCase().trim() ||
      '';
    return normalizedCorrect !== '' && normalizedUser === normalizedCorrect;
  }

  return riddle.correctOption != null && userAnswer === riddle.correctOption;
}
