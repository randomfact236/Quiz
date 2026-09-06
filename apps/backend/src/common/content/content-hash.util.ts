import { createHash } from 'crypto';

/**
 * Normalization spec for duplicate-question detection. This MUST stay mirrored
 * by the SQL backfill in the AddContentHashDedup migration and by
 * scripts/dedupe-riddle-mcqs.sql — both engines deliberately use an explicit
 * ASCII whitespace class instead of '\s' (JS '\s' also matches Unicode spaces
 * such as NBSP, while Postgres '\s' is locale-ctype dependent) and trim via
 * regex-safe space stripping instead of trim() (Postgres trim() only strips
 * plain spaces; JS trim() strips the full Unicode set).
 *
 * Spec: collapse runs of [ \t\n\v\f\r ] to a single space, strip the one
 * leading/trailing space that can remain, then lowercase. Punctuation stays
 * significant.
 */
export function normalizeQuestionText(text: string): string {
  return text
    .replace(/[\t\n\v\f\r ]+/g, ' ')
    .replace(/^ /, '')
    .replace(/ $/, '')
    .toLowerCase();
}

/** sha256 hex of the normalized question text (64 chars). */
export function hashQuestionText(text: string): string {
  return createHash('sha256').update(normalizeQuestionText(text), 'utf8').digest('hex');
}
