/**
 * ============================================================================
 * Media DTOs
 * ============================================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { Media } from '../entities/media.entity';

export class QueryMediaDto {
  @ApiPropertyOptional({ description: 'Search by filename' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

export class UpdateMediaDto {
  @ApiPropertyOptional({ description: 'Alt text for accessibility' })
  @IsOptional()
  @IsString()
  alt?: string;
}

export interface MediaListResponse {
  data: Media[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConversionStats {
  total: number;
  converted: number;
  pending: number;
  storageSavedBytes: number;
}

export class UploadErrorResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;
}
