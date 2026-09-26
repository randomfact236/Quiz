/**
 * ============================================================================
 * answer-key.util.ts — the single definition of "what a public read may ship"
 * ============================================================================
 * Grading is server-side: `answers/check` returns a boolean and
 * `answers/reveal` returns the key only after a session. Every other public
 * content read must therefore strip the key.
 *
 * This list used to be copy-pasted into three places — `toPublicQuestion`
 * (quiz-mcq), `toPublicRiddle` (riddle-mcq), and an inline destructure in
 * image-riddles — so a field added to an entity leaked from whichever copy
 * happened to be forgotten. NOW-03/09 is exactly that bug: `explanation` was
 * added to the riddle strip and the other two copies did not learn about it.
 * One list, one place to add a field.
 *
 * `explanation` belongs here because it explains the answer ("it's a coffin
 * because…"). The deliberate exception is `reveal*`, which returns it after
 * the attempt — those paths go through the service, not through this helper.
 * ============================================================================
 */

/**
 * Stripped from every public content payload. Includes the answer key itself
 * and the internal bookkeeping columns that have no frontend consumer.
 */
export const ANSWER_KEY_FIELDS: readonly string[] = [
  'correctAnswer',
  'correctLetter',
  'answer',
  'alternativeAnswers',
  'explanation',
  'contentHash',
  'random_weight',
];

/**
 * Build the public payload for one content row.
 *
 * `derive` receives the ORIGINAL row (before stripping) so a caller can compute
 * a safe derived field from a stripped one — image-riddles returns `answerLength`
 * so the UI can render a mask without ever receiving the answer.
 */
export function toPublicContent<T extends object>(
  row: T,
  derive?: (original: T) => Record<string, unknown>
): Record<string, unknown> {
  const safe: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const field of ANSWER_KEY_FIELDS) {
    delete safe[field];
  }
  if (derive) {
    Object.assign(safe, derive(row));
  }
  return safe;
}

/** `toPublicContent` over a list, preserving order. */
export function toPublicContentList<T extends object>(
  rows: readonly T[],
  derive?: (original: T) => Record<string, unknown>
): Record<string, unknown>[] {
  return rows.map((row) => toPublicContent(row, derive));
}
