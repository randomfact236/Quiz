import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsArray,
  MaxLength,
} from 'class-validator';

import {
  MIN_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_BULK_ITEMS,
  MIN_ORDER_VALUE,
  MAX_ORDER_VALUE,
  MIN_TIMER_SECONDS,
  MAX_TIMER_SECONDS,
} from '../constants/app.constants';
import { ContentStatus } from '../enums/content-status.enum';
import { IsImageUrl } from '../validators/image-url.validator';

// ==================== PAGINATION ====================

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PAGE_NUMBER)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: DEFAULT_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }: { value: unknown }) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_NUMBER, Math.floor(n)));
  })
  limit?: number;
}

// ==================== SEARCH ====================

export class SearchJokesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search in joke text' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
// ==================== BULK OPERATIONS ====================

export class BulkImportResultDto {
  @ApiProperty({ description: 'Number of items successfully imported' })
  success: number;

  @ApiProperty({ description: 'Number of items that failed to import' })
  failed: number;

  @ApiPropertyOptional({ description: 'Error messages for failed items', type: [String] })
  errors?: string[];
}
// ==================== CATEGORIES ====================

export class CreateJokeCategoryDto {
  @ApiProperty({ example: 'Programming', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '💻', description: 'Category emoji' })
  @IsOptional()
  @IsString()
  emoji?: string;
}

export class UpdateJokeCategoryDto {
  @ApiPropertyOptional({ example: 'Programming', description: 'Category name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '💻', description: 'Category emoji' })
  @IsOptional()
  @IsString()
  emoji?: string;
}

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

// ==================== DAD JOKES (Classic Format) ====================

export class CreateDadJokeDto {
  @ApiProperty({ example: "Why don't scientists trust atoms?" })
  @IsString()
  @IsNotEmpty()
  joke: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

export class UpdateDadJokeDto {
  @ApiPropertyOptional({ example: "Why don't scientists trust atoms?" })
  @IsOptional()
  @IsString()
  joke?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
// ==================== RIDDLE SUBJECTS (Quiz Format) ====================

export class CreateRiddleSubjectDto {
  @ApiPropertyOptional({
    example: 'brain-teasers',
    description: 'Unique slug (auto-generated if not provided)',
  })
  slug?: string;

  @ApiProperty({ example: 'Brain Teasers', description: 'Subject name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '🧩', description: 'Subject emoji' })
  @IsString()
  @IsNotEmpty()
  emoji: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Category ID (for Riddle MCQ)',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

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

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

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
// ==================== RIDDLE MCQs (Quiz Format) ====================

export class CreateRiddleMcqDto {
  @ApiProperty({ example: 'What has keys but no locks?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: ['A piano', 'A keyboard', 'A map', 'A car'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  correctLetter: string;

  @ApiProperty({ example: 'A piano' })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiProperty({ example: 'medium', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @IsEnum(['easy', 'medium', 'hard', 'expert', 'extreme'])
  level: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Subject ID (alternative to chapterId)',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

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

  @ApiPropertyOptional({ example: 'A piano' })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional({ example: 'medium', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert', 'extreme'])
  level?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Subject ID',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

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

// ==================== QUESTIONS ====================

export enum QuestionLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
  EXTREME = 'extreme',
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiPropertyOptional({ example: 'A', description: 'Correct letter for MCQ (A/B/C/D)' })
  @IsOptional()
  @IsString()
  correctLetter?: string;

  @ApiProperty({ example: ['Paris', 'London', 'Berlin', 'Madrid'], type: [String] })
  @IsOptional()
  @IsString({ each: true })
  options?: string[] | null;

  @ApiPropertyOptional({ description: 'Optional rationale shown in the review UI' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  explanation?: string | null;

  @ApiProperty({ example: 'easy', enum: QuestionLevel })
  @IsEnum(QuestionLevel)
  level: QuestionLevel;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Chapter ID' })
  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @ApiPropertyOptional({
    example: 'published',
    enum: ContentStatus,
    description: 'Question status',
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ example: 1, description: 'Question order within chapter' })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'What is the capital of France?' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ description: 'Optional rationale shown in the review UI' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  explanation?: string | null;

  @ApiPropertyOptional({ example: 'Paris' })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional({ example: 'A', description: 'Correct letter for MCQ (A/B/C/D)' })
  @IsOptional()
  @IsString()
  correctLetter?: string;

  @ApiPropertyOptional({ example: ['Paris', 'London', 'Berlin', 'Madrid'], type: [String] })
  @IsOptional()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'easy', enum: QuestionLevel })
  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Chapter ID',
  })
  @IsOptional()
  @IsString()
  chapterId?: string;
}

// ==================== SUBJECTS ====================

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'mathematics' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: '📚' })
  @IsString()
  @IsOptional()
  emoji?: string;

  @ApiProperty({ example: 'academic' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Math fundamentals and advanced topics' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional({ example: 'Mathematics' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Academic',
    description: 'Homepage world: Academic / Professional & Life / Entertainment & Culture',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Math fundamentals and advanced topics' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== IMAGE RIDDLE CATEGORIES ====================

export class CreateImageRiddleCategoryDto {
  @ApiProperty({ example: 'Optical Illusions', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '🖼️', description: 'Category emoji' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ example: 'Mind-bending visual puzzles' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateImageRiddleCategoryDto {
  @ApiPropertyOptional({ example: 'Optical Illusions' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '🖼️' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ example: 'Mind-bending visual puzzles' })
  @IsOptional()
  @IsString()
  description?: string | null;
}

// ==================== IMAGE RIDDLES ====================

export class CreateImageRiddleDto {
  @ApiProperty({ example: 'What do you see in this image?' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Image URL' })
  @IsImageUrl()
  imageUrl: string;

  @ApiProperty({ example: 'A hidden face in the tree' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({
    example: ['a hidden face', 'face in tree'],
    description: 'Alternative accepted answers (synonyms)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternativeAnswers?: string[];

  @ApiPropertyOptional({ example: 'Look closely at the branches' })
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiProperty({ example: 'medium', enum: ['easy', 'medium', 'hard', 'expert'] })
  @IsEnum(['easy', 'medium', 'hard', 'expert'])
  difficulty: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Custom timer in seconds (null = use difficulty default)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_TIMER_SECONDS)
  @Max(MAX_TIMER_SECONDS)
  timerSeconds?: number | null;

  @ApiPropertyOptional({ example: true, description: 'Whether to show timer to user' })
  @IsOptional()
  @IsBoolean()
  showTimer?: boolean;

  @ApiPropertyOptional({
    example: 'An optical illusion image showing a hidden face',
    description: 'Alt text for accessibility',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class UpdateImageRiddleDto {
  @ApiPropertyOptional({ example: 'What do you see in this image?' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsImageUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'A hidden face in the tree' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({
    example: ['a hidden face', 'face in tree'],
    description: 'Alternative accepted answers (synonyms)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternativeAnswers?: string[];

  @ApiPropertyOptional({ example: 'Look closely at the branches' })
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiPropertyOptional({ example: 'medium', enum: ['easy', 'medium', 'hard', 'expert'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert'])
  difficulty?: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Custom timer in seconds (null = use difficulty default)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_TIMER_SECONDS)
  @Max(MAX_TIMER_SECONDS)
  timerSeconds?: number | null;

  @ApiPropertyOptional({ example: true, description: 'Whether to show timer to user' })
  @IsOptional()
  @IsBoolean()
  showTimer?: boolean;

  @ApiPropertyOptional({ example: 'An optical illusion image' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SearchImageRiddlesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search in title or answer' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by difficulty',
    enum: ['easy', 'medium', 'hard', 'expert'],
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert'])
  difficulty?: string;
}
