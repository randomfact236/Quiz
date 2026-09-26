import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * NOW-07 hardening: `POST /riddle-mcq/sessions` previously took
 * `@Body() body: Record<string, any>`. A `Record` carries no class-validator
 * metadata, so the global ValidationPipe's `whitelist` /
 * `forbidNonWhitelisted` did not apply and every field reached the service
 * hand-coerced via `Number(x) || 0` — an unbounded `subjectName` string and
 * client-chosen score fields on a public write. This is the validated
 * equivalent of the quiz-mcq `CreateQuizSessionDto`, which always had one.
 *
 * Bounds mirror `RiddleSessionService.createSession` (1–100 riddles, score
 * capped at 1e6) so validation rejects bad input at the boundary instead of
 * silently clamping it.
 */
export class CreateRiddleSessionDto {
  @ApiPropertyOptional({ description: 'Client-issued guest id when not logged in' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  guestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subjectSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subjectName?: string;

  @ApiPropertyOptional({ enum: ['easy', 'medium', 'hard', 'expert'] })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Entry-mode label sent by the UI route, e.g. normal | timer | practice',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  mode?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  totalRiddles: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  correctCount: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(1000000)
  score: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(1000000)
  maxScore: number;

  @ApiPropertyOptional({ description: 'Elapsed seconds, capped at one day' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  timeTaken?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  startedAt?: string;
}
