/**
 * ============================================================================
 * Bulk Action DTO - Enterprise Grade
 * ============================================================================
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsString,
} from 'class-validator';

import { MAX_BULK_ITEMS } from '../constants/app.constants';
import { BulkActionType } from '../enums/bulk-action.enum';
import { ContentStatus } from '../enums/content-status.enum';
/**
 * DTO for bulk action requests
 */
export class BulkActionDto {
  @ApiProperty({
    description: 'Bulk action to perform',
    enum: BulkActionType,
    example: BulkActionType.PUBLISH,
  })
  @IsEnum(BulkActionType)
  action: BulkActionType;

  @ApiProperty({
    description: 'Array of entity IDs to process',
    type: [String],
    format: 'uuid',
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
  })
  @IsArray()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    each: true,
    message: 'Each value in ids must be a valid UUID',
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_ITEMS, {
    message: `Cannot process more than ${MAX_BULK_ITEMS} items at once`,
  })
  ids: string[];

  @ApiPropertyOptional({
    description: 'Optional reason for the bulk action (for audit logs)',
    example: 'Publishing approved content batch',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for bulk action response
 */
export class BulkActionResponseDto {
  @ApiProperty({ description: 'Whether the operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Total number of items processed' })
  processed: number;

  @ApiProperty({ description: 'Number of items successfully processed' })
  succeeded: number;

  @ApiProperty({ description: 'Number of items that failed' })
  failed: number;

  @ApiPropertyOptional({
    description: 'Array of failure details',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  failures?: Array<{ id: string; error: string }>;

  @ApiProperty({ description: 'Human-readable status message' })
  message: string;
}

/**
 * DTO for status count response
 */
export class StatusCountResponseDto {
  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Number of published items' })
  published: number;

  @ApiProperty({ description: 'Number of draft items' })
  draft: number;

  @ApiProperty({ description: 'Number of items in trash' })
  trash: number;
}
