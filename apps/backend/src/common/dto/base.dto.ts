import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// ==================== PAGINATION ====================

export class PaginationDto {
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
  @Max(100)
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

export class SearchRiddlesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search in question or answer' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by difficulty', enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;
}

export class SearchQuestionsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search in question text' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by subject ID' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by level' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'Filter by chapter' })
  @IsOptional()
  @IsString()
  chapter?: string;
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

export class BulkDeleteDto {
  @ApiProperty({ description: 'IDs to delete', type: [String] })
  @IsString({ each: true })
  ids: string[];
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

// ==================== DAD JOKES ====================

export class CreateDadJokeDto {
  @ApiProperty({ example: 'Why don\'t scientists trust atoms?' })
  @IsString()
  @IsNotEmpty()
  joke: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

export class UpdateDadJokeDto {
  @ApiPropertyOptional({ example: 'Why don\'t scientists trust atoms?' })
  @IsOptional()
  @IsString()
  joke?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

// ==================== RIDDLES ====================

export class CreateRiddleDto {
  @ApiProperty({ example: 'What has keys but no locks?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'A piano' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ example: 'medium', enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
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

  @ApiPropertyOptional({ example: 'medium', enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

// ==================== QUESTIONS ====================

export enum QuestionLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
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

  @ApiProperty({ example: ['London', 'Berlin', 'Madrid'], type: [String] })
  @IsString({ each: true })
  wrongAnswers: string[];

  @ApiProperty({ example: 'easy', enum: QuestionLevel })
  @IsEnum(QuestionLevel)
  level: QuestionLevel;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Chapter ID' })
  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @ApiPropertyOptional({ example: 'Paris is the capital city of France.' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'What is the capital of France?' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ example: 'Paris' })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional({ example: ['London', 'Berlin', 'Madrid'], type: [String] })
  @IsOptional()
  @IsString({ each: true })
  wrongAnswers?: string[];

  @ApiPropertyOptional({ example: 'easy', enum: QuestionLevel })
  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Chapter ID' })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiPropertyOptional({ example: 'Paris is the capital city of France.' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

// ==================== SUBJECTS ====================

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @ApiPropertyOptional({ example: 'Math fundamentals and advanced topics' })
  @IsOptional()
  @IsString()
  description?: string;
}

// ==================== USER ANSWERS ====================

export class CreateUserAnswerDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;
}
