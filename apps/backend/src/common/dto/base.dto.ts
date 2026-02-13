import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsEnum, IsBoolean, IsArray } from 'class-validator';
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

// ==================== DAD JOKES (Classic Format) ====================

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

// ==================== RIDDLES (Classic Format) ====================

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

// ==================== JOKE SUBJECTS (Quiz Format) ====================

export class CreateJokeSubjectDto {
  @ApiProperty({ example: 'dad-jokes', description: 'Unique slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Dad Jokes', description: 'Subject name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '😂', description: 'Subject emoji' })
  @IsString()
  @IsNotEmpty()
  emoji: string;

  @ApiPropertyOptional({ example: 'Classic dad jokes for everyone' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateJokeSubjectDto {
  @ApiPropertyOptional({ example: 'dad-jokes' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Dad Jokes' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '😂' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ example: 'Classic dad jokes for everyone' })
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

// ==================== JOKE CHAPTERS (Quiz Format) ====================

export class CreateJokeChapterDto {
  @ApiProperty({ example: 'Programming Jokes' })
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

export class UpdateJokeChapterDto {
  @ApiPropertyOptional({ example: 'Programming Jokes' })
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

// ==================== QUIZ JOKES (Quiz Format) ====================

export class CreateQuizJokeDto {
  @ApiProperty({ example: 'Why don\'t scientists trust atoms?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: ['Because they make up everything', 'They are too small', 'They are unstable', 'They are radioactive'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ example: 'Because they make up everything' })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiProperty({ example: 'easy', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @IsEnum(['easy', 'medium', 'hard', 'expert', 'extreme'])
  level: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @ApiPropertyOptional({ example: 'The punchline plays on the double meaning of "make up"' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 'Because they make up everything!' })
  @IsOptional()
  @IsString()
  punchline?: string;
}

export class UpdateQuizJokeDto {
  @ApiPropertyOptional({ example: 'Why don\'t scientists trust atoms?' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ example: ['Because they make up everything', 'They are too small', 'They are unstable', 'They are radioactive'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'Because they make up everything' })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional({ example: 'easy', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert', 'extreme'])
  level?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiPropertyOptional({ example: 'The punchline plays on the double meaning of "make up"' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 'Because they make up everything!' })
  @IsOptional()
  @IsString()
  punchline?: string;
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

  @ApiProperty({ example: 'medium', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @IsEnum(['easy', 'medium', 'hard', 'expert', 'extreme'])
  level: string;

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

  @ApiPropertyOptional({ example: 'medium', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert', 'extreme'])
  level?: string;

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
