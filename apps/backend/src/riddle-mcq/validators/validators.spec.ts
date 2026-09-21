import { BadRequestException } from '@nestjs/common';

import { DifficultyValidator } from './difficulty.validator';
import { PaginationValidator } from './pagination.validator';

/** BE-11: the riddle-mcq request validators had no coverage. */
describe('DifficultyValidator', () => {
  const validator = new DifficultyValidator();

  it.each(['easy', 'medium', 'hard', 'expert'])('accepts %s', (level) => {
    expect(() => validator.validate(level)).not.toThrow();
  });

  it.each(['', 'EASY', 'extreme', 'impossible'])('rejects %p', (level) => {
    expect(() => validator.validate(level)).toThrow(BadRequestException);
    expect(() => validator.validate(level)).toThrow(/Invalid difficulty level/);
  });
});

describe('PaginationValidator', () => {
  const validator = new PaginationValidator();

  it('falls back to the default when count is absent or empty', () => {
    expect(validator.validateCount(undefined, 20, 1, 50)).toBe(20);
    expect(validator.validateCount('', 20, 1, 50)).toBe(20);
  });

  it('parses a valid count', () => {
    expect(validator.validateCount('25', 20, 1, 50)).toBe(25);
  });

  it('rejects a non-numeric count', () => {
    expect(() => validator.validateCount('abc', 20, 1, 50)).toThrow(BadRequestException);
  });

  it('rejects values below the minimum and above the maximum', () => {
    expect(() => validator.validateCount('0', 20, 1, 50)).toThrow(/at least 1/);
    expect(() => validator.validateCount('51', 20, 1, 50)).toThrow(/must not exceed 50/);
  });

  it('accepts the boundary values', () => {
    expect(validator.validateCount('1', 20, 1, 50)).toBe(1);
    expect(validator.validateCount('50', 20, 1, 50)).toBe(50);
  });
});
