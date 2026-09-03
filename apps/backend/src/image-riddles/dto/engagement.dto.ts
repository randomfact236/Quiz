import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** Engagement event types (plan/04-image-riddles.md P1 #1). 'like' is intentionally absent — needs a like UI (owner decision). */
export type EngagementType = 'view' | 'attempt' | 'solve';

export class EngagementDto {
  @ApiProperty({ enum: ['view', 'attempt', 'solve'] })
  @IsIn(['view', 'attempt', 'solve'], {
    message: 'type must be one of: view, attempt, solve',
  })
  type: EngagementType;
}
