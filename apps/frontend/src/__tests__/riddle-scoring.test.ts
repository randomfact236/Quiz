import { isRiddleAnswerCorrect } from '@/lib/riddle-scoring';
import { adaptRiddleMcq, type RiddleMcq } from '@/types/riddles';

/**
 * The scorer operates on ADAPTED frontend Riddles (the play page adapts every
 * backend entity before answering/scoring), so fixtures go through
 * adaptRiddleMcq just like production data does.
 */
function adapted(overrides: Partial<RiddleMcq> = {}) {
  return adaptRiddleMcq({
    id: 'r1',
    question: 'What has keys but no locks?',
    options: ['A keyboard', 'A piano', 'A map', 'A door'],
    correctLetter: 'B',
    correctAnswer: '',
    level: 'easy',
    status: 'published',
    ...overrides,
  });
}

describe('isRiddleAnswerCorrect', () => {
  describe('MCQ levels', () => {
    it('accepts the correct letter', () => {
      expect(isRiddleAnswerCorrect(adapted(), 'B')).toBe(true);
    });

    it('rejects a wrong letter', () => {
      expect(isRiddleAnswerCorrect(adapted(), 'A')).toBe(false);
    });

    it('is case-sensitive on letters (uppercase canonical)', () => {
      expect(isRiddleAnswerCorrect(adapted(), 'b')).toBe(false);
    });

    it('rejects missing/empty answers', () => {
      expect(isRiddleAnswerCorrect(adapted(), undefined)).toBe(false);
      expect(isRiddleAnswerCorrect(adapted(), '')).toBe(false);
    });

    it('rejects when the riddle has no correct option', () => {
      expect(isRiddleAnswerCorrect(adapted({ correctLetter: null }), 'A')).toBe(false);
    });
  });

  describe('expert (open-ended) levels', () => {
    const expert = () =>
      adapted({
        level: 'expert',
        correctLetter: null,
        correctAnswer: 'An Echo',
      });

    it('matches case-insensitively with trimmed whitespace', () => {
      expect(isRiddleAnswerCorrect(expert(), 'an echo')).toBe(true);
      expect(isRiddleAnswerCorrect(expert(), '  AN ECHO  ')).toBe(true);
    });

    it('rejects wrong text', () => {
      expect(isRiddleAnswerCorrect(expert(), 'a ghost')).toBe(false);
    });

    it('falls back to comparing against correctOption when no text answer exists', () => {
      // Expert riddle whose correctLetter survived adaptation (no correctAnswer)
      const letterOnly = adapted({ level: 'expert' });
      expect(letterOnly.correctAnswer).toBe('');
      expect(isRiddleAnswerCorrect(letterOnly, 'b')).toBe(true);
      expect(isRiddleAnswerCorrect(letterOnly, 'a')).toBe(false);
    });

    it('never matches against an empty expected answer', () => {
      const blank = adapted({ level: 'expert', correctLetter: null, correctAnswer: '' });
      expect(blank.correctOption).toBe('');
      expect(isRiddleAnswerCorrect(blank, 'anything')).toBe(false);
    });
  });

  describe('legacy extreme flag', () => {
    it('treats level "extreme" as open-ended text comparison', () => {
      const legacy = { level: 'extreme', correctAnswer: 'Fire' };
      expect(isRiddleAnswerCorrect(legacy, 'fire')).toBe(true);
      expect(isRiddleAnswerCorrect(legacy, 'water')).toBe(false);
    });
  });
});

describe('adaptRiddleMcq', () => {
  it('maps MCQ fields and derives correctOption from correctLetter', () => {
    const r = adaptRiddleMcq(
      mcqEntity({
        subjectId: 'sub-1',
        subject: { id: 'sub-1', slug: 'logic', name: 'Logic', emoji: '🧩', isActive: true },
      })
    );
    expect(r.correctOption).toBe('B');
    expect(r.difficulty).toBe('easy');
    expect(r.level).toBe('easy');
    expect(r.chapter).toBe('Logic');
    expect(r.chapterId).toBe('sub-1');
    expect(r.status).toBe('published');
  });

  it('marks expert riddles open-ended and nulls MCQ-only fields', () => {
    const r = adaptRiddleMcq(
      mcqEntity({ level: 'expert', correctLetter: null, correctAnswer: 'An echo' })
    );
    expect(r.difficulty).toBe('expert');
    expect(r.level).toBe('extreme');
    expect(r.correctAnswer).toBe('An echo');
  });

  it('defaults hint/explanation to empty strings and falls back to General chapter', () => {
    const r = adaptRiddleMcq(mcqEntity());
    expect(r.hint).toBe('');
    expect(r.explanation).toBe('');
    expect(r.chapter).toBe('General');
  });
});

function mcqEntity(overrides: Partial<RiddleMcq> = {}): RiddleMcq {
  return {
    id: 'r1',
    question: 'What has keys but no locks?',
    options: ['A keyboard', 'A piano', 'A map', 'A door'],
    correctLetter: 'B',
    correctAnswer: '',
    level: 'easy',
    status: 'published',
    ...overrides,
  };
}
