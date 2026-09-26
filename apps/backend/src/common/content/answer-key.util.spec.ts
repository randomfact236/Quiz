import { ANSWER_KEY_FIELDS, toPublicContent, toPublicContentList } from './answer-key.util';

/**
 * Locks the answer-key invariant in ONE place. The stripped list used to be
 * copy-pasted into quiz-mcq, riddle-mcq and image-riddles, and NOW-03/09 is
 * the bug that came out of it: `explanation` joined the riddle strip and the
 * other two copies never learned about it, so pre-answer public reads shipped
 * the explanation — which spells out the answer.
 *
 * These assertions are the regression net for that whole class of leak: any
 * field added to an entity must be added to ANSWER_KEY_FIELDS here, and this
 * test is what tells you it wasn't.
 */
describe('answer-key strip', () => {
  const row = {
    id: 'r-1',
    question: 'What am I?',
    status: 'published',
    correctAnswer: 'a coffin',
    correctLetter: 'A',
    answer: 'a coffin',
    alternativeAnswers: ['coffin', 'burial'],
    explanation: "It's a coffin because…",
    contentHash: 'deadbeef',
    random_weight: 0.42,
  };

  it('strips every field in the canonical list', () => {
    const safe = toPublicContent(row);
    for (const field of ANSWER_KEY_FIELDS) {
      expect(safe).not.toHaveProperty(field);
    }
  });

  it('strips the whole answer key, not just one alias', () => {
    const safe = toPublicContent(row);
    expect(JSON.stringify(safe)).not.toContain('coffin');
    expect(JSON.stringify(safe)).not.toContain('burial');
  });

  it('keeps the public fields intact', () => {
    const safe = toPublicContent(row);
    expect(safe['id']).toBe('r-1');
    expect(safe['question']).toBe('What am I?');
    expect(safe['status']).toBe('published');
  });

  it('does not mutate the input row', () => {
    toPublicContent(row);
    expect(row.correctAnswer).toBe('a coffin');
    expect(row.explanation).toBe("It's a coffin because…");
  });

  it('derives safe fields from the ORIGINAL row (image-riddle answerLength)', () => {
    const safe = toPublicContent(row, (original) => ({
      answerLength: original.answer.length,
    }));
    expect(safe['answerLength']).toBe(8);
    expect(safe).not.toHaveProperty('answer');
  });

  it('derives nothing when no derive callback is given', () => {
    expect(toPublicContent(row)).not.toHaveProperty('answerLength');
  });

  it('maps a list preserving order', () => {
    const list = toPublicContentList([
      { ...row, id: 'a' },
      { ...row, id: 'b' },
    ]);
    expect(list.map((r) => r['id'])).toEqual(['a', 'b']);
    expect(list.every((r) => !('answer' in r))).toBe(true);
  });

  it('handles a row whose answer fields are absent', () => {
    const safe = toPublicContent({ id: 'x', question: 'q' });
    expect(safe).toEqual({ id: 'x', question: 'q' });
  });

  it('does not mutate the input row via the list helper either', () => {
    const input = { ...row };
    toPublicContentList([input]);
    expect(input.answer).toBe('a coffin');
  });
});
