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
}

/** Whether a single user answer is correct for the given riddle. */
export function isRiddleAnswerCorrect(
  riddle: ScoreableRiddle,
  userAnswer: string | undefined
): boolean {
  if (!userAnswer) return false;

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
