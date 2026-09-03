/**
 * ============================================================================
 * Comments DTOs
 * ============================================================================
 * Validation for the shared /comments endpoints (comments-system plan §2.2).
 * Text is capped at 280 chars; chip values must come from the server
 * allow-list enum; guest identity is a client-issued `guestId` string.
 * ============================================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  IsBoolean,
} from 'class-validator';

import { PaginationDto } from '../../common/dto/base.dto';
import { ContentStatus } from '../../common/enums/content-status.enum';

import { CommentChip, CommentContentType, CommentKind } from '../entities/comment.entity';

export const COMMENT_TEXT_MAX_LENGTH = 280;

export class CreateCommentDto {
  @ApiProperty({ enum: CommentContentType, example: CommentContentType.IMAGE_RIDDLE })
  @IsEnum(CommentContentType)
  contentType: CommentContentType;

  @ApiProperty({ description: 'Riddle or joke ID', format: 'uuid' })
  @IsUUID()
  contentId: string;

  @ApiProperty({ enum: CommentKind, example: CommentKind.GUESS })
  @IsEnum(CommentKind)
  kind: CommentKind;

  @ApiPropertyOptional({ description: 'Guess/comment text (required for guess & comment kinds)' })
  @IsOptional()
  @IsString()
  @MaxLength(COMMENT_TEXT_MAX_LENGTH)
  text?: string;

  @ApiPropertyOptional({ description: 'Chip value (required for chip kind)', enum: CommentChip })
  @IsOptional()
  @IsEnum(CommentChip)
  chip?: CommentChip;

  @ApiPropertyOptional({ description: 'Display name (guest-typed); shown on the feed' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  authorName?: string;
}

export class CommentFeedQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Only entries from this guest (delete-own UI)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  guestId?: string;
}

export class MyCommentsQueryDto {
  @ApiProperty({ enum: CommentContentType })
  @IsEnum(CommentContentType)
  contentType: CommentContentType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  contentId: string;

  @ApiProperty({ description: 'Client-issued guest identity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestId: string;
}

export class CommentCountsQueryDto {
  @ApiPropertyOptional({ enum: CommentContentType, default: CommentContentType.JOKE })
  @IsOptional()
  @IsEnum(CommentContentType)
  contentType?: CommentContentType;

  @ApiProperty({ description: 'Comma-separated content IDs to count comments for' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  ids: string;
}

export class AdminCommentListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ enum: CommentContentType })
  @IsOptional()
  @IsEnum(CommentContentType)
  contentType?: CommentContentType;

  @ApiPropertyOptional({ description: 'Only flagged comments when true' })
  @IsOptional()
  @IsBoolean()
  flagged?: boolean;
}

/** Feed pagination default used by the service when query params are absent. */
export const COMMENT_PAGINATION_DEFAULTS = { page: 1, limit: 20 } as const;
