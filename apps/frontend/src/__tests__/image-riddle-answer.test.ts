import {
  countAnswerLetters,
  isImageRiddleAnswerCorrect,
  normalizeAnswer,
} from '@/lib/image-riddle-answer';

describe('normalizeAnswer', () => {
  it('lowercases and trims', () => {
    expect(normalizeAnswer('  Umbrella ')).toBe('umbrella');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeAnswer('ice   cream')).toBe('ice cream');
  });

  it('strips leading articles', () => {
    expect(normalizeAnswer('an umbrella')).toBe('umbrella');
    expect(normalizeAnswer('The Eiffel Tower')).toBe('eiffel tower');
    expect(normalizeAnswer('a carrot')).toBe('carrot');
  });

  it('strips trailing punctuation', () => {
    expect(normalizeAnswer('a clock!')).toBe('clock');
    expect(normalizeAnswer('stop.')).toBe('stop');
  });
});

describe('isImageRiddleAnswerCorrect', () => {
  const base = { answer: 'umbrella', guess: 'umbrella', alternativeAnswers: null };

  it('accepts the exact answer', () => {
    expect(isImageRiddleAnswerCorrect(base)).toBe(true);
  });

  it('is case-insensitive and whitespace-tolerant', () => {
    expect(isImageRiddleAnswerCorrect({ ...base, guess: '  UMBRELLA  ' })).toBe(true);
  });

  it('accepts article/punctuation variants', () => {
    expect(isImageRiddleAnswerCorrect({ ...base, guess: 'an umbrella!' })).toBe(true);
  });

  it('rejects a wrong guess', () => {
    expect(isImageRiddleAnswerCorrect({ ...base, guess: 'parasol' })).toBe(false);
  });

  it('rejects an empty guess', () => {
    expect(isImageRiddleAnswerCorrect({ ...base, guess: '   ' })).toBe(false);
  });

  it('accepts any alternative answer', () => {
    expect(
      isImageRiddleAnswerCorrect({
        ...base,
        guess: 'a carrot',
        alternativeAnswers: ['carrot', 'orange root'],
      })
    ).toBe(true);
    expect(
      isImageRiddleAnswerCorrect({
        ...base,
        guess: 'Orange Root',
        alternativeAnswers: ['carrot', 'orange root'],
      })
    ).toBe(true);
  });

  it('normalizes alternatives the same way as the guess', () => {
    expect(
      isImageRiddleAnswerCorrect({
        ...base,
        guess: 'car',
        alternativeAnswers: ['  a car '],
      })
    ).toBe(true);
  });

  it('still matches the canonical answer when alternatives exist', () => {
    expect(
      isImageRiddleAnswerCorrect({ ...base, guess: 'umbrella', alternativeAnswers: ['brolly'] })
    ).toBe(true);
  });
});

describe('countAnswerLetters', () => {
  it('counts alphanumeric characters only', () => {
    expect(countAnswerLetters('umbrella')).toBe(8);
    expect(countAnswerLetters('ice cream')).toBe(8);
    expect(countAnswerLetters("don't!")).toBe(4);
  });
});
