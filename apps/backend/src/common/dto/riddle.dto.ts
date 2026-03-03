/**
 * ============================================================================
 * Riddle DTOs — All riddle-specific Data Transfer Objects
 * ============================================================================
 * Separated from base.dto.ts to keep the common layer domain-agnostic.
 * Uses proper typed enums from common/enums rather than inline string arrays.
 * ============================================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    Min,
    IsEnum,
    IsBoolean,
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '../enums/content-status.enum';
import { RiddleDifficulty } from '../enums/riddle-difficulty.enum';
import { QuizRiddleLevel } from '../enums/quiz-riddle-level.enum';
import {
    MIN_PAGE_NUMBER,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
} from '../constants/app.constants';

// Re-export enums so consumers can import from a single riddle DTO path if needed
export { RiddleDifficulty } from '../enums/riddle-difficulty.enum';
export { QuizRiddleLevel } from '../enums/quiz-riddle-level.enum';

// ==================== PAGINATION (riddle-specific) ====================

export class RiddlePaginationDto {
    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(MIN_PAGE_NUMBER)
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page', default: DEFAULT_PAGE_SIZE })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(MIN_PAGE_NUMBER)
    @IsInt()
    limit?: number;
}

// ==================== SEARCH ====================

export class SearchRiddlesDto extends RiddlePaginationDto {
    @ApiPropertyOptional({ description: 'Search in question or answer' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by category ID' })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({
        description: 'Filter by difficulty',
        enum: RiddleDifficulty,
    })
    @IsOptional()
    @IsEnum(RiddleDifficulty, {
        message: `difficulty must be one of: ${Object.values(RiddleDifficulty).join(', ')}`,
    })
    difficulty?: RiddleDifficulty;
}

// ==================== CLASSIC RIDDLE CATEGORIES ====================

export class CreateRiddleCategoryDto {
    @ApiProperty({ example: 'Logic', description: 'Category name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: '🧩', description: 'Category emoji' })
    @IsOptional()
    @IsString()
    emoji?: string;
}

export class UpdateRiddleCategoryDto {
    @ApiPropertyOptional({ example: 'Logic', description: 'Category name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: '🧩', description: 'Category emoji' })
    @IsOptional()
    @IsString()
    emoji?: string;
}

// ==================== CLASSIC RIDDLES ====================

export class CreateRiddleDto {
    @ApiProperty({ example: 'What has keys but no locks?' })
    @IsString()
    @IsNotEmpty()
    question: string;

    @ApiProperty({ example: 'A piano' })
    @IsString()
    @IsNotEmpty()
    answer: string;

    @ApiProperty({ example: RiddleDifficulty.MEDIUM, enum: RiddleDifficulty })
    @IsEnum(RiddleDifficulty, {
        message: `difficulty must be one of: ${Object.values(RiddleDifficulty).join(', ')}`,
    })
    difficulty: RiddleDifficulty;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Category ID' })
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @ApiPropertyOptional({ example: ContentStatus.DRAFT, enum: ContentStatus })
    @IsOptional()
    @IsEnum(ContentStatus)
    status?: ContentStatus;
}

export class UpdateRiddleDto {
    @ApiPropertyOptional({ example: 'What has keys but no locks?' })
    @IsOptional()
    @IsString()
    question?: string;

    @ApiPropertyOptional({ example: 'A piano' })
    @IsOptional()
    @IsString()
    answer?: string;

    @ApiPropertyOptional({ example: RiddleDifficulty.MEDIUM, enum: RiddleDifficulty })
    @IsOptional()
    @IsEnum(RiddleDifficulty, {
        message: `difficulty must be one of: ${Object.values(RiddleDifficulty).join(', ')}`,
    })
    difficulty?: RiddleDifficulty;

    @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Category ID' })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({ example: ContentStatus.PUBLISHED, enum: ContentStatus })
    @IsOptional()
    @IsEnum(ContentStatus)
    status?: ContentStatus;
}

// ==================== RIDDLE SUBJECTS (Quiz Format) ====================

export class CreateRiddleSubjectDto {
    @ApiProperty({ example: 'brain-teasers', description: 'Unique slug' })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiProperty({ example: 'Brain Teasers', description: 'Subject name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '🧩', description: 'Subject emoji' })
    @IsString()
    @IsNotEmpty()
    emoji: string;

    @ApiPropertyOptional({ example: 'Mind-bending riddles and puzzles' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    order?: number;
}

export class UpdateRiddleSubjectDto {
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

    @ApiPropertyOptional({ example: 'Mind-bending riddles and puzzles' })
    @IsOptional()
    @IsString()
    description?: string;

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

// ==================== RIDDLE CHAPTERS (Quiz Format) ====================

export class CreateRiddleChapterDto {
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

export class UpdateRiddleChapterDto {
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

// ==================== QUIZ RIDDLES (Quiz Format) ====================

export class CreateQuizRiddleDto {
    @ApiProperty({ example: 'What has keys but no locks?' })
    @IsString()
    @IsNotEmpty()
    question: string;

    @ApiProperty({ example: ['A piano', 'A keyboard', 'A map', 'A car'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    options: string[];

    @ApiProperty({ example: 'A piano' })
    @IsString()
    @IsNotEmpty()
    correctAnswer: string;

    @ApiProperty({ example: QuizRiddleLevel.MEDIUM, enum: QuizRiddleLevel })
    @IsEnum(QuizRiddleLevel, {
        message: `level must be one of: ${Object.values(QuizRiddleLevel).join(', ')}`,
    })
    level: QuizRiddleLevel;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    @IsString()
    @IsNotEmpty()
    chapterId: string;

    @ApiPropertyOptional({ example: 'A piano has musical keys but no locks' })
    @IsOptional()
    @IsString()
    explanation?: string;

    @ApiPropertyOptional({ example: 'Think about musical instruments' })
    @IsOptional()
    @IsString()
    hint?: string;
}

export class UpdateQuizRiddleDto {
    @ApiPropertyOptional({ example: 'What has keys but no locks?' })
    @IsOptional()
    @IsString()
    question?: string;

    @ApiPropertyOptional({ example: ['A piano', 'A keyboard', 'A map', 'A car'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    options?: string[];

    @ApiPropertyOptional({ example: 'A piano' })
    @IsOptional()
    @IsString()
    correctAnswer?: string;

    @ApiPropertyOptional({ example: QuizRiddleLevel.MEDIUM, enum: QuizRiddleLevel })
    @IsOptional()
    @IsEnum(QuizRiddleLevel, {
        message: `level must be one of: ${Object.values(QuizRiddleLevel).join(', ')}`,
    })
    level?: QuizRiddleLevel;

    @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
    @IsOptional()
    @IsString()
    chapterId?: string;

    @ApiPropertyOptional({ example: 'A piano has musical keys but no locks' })
    @IsOptional()
    @IsString()
    explanation?: string;

    @ApiPropertyOptional({ example: 'Think about musical instruments' })
    @IsOptional()
    @IsString()
    hint?: string;
}
