/**
 * ============================================================================
 * Analytics DTOs
 * ============================================================================
 * Ingest batch shape mirrors analytics plan §8: a shared envelope per event
 * plus free-form properties. Validation is deliberately forgiving (analytics
 * must never break gameplay) but caps sizes to bound DB writes.
 * ============================================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** eventName convention: `<object>_<action>` lowercase snake (plan §8). */
export const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{2,63}$/;

/**
 * TASK-02 idempotency key: a client-minted uuid or an opaque
 * [A-Za-z0-9_-]{8,64} token (a uuid v4 satisfies both shapes).
 */
export const CLIENT_EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/** Modules allowed in the envelope (plan §8). */
export const ANALYTICS_MODULES = [
  'quiz-mcq',
  'riddle-mcq',
  'jokes',
  'image-riddles',
  'games',
  'site',
] as const;

export class AnalyticsEventDto {
  @ApiProperty({ example: 'session_completed' })
  @IsString()
  @Matches(EVENT_NAME_PATTERN, {
    message: 'eventName must match <object>_<action> lowercase snake_case',
  })
  eventName: string;

  @ApiPropertyOptional({ enum: ANALYTICS_MODULES })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  module?: string;

  @ApiPropertyOptional({ description: 'Client-issued guest identity (aiquiz:guest-id)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  guestId?: string;

  @ApiPropertyOptional({ description: 'Quiz/riddle session id' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Frontend route, e.g. /quiz-mcq/play' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  page?: string;

  @ApiPropertyOptional({ description: 'Event-specific payload (size-capped server-side)' })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Device clock (ISO-8601)' })
  @IsOptional()
  @IsDateString()
  clientTs?: string;

  @ApiPropertyOptional({
    description:
      'Client-minted idempotency key (uuid or [A-Za-z0-9_-]{8,64}); repeats of the same key are stored once',
  })
  @IsOptional()
  @IsString()
  @Matches(CLIENT_EVENT_ID_PATTERN, {
    message: 'clientEventId must be a uuid or 8-64 chars of [A-Za-z0-9_-]',
  })
  clientEventId?: string;
}

export class IngestEventsDto {
  @ApiProperty({ type: [AnalyticsEventDto], maxItems: 50 })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventDto)
  events: AnalyticsEventDto[];
}

export class AdminEventsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by exact eventName' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  eventName?: string;

  @ApiPropertyOptional({ enum: ANALYTICS_MODULES })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  module?: string;

  @ApiPropertyOptional({ description: 'Only events at/after this ISO timestamp' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Only events at/before this ISO timestamp' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description:
      'Trace one actor: userId, guestId, or sessionId (matches any of the three columns)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  actor?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class AdminDashboardQueryDto {
  @ApiPropertyOptional({ description: 'Look-back window in days', default: 30, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

export class AdminClicksQueryDto {
  @ApiProperty({ enum: ['quiz-mcq', 'riddle-mcq', 'image-riddles', 'jokes'] })
  @IsIn(['quiz-mcq', 'riddle-mcq', 'image-riddles', 'jokes'])
  module: string;

  @ApiPropertyOptional({ description: 'Look-back window in days', default: 30, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  @ApiPropertyOptional({
    description: 'Quiz/riddle drill-down: filter answer panels to one subject',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  subject?: string;

  @ApiPropertyOptional({ description: 'Jokes drill-down: filter to one category name' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;
}

/**
 * Fresh-start reset acknowledgment (BUG-012). The confirmation word must
 * travel with the request so an accidental POST cannot wipe analytics.
 */
export class ResetAnalyticsDto {
  @ApiProperty({ description: "Must be the literal word 'RESET'", example: 'RESET' })
  @IsString()
  confirm?: string;
}
