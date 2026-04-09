import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  RawBodyRequest,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiQuery,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DEFAULT_PAGE_SIZE } from '../common/constants/app.constants';
import { ContentStatus } from '../common/enums/content-status.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateQuestionDto, CreateSubjectDto, PaginationDto } from '../common/dto/base.dto';
import {
  BulkActionDto,
  BulkActionResponseDto,
  StatusCountResponseDto,
} from '../common/dto/bulk-action.dto';
import { BulkQuestionDto } from '../common/dto/bulk-question.dto';
import { ExportQueryDto } from './dto/export-query.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import { Chapter } from './entities/chapter.entity';
import { Question } from './entities/question.entity';
import { Subject } from './entities/subject.entity';
import { QuizService } from './quiz.service';

export class QuizQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by content status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by subject slug' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Filter by level' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'Filter by chapter name' })
  @IsOptional()
  @IsString()
  chapter?: string;

  @ApiPropertyOptional({ description: 'Search in question text' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Cursor for pagination (base64 encoded)' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ==================== SUBJECTS ====================

  @Get('subjects')
  @ApiOperation({ summary: 'Get all subjects' })
  async getAllSubjects(
    @Query('hasContent') hasContent?: string
  ): Promise<{ data: Subject[]; total: number }> {
    return this.quizService.findAllSubjects(undefined, hasContent === 'true');
  }

  @Get('subjects/:slug')
  @ApiOperation({ summary: 'Get subject by slug with chapters' })
  @ApiParam({ name: 'slug', example: 'science' })
  async getSubjectBySlug(@Param('slug') slug: string): Promise<Subject> {
    return this.quizService.findSubjectBySlug(slug);
  }

  @Get('subjects/:slug/questions')
  @ApiOperation({
    summary: 'Get questions by subject slug with filters (PUBLIC - always returns PUBLISHED only)',
  })
  @ApiParam({ name: 'slug', example: 'science' })
  async getQuestionsBySubjectSlug(
    @Param('slug') slug: string,
    @Query('level') level?: string,
    @Query('chapter') chapter?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number
  ): Promise<{ data: Question[]; total: number }> {
    // If no limit sent → return ALL questions (no limit)
    // If limit sent → apply it for future flexibility
    const filters = { status: ContentStatus.PUBLISHED, level, chapter, search, subjectSlug: slug };
    return this.quizService.findAllQuestions({ page: 1, limit: limit || 0 }, filters);
  }

  @Get('filter-counts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get unified filter counts - single endpoint for all filters (Admin only)',
  })
  @ApiQuery({ name: 'subject', required: false, description: 'Subject slug' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'chapter', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getFilterCounts(
    @Query('subject') subject?: string,
    @Query('status') status?: string,
    @Query('level') level?: string,
    @Query('chapter') chapter?: string,
    @Query('search') search?: string
  ): Promise<{
    subjects: {
      id: string;
      name: string;
      slug: string;
      emoji: string;
      category: string;
      count: number;
    }[];
    chapterCounts: { id: string; name: string; count: number; subjectId: string }[];
    levelCounts: { level: string; count: number }[];
    statusCounts: { status: string; count: number }[];
    total: number;
  }> {
    return this.quizService.getFilterCounts({ subject, status, level, chapter, search });
  }

  @Post('subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new subject (Admin only)' })
  async createSubject(@Body() dto: CreateSubjectDto): Promise<Subject> {
    return this.quizService.createSubject(dto);
  }

  @Put('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subject (Admin only)' })
  async updateSubject(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSubjectDto>
  ): Promise<Subject> {
    return this.quizService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete subject (Admin only)' })
  async deleteSubject(@Param('id') id: string): Promise<{ message: string }> {
    await this.quizService.deleteSubject(id);
    return { message: 'Subject deleted successfully' };
  }

  // ==================== CHAPTERS ====================

  @Get('chapters')
  @ApiOperation({ summary: 'Get all chapters' })
  async getAllChapters(): Promise<Chapter[]> {
    return this.quizService.findAllChapters();
  }

  @Get('chapters/:subjectId')
  @ApiOperation({ summary: 'Get chapters by subject ID' })
  async getChaptersBySubject(@Param('subjectId') subjectId: string): Promise<Chapter[]> {
    return this.quizService.findChaptersBySubject(subjectId);
  }

  @Post('chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new chapter (Admin only)' })
  async createChapter(@Body() dto: { name: string; subjectId: string }): Promise<Chapter> {
    return this.quizService.createChapter(dto.name, dto.subjectId);
  }

  @Patch('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update chapter (Admin only)' })
  async updateChapter(
    @Param('id') id: string,
    @Body() dto: { name?: string; subjectId?: string }
  ): Promise<Chapter> {
    return this.quizService.updateChapter(id, dto);
  }

  @Delete('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete chapter (Admin only)' })
  async deleteChapter(@Param('id') id: string): Promise<{ message: string }> {
    await this.quizService.deleteChapter(id);
    return { message: 'Chapter deleted successfully' };
  }

  // ==================== QUESTIONS ====================

  @Get('questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all questions with optional filters (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns paginated questions', type: Object })
  async getAllQuestions(
    @Query() query: QuizQueryDto
  ): Promise<{ data: Question[]; total: number; totalPages: number }> {
    const pagination = { page: query.page || 1, limit: query.limit || 10 };
    const filters = {
      status: query.status as any,
      subjectSlug: query.subject,
      level: query.level,
      chapter: query.chapter,
      search: query.search,
    };

    const result = await this.quizService.findAllQuestions(pagination, filters);
    return {
      data: result.data,
      total: result.total,
      totalPages: result.totalPages,
    };
  }

  @Get('questions/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export questions as CSV (Admin only)' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportQuestions(
    @Query() query: ExportQueryDto
  ): Promise<{ csv: string; filename: string }> {
    return this.quizService.exportQuestionsToCSV({
      subjectSlug: query.subject,
      level: query.level,
      chapter: query.chapter,
      status: query.status as any,
    });
  }

  @Get('questions/:chapterId')
  @ApiOperation({ summary: 'Get questions by chapter ID (PUBLIC - always returns PUBLISHED only)' })
  async getQuestionsByChapter(
    @Param('chapterId') chapterId: string
  ): Promise<{ data: Question[]; total: number }> {
    // PUBLIC ENDPOINT: Already filtered by PUBLISHED in service
    return this.quizService.findAllQuestionsByChapter(chapterId);
  }

  private validateCount(count: string | undefined, defaultValue: number, max: number = 50): number {
    if (!count) {
      return defaultValue;
    }
    const parsed = parseInt(count, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw new BadRequestException('Count must be a positive number');
    }
    if (parsed > max) {
      throw new BadRequestException(`Count cannot exceed ${max}`);
    }
    return parsed;
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed questions from all subjects' })
  async getMixedQuestions(): Promise<{ data: Question[]; total: number }> {
    return this.quizService.findAllMixedQuestions();
  }

  @Get('random/:level')
  @ApiOperation({ summary: 'Get random questions by difficulty level' })
  async getRandomQuestions(
    @Param('level') level: string
  ): Promise<{ data: Question[]; total: number }> {
    return this.quizService.findAllRandomQuestionsByLevel(level);
  }

  @Post('questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new question (Admin only)' })
  async createQuestion(@Body() dto: CreateQuestionDto): Promise<Question> {
    return this.quizService.createQuestion(dto);
  }

  @Post('questions/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk create questions with auto-create subjects/chapters (Admin only)',
  })
  async createQuestionsBulk(
    @Body() dto: BulkQuestionDto
  ): Promise<{ count: number; errors: string[] }> {
    if (!dto.questions || dto.questions.length === 0) {
      throw new BadRequestException('Request body must contain questions array');
    }
    return await this.quizService.createQuestionsBulkFromImport(dto);
  }

  @Patch('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update question (Admin only)' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() dto: Partial<CreateQuestionDto>
  ): Promise<Question> {
    return this.quizService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete question (Admin only)' })
  async deleteQuestion(@Param('id') id: string): Promise<{ message: string }> {
    await this.quizService.deleteQuestion(id);
    return { message: 'Question deleted successfully' };
  }

  // ==================== BULK ACTIONS ====================

  @Post('bulk-action')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute bulk action' })
  async executeBulkAction(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.quizService.bulkAction(dto.ids, dto.action);
  }

  @Get('subjects/:slug/status-counts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get question counts by status for a subject (Admin only)' })
  @ApiParam({ name: 'slug', example: 'animals' })
  @ApiResponse({
    status: 200,
    description: 'Returns status counts for subject',
    type: StatusCountResponseDto,
  })
  async getStatusCountsBySubject(@Param('slug') slug: string): Promise<StatusCountResponseDto> {
    return this.quizService.getStatusCountsBySubject(slug);
  }
}
