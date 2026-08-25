/**
 * ============================================================================
 * Quiz MCQ scoring regression tests
 * ============================================================================
 * Guards the P0 fixes from TODO.md "Quiz MCQ — correctness backlog":
 *  - MCQ answers scored by letter, not by answer text
 *  - extreme (open-ended) answers scored by case-insensitive text
 *  - unknown difficulty levels must not crash calculateResult
 *  - results stats consistent with play-time scoring (shared scorer)
 * ============================================================================
 */

import {
  isAnswerCorrect,
  calculateScore,
  calculateGrade,
  calculateResult,
} from '@/lib/quiz-mcq-scoring';
import type { Question, QuizSession } from '@/types/quiz-mcq';

function mcq(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    question: 'What is 2+2?',
    optionA: '3',
    optionB: '4',
    optionC: '5',
    optionD: '6',
    correctAnswer: '4',
    correctLetter: 'B',
    level: 'easy',
    chapter: 'ch1',
    ...overrides,
  };
}

function extreme(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q2',
    question: 'Capital of France?',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'Paris',
    correctLetter: null,
    level: 'extreme',
    chapter: 'ch1',
    ...overrides,
  };
}

describe('isAnswerCorrect', () => {
  it('scores MCQ by correctLetter, never by comparing to answer text', () => {
    const q = mcq();
    expect(isAnswerCorrect(q, 'B')).toBe(true);
    expect(isAnswerCorrect(q, 'A')).toBe(false);
    // Regression [P0]: userAnswer is a letter; correctAnswer is TEXT ("4").
    // The old buggy comparison `userAnswer === q.correctAnswer` was always false.
    expect(q.correctAnswer).toBe('4');
  });

  it('returns false for missing/empty MCQ answers', () => {
    const q = mcq();
    expect(isAnswerCorrect(q, undefined)).toBe(false);
    expect(isAnswerCorrect(q, '')).toBe(false);
  });

  it('handles questions with null correctLetter as incorrect', () => {
    expect(isAnswerCorrect(mcq({ correctLetter: null }), 'A')).toBe(false);
  });

  it('scores extreme open-ended case-insensitively with trimming', () => {
    const q = extreme({ correctAnswer: 'Paris' });
    expect(isAnswerCorrect(q, 'paris')).toBe(true);
    expect(isAnswerCorrect(q, '  PARIS  ')).toBe(true);
    expect(isAnswerCorrect(q, 'London')).toBe(false);
    expect(isAnswerCorrect(q, '')).toBe(false);
  });
});

describe('calculateScore', () => {
  it('sums correct answers across mixed question types', () => {
    const questions = [
      mcq({ id: 'a', correctLetter: 'B' }),
      mcq({ id: 'b', correctLetter: 'D' }),
      extreme({ id: 'c', correctAnswer: 'Berlin' }),
    ];
    const answers = { a: 'B', b: 'C', c: 'berlin ' };
    expect(calculateScore(questions, answers)).toBe(2);
  });
});

describe('calculateGrade', () => {
  it.each([
    [97, 'A+'],
    [90, 'A'],
    [80, 'B'],
    [70, 'C'],
    [60, 'D'],
    [0, 'F'],
  ])('%i%% -> %s', (pct, expected) => {
    expect(calculateGrade(pct)).toBe(expected);
  });
});

describe('calculateResult', () => {
  function session(questions: Question[], answers: Record<string, string>): QuizSession {
    return {
      id: 's1',
      subject: 'science',
      subjectName: 'Science',
      chapter: 'Physics',
      level: 'all',
      questions,
      answers,
      score: 0,
      maxScore: questions.length,
      startedAt: new Date().toISOString(),
      timeTaken: 30,
      status: 'completed',
    };
  }

  it('counts correct/incorrect consistently for MCQ + extreme mixes', () => {
    const result = calculateResult(
      session(
        [
          mcq({ id: 'a', correctLetter: 'B', level: 'easy' }),
          mcq({ id: 'b', correctLetter: 'D', level: 'hard' }),
          extreme({ id: 'c', correctAnswer: 'Berlin', level: 'extreme' }),
        ],
        { a: 'B', b: 'C', c: 'BERLIN' }
      )
    );
    expect(result.correctCount).toBe(2);
    expect(result.incorrectCount).toBe(1);
    expect(result.percentage).toBeCloseTo((2 / 3) * 100);
  });

  it('does not crash on an unknown difficulty level and still counts totals', () => {
    // Regression [P0]: `byDifficulty[q.level]` was undefined for unknown levels.
    const weird = mcq({ id: 'w', level: 'legendary' as Question['level'] });
    const result = calculateResult(session([weird], { w: 'B' }));

    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(0);
    expect(Object.values(result.byDifficulty).every((b) => b.total === 0)).toBe(true);
  });

  it('buckets known difficulties correctly', () => {
    const result = calculateResult(
      session(
        [
          mcq({ id: 'a', correctLetter: 'B', level: 'easy' }),
          mcq({ id: 'b', correctLetter: 'D', level: 'hard' }),
        ],
        { a: 'B', b: 'A' }
      )
    );
    expect(result.byDifficulty.easy).toEqual({ correct: 1, total: 1 });
    expect(result.byDifficulty.hard).toEqual({ correct: 0, total: 1 });
    expect(result.grade).toBe('F');
  });
});
