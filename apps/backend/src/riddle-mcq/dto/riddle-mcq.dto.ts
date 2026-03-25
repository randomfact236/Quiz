import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';

import { RiddleMcqLevel } from '../../common/enums/riddle-mcq-level.enum';
import { RiddleStatus } from '../entities/riddle-mcq.entity';

export class RiddleMcqPaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class RiddleMcqSearchDto extends RiddleMcqPaginationDto {
  @ApiPropertyOptional({ description: 'Search in question text' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by level' })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert'])
  level?: string;
}

export class CreateRiddleMcqSubjectDto {
  @ApiPropertyOptional({ example: 'brain-teasers', description: 'Unique slug (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Brain Teasers', description: 'Subject name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '🧩', description: 'Subject emoji' })
  @IsString()
  @IsNotEmpty()
  emoji: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateRiddleMcqSubjectDto {
  @ApiPropertyOptional({ example: 'brain-teasers' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Brain Teasers' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '🧩' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class CreateRiddleCategoryDto {
  @ApiPropertyOptional({ example: 'logic-puzzles', description: 'Unique slug (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Logic Puzzles', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '🧩', description: 'Category emoji' })
  @IsString()
  @IsNotEmpty()
  emoji: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateRiddleCategoryDto {
  @ApiPropertyOptional({ example: 'logic-puzzles' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Logic Puzzles' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '🧩' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class CreateRiddleMcqChapterDto {
  @ApiProperty({ example: 'Logic Puzzles' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chapterNumber: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;
}

export class UpdateRiddleMcqChapterDto {
  @ApiPropertyOptional({ example: 'Logic Puzzles' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chapterNumber?: number;
}

export class CreateRiddleMcqDto {
  @ApiProperty({ example: 'What has keys but no locks?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ example: ['A piano', 'A keyboard', 'A map', 'A car'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  correctLetter?: string;

  @ApiProperty({ example: RiddleMcqLevel.MEDIUM, enum: RiddleMcqLevel })
  @IsEnum(RiddleMcqLevel, {
    message: `level must be one of: ${Object.values(RiddleMcqLevel).join(', ')}`,
  })
  level: RiddleMcqLevel;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @ApiPropertyOptional({ example: 'A piano has musical keys but no locks' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: RiddleStatus.DRAFT, enum: RiddleStatus, description: 'Riddle status' })
  @IsOptional()
  @IsEnum(RiddleStatus)
  status?: RiddleStatus;
}

export class UpdateRiddleMcqDto {
  @ApiPropertyOptional({ example: 'What has keys but no locks?' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ example: ['A piano', 'A keyboard', 'A map', 'A car'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  correctLetter?: string;

  @ApiPropertyOptional({ example: RiddleMcqLevel.MEDIUM, enum: RiddleMcqLevel })
  @IsOptional()
  @IsEnum(RiddleMcqLevel, {
    message: `level must be one of: ${Object.values(RiddleMcqLevel).join(', ')}`,
  })
  level?: RiddleMcqLevel;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiPropertyOptional({ example: 'A piano has musical keys but no locks' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: RiddleStatus.DRAFT, enum: RiddleStatus, description: 'Riddle status' })
  @IsOptional()
  @IsEnum(RiddleStatus)
  status?: RiddleStatus;
}