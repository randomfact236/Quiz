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

/** Modules allowed in the envelope (plan §8). */
export const ANALYTICS_MODULES = [
  'quiz-mcq',
  'riddle-mcq',
  'jokes',
  'image-riddles',
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
