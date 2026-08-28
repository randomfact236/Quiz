/**
 * ============================================================================
 * image-riddle-answer.ts — normalized answer matching for image riddles
 * ============================================================================
 * Pure utilities (no DOM/network) so they can be unit tested and reused by
 * the game page. Matching is intentionally forgiving for a guessing game:
 * case-insensitive, whitespace-collapsed, leading articles and trailing
 * punctuation ignored, plus optional per-riddle synonym list
 * (`alternativeAnswers` on the ImageRiddle entity).
 * ============================================================================
 */

/**
 * Normalize a guess/answer for comparison:
 * - lowercase, trim
 * - collapse internal whitespace to single spaces
 * - strip leading articles ("a", "an", "the")
 * - strip surrounding/trailing punctuation
 */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(a|an|the)\s+/, '')
    .replace(/^["'(]+|["'.,!?;:)\]]+$/g, '')
    .trim();
}

/**
 * Check a guess against the canonical answer plus any alternative answers.
 * Returns true when the normalized guess equals any candidate.
 */
export function isImageRiddleAnswerCorrect(params: {
  answer: string;
  alternativeAnswers?: string[] | null | undefined;
  guess: string;
}): boolean {
  const guess = normalizeAnswer(params.guess);
  if (guess.length === 0) return false;

  const candidates = [params.answer, ...(params.alternativeAnswers ?? [])];
  return candidates.some((candidate) => normalizeAnswer(candidate) === guess);
}

/**
 * Letter count for the "N letters" hint chip — counts alphanumeric
 * characters only so "ice cream" reads "8 letters" rather than "9".
 */
export function countAnswerLetters(answer: string): number {
  return answer.replace(/[^a-zA-Z0-9]/g, '').length;
}
