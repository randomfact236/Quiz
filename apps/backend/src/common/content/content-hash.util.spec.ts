import { createHash } from 'crypto';

import { hashQuestionText, normalizeQuestionText } from './content-hash.util';

/**
 * Unit tests for the duplicate-detection normalization/hash. The SQL mirror
 * of normalizeQuestionText lives in the AddContentHashDedup migration — if
 * these expectations change, update that SQL (and
 * scripts/dedupe-riddle-mcqs.sql) to match.
 */
describe('content-hash.util', () => {
  describe('normalizeQuestionText', () => {
    it('lowers case and collapses internal whitespace runs', () => {
      expect(normalizeQuestionText('What   is\t2 + 2?')).toBe('what is 2 + 2?');
    });

    it('strips leading/trailing ASCII whitespace of any kind', () => {
      expect(normalizeQuestionText('  \t\nWhat is 2 + 2? \r\n ')).toBe('what is 2 + 2?');
      // Postgres trim() alone would leave the tab-prefixed text as " what ...".
      expect(normalizeQuestionText('\t\tQuestion')).toBe('question');
    });

    it('treats NBSP and other Unicode spaces as regular characters (parity with the SQL class)', () => {
      // JS \s would collapse NBSP; our explicit ASCII class must not.
      expect(normalizeQuestionText('What\u00a0is this')).toBe('what\u00a0is this');
    });

    it('keeps punctuation significant', () => {
      expect(normalizeQuestionText('What is this?')).not.toBe(
        normalizeQuestionText('What is this')
      );
    });
  });

  describe('hashQuestionText', () => {
    it('produces a 64-char sha256 hex of the normalized text', () => {
      const hash = hashQuestionText('  What IS 2 + 2?  ');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).toBe(createHash('sha256').update('what is 2 + 2?', 'utf8').digest('hex'));
    });

    it('maps differently-formatted identical questions to the same hash', () => {
      expect(hashQuestionText('What  is 2+2?')).toBe(hashQuestionText('what\tis 2+2? '));
    });

    it('maps genuinely different questions to different hashes', () => {
      expect(hashQuestionText('What is 2 + 2?')).not.toBe(hashQuestionText('What is 2 + 3?'));
    });
  });
});
