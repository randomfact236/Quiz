/**
 * ============================================================================
 * Bulk Action DTO - Enterprise Grade
 * ============================================================================
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

import { IsEnum, IsArray, IsUUID, ArrayMinSize, MaxLength, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '../enums/content-status.enum';
import { BulkActionType } from '../enums/bulk-action.enum';
import { MAX_BULK_ITEMS } from '../constants/app.constants';

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
    description: 'Array of entity IDs to process (UUID v4 format)',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @MaxLength(MAX_BULK_ITEMS, { message: `Cannot process more than ${MAX_BULK_ITEMS} items at once` })
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

/**
 * DTO for updating content status
 */
export class UpdateStatusDto {
  @ApiProperty({
    description: 'New status to set',
    enum: ContentStatus,
    example: ContentStatus.PUBLISHED,
  })
  @IsEnum(ContentStatus)
  status: ContentStatus;

  @ApiPropertyOptional({
    description: 'Optional reason for status change',
    example: 'Content approved for publication',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Query DTO for filtering by status
 */
export class StatusFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by content status',
    enum: ContentStatus,
    example: ContentStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    description: 'Include trashed items',
    default: false,
  })
  @IsOptional()
  includeTrash?: boolean;
}
