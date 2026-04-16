import { BadRequestException } from '@nestjs/common';

export class DifficultyValidator {
  private readonly validLevels = ['easy', 'medium', 'hard', 'expert'];

  validate(level: string): void {
    if (!this.validLevels.includes(level)) {
      throw new BadRequestException(
        `Invalid difficulty level: "${level}". Valid values: ${this.validLevels.join(', ')}`
      );
    }
  }
}
