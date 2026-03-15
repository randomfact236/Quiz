import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  // Riddle DTOs
  CreateRiddleDto,
  UpdateRiddleDto,
  CreateRiddleCategoryDto,
  UpdateRiddleCategoryDto,
  CreateRiddleSubjectDto,
  UpdateRiddleSubjectDto,
  CreateRiddleChapterDto,
  UpdateRiddleChapterDto,
  CreateQuizRiddleDto,
  UpdateQuizRiddleDto,
  SearchRiddlesDto,
  // Bulk DTOs
  BulkImportResultDto,
  BulkActionDto,
  BulkActionResponseDto,
  StatusCountResponseDto,
  StatusFilterDto,
} from '../common';
import { DEFAULT_PAGE_SIZE } from '../common/constants/app.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/base.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import { QuizRiddle } from './entities/quiz-riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { Riddle } from './entities/riddle.entity';
import { RiddlesService } from './riddles.service';


@ApiTags('Riddles')
@Controller('riddles')
export class RiddlesController {
  constructor(private readonly riddlesService: RiddlesService) { }

  // ==================== CLASSIC FORMAT - PUBLIC (static routes FIRST) ====================

  @Get('classic')
  @ApiOperation({ summary: 'Get all published classic riddles with pagination (public)' })
  @ApiResponse({ status: 200, description: 'Returns paginated published riddles' })
  findAllClassic(
    @Query() pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    // Always returns only PUBLISHED riddles — status cannot be overridden by public callers
    return this.riddlesService.findAllRiddles(pagination);
  }

  @Get('classic/random')
  @ApiOperation({ summary: 'Get a random classic riddle' })
  @ApiResponse({ status: 200, description: 'Returns a random riddle' })
  @ApiResponse({ status: 404, description: 'No riddles found' })
  findRandomClassic(): Promise<Riddle> {
    return this.riddlesService.findRandomRiddle();
  }

  @Get('classic/search')
  @ApiOperation({ summary: 'Search classic riddles' })
  @ApiResponse({ status: 200, description: 'Returns filtered riddles' })
  searchClassic(@Query() searchDto: SearchRiddlesDto): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.searchRiddles(searchDto);
  }

  @Get('classic/categories')
  @ApiOperation({ summary: 'Get all classic riddle categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  findCategories(): Promise<RiddleCategory[]> {
    return this.riddlesService.findAllCategories();
  }

  // ==================== CLASSIC FORMAT - ADMIN STATIC (before parameterized routes) ====================

  @Get('classic/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all classic riddles by status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns paginated riddles filtered by status' })
  findAllClassicAdmin(
    @Query() pagination: PaginationDto,
    @Query() filter: StatusFilterDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.findAllRiddles(pagination, filter.status);
  }

  @Get('classic/status-counts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get classic riddle counts by status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns status counts', type: StatusCountResponseDto })
  async getStatusCounts(): Promise<StatusCountResponseDto> {
    return this.riddlesService.getStatusCounts();
  }

  @Post('classic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new classic riddle (Admin only)' })
  @ApiResponse({ status: 201, description: 'Riddle created successfully' })
  createClassic(@Body() dto: CreateRiddleDto): Promise<Riddle> {
    return this.riddlesService.createRiddle(dto);
  }

  @Post('classic/bulk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create classic riddles (Admin only)' })
  @ApiResponse({ status: 201, description: 'Riddles created successfully', type: BulkImportResultDto })
  async createClassicBulk(@Body() dto: CreateRiddleDto[]): Promise<BulkImportResultDto> {
    const result = await this.riddlesService.createRiddlesBulk(dto);
    return { success: result.count, failed: result.errors.length, errors: result.errors };
  }

  @Post('classic/bulk-action')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute bulk action on classic riddles (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk action executed', type: BulkActionResponseDto })
  async executeBulkActionClassic(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.riddlesService.bulkActionClassic(dto.ids, dto.action);
  }

  @Post('classic/categories')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new riddle category (Admin only)' })
  createCategory(@Body() dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
    return this.riddlesService.createCategory(dto);
  }

  // ==================== CLASSIC FORMAT - PARAMETERISED ROUTES (MUST COME LAST) ====================
  // IMPORTANT: All static routes above MUST be declared before these parameterised routes.
  // NestJS resolves routes top-to-bottom; a parameterised segment like :id would otherwise
  // match static paths such as /random, /search, /status-counts before they are evaluated.

  @Get('classic/categories/:id')
  @ApiOperation({ summary: 'Get category by ID with riddles' })
  @ApiResponse({ status: 200, description: 'Returns category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findCategoryById(@Param('id') id: string): Promise<RiddleCategory> {
    return this.riddlesService.findCategoryById(id);
  }

  @Get('classic/category/:id')
  @ApiOperation({ summary: 'Get riddles by category' })
  @ApiResponse({ status: 200, description: 'Returns riddles in category' })
  findByCategory(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.findRiddlesByCategory(id, pagination);
  }

  @Get('classic/difficulty/:level')
  @ApiOperation({ summary: 'Get riddles by difficulty level (easy | medium | hard)' })
  @ApiResponse({ status: 200, description: 'Returns riddles by difficulty' })
  findByDifficulty(
    @Param('level') level: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    this.validateClassicDifficulty(level);
    return this.riddlesService.findRiddlesByDifficulty(level, pagination);
  }

  @Get('classic/:id')
  @ApiOperation({ summary: 'Get a published classic riddle by ID (public)' })
  @ApiParam({ name: 'id', description: 'UUID of the riddle' })
  @ApiResponse({ status: 200, description: 'Returns the riddle' })
  @ApiResponse({ status: 404, description: 'Riddle not found or not published' })
  findClassicById(@Param('id') id: string): Promise<Riddle> {
    return this.riddlesService.findRiddleById(id, false);
  }

  @Get('classic/:id/admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get any classic riddle by ID regardless of status (Admin only)' })
  @ApiParam({ name: 'id', description: 'UUID of the riddle' })
  @ApiResponse({ status: 200, description: 'Returns the riddle' })
  @ApiResponse({ status: 404, description: 'Riddle not found' })
  findClassicByIdAdmin(@Param('id') id: string): Promise<Riddle> {
    return this.riddlesService.findRiddleById(id, true);
  }

  @Put('classic/categories/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a riddle category (Admin only)' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateRiddleCategoryDto): Promise<RiddleCategory> {
    return this.riddlesService.updateCategory(id, dto);
  }

  @Delete('classic/categories/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a riddle category and all its riddles (Admin only)' })
  async removeCategory(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteCategory(id);
  }

  @Put('classic/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a classic riddle (Admin only)' })
  @ApiResponse({ status: 200, description: 'Riddle updated successfully' })
  @ApiResponse({ status: 404, description: 'Riddle not found' })
  updateClassic(@Param('id') id: string, @Body() dto: UpdateRiddleDto): Promise<Riddle> {
    return this.riddlesService.updateRiddle(id, dto);
  }

  @Delete('classic/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a classic riddle (Admin only)' })
  @ApiResponse({ status: 204, description: 'Riddle deleted successfully' })
  async removeClassic(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteRiddle(id);
  }

  // ==================== QUIZ FORMAT - PUBLIC ====================

  @Get('subjects')
  @ApiOperation({ summary: 'Get all active riddle subjects (Quiz format)' })
  @ApiResponse({ status: 200, description: 'Returns all active subjects' })
  findAllSubjects(@Query('hasContent') hasContent?: string): Promise<RiddleSubject[]> {
    return this.riddlesService.findAllSubjects(false, hasContent === 'true');
  }

  @Get('subjects/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subjects including inactive ones (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all subjects' })
  findAllSubjectsAdmin(): Promise<RiddleSubject[]> {
    // L-1 fix: allows admins to see inactive subjects so they can manage/re-activate them
    return this.riddlesService.findAllSubjects(true);
  }

  @Get('subjects/:slug')
  @ApiOperation({ summary: 'Get subject by slug with chapters (Quiz format)' })
  @ApiParam({ name: 'slug', example: 'brain-teasers' })
  @ApiResponse({ status: 200, description: 'Returns subject' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  findSubjectBySlug(@Param('slug') slug: string): Promise<RiddleSubject> {
    return this.riddlesService.findSubjectBySlug(slug);
  }

  @Get('chapters/active/all')
  @ApiOperation({ summary: 'Get all chapters across all subjects that have content' })
  @ApiResponse({ status: 200, description: 'Returns all active chapters' })
  findAllActiveChapters(): Promise<RiddleChapter[]> {
    return this.riddlesService.findAllActiveChapters();
  }

  @Get('chapters/:subjectId')
  @ApiOperation({ summary: 'Get chapters by subject ID (Quiz format)' })
  @ApiResponse({ status: 200, description: 'Returns chapters' })
  findChaptersBySubject(
    @Param('subjectId') subjectId: string,
    @Query('hasContent') hasContent?: string,
  ): Promise<RiddleChapter[]> {
    return this.riddlesService.findChaptersBySubject(subjectId, hasContent === 'true');
  }

  @Get('quiz/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all quiz riddles (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all quiz riddles' })
  findAllQuizRiddlesAdmin(): Promise<QuizRiddle[]> {
    return this.riddlesService.findAllQuizRiddlesAdmin();
  }

  @Get('quiz/:chapterId')
  @ApiOperation({ summary: 'Get quiz riddles by chapter ID' })
  @ApiResponse({ status: 200, description: 'Returns quiz riddles' })
  findQuizRiddlesByChapter(
    @Param('chapterId') chapterId: string,
    @Query() pagination: PaginationDto,
    @Query('level') level?: string,
  ): Promise<{ data: QuizRiddle[]; total: number }> {
    return this.riddlesService.findQuizRiddlesByChapter(chapterId, pagination, level);
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed quiz riddles from all chapters' })
  @ApiResponse({ status: 200, description: 'Returns mixed riddles' })
  getMixedQuizRiddles(@Query('count') count?: string): Promise<QuizRiddle[]> {
    const parsedCount = this.validateCount(count, DEFAULT_PAGE_SIZE, 1, 100);
    return this.riddlesService.findMixedQuizRiddles(parsedCount);
  }

  @Get('random/:level')
  @ApiOperation({ summary: 'Get random quiz riddles by difficulty level' })
  @ApiParam({ name: 'level', enum: ['easy', 'medium', 'hard', 'expert', 'extreme', 'all'] })
  @ApiResponse({ status: 200, description: 'Returns random riddles' })
  getRandomQuizRiddles(
    @Param('level') level: string,
    @Query('count') count?: string,
  ): Promise<QuizRiddle[]> {
    const parsedCount = this.validateCount(count, 10, 1, 50);
    this.validateQuizDifficulty(level);
    return this.riddlesService.findRandomQuizRiddles(level, parsedCount);
  }

  // ==================== QUIZ FORMAT - ADMIN ====================

  @Post('subjects')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle subject (Quiz format, Admin only)' })
  createSubject(@Body() dto: CreateRiddleSubjectDto): Promise<RiddleSubject> {
    return this.riddlesService.createSubject(dto);
  }

  @Put('subjects/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle subject (Quiz format, Admin only)' })
  updateSubject(
    @Param('id') id: string,
    @Body() dto: UpdateRiddleSubjectDto,
  ): Promise<RiddleSubject> {
    return this.riddlesService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete riddle subject (Quiz format, Admin only)' })
  async deleteSubject(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteSubject(id);
  }

  @Post('chapters')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle chapter (Quiz format, Admin only)' })
  createChapter(@Body() dto: CreateRiddleChapterDto): Promise<RiddleChapter> {
    return this.riddlesService.createChapter(dto);
  }

  @Put('chapters/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle chapter (Quiz format, Admin only)' })
  updateChapter(
    @Param('id') id: string,
    @Body() dto: UpdateRiddleChapterDto,
  ): Promise<RiddleChapter> {
    return this.riddlesService.updateChapter(id, dto);
  }

  @Delete('chapters/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete riddle chapter (Quiz format, Admin only)' })
  async deleteChapter(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteChapter(id);
  }

  @Post('quiz/bulk-action')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute bulk action on quiz riddles (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk action executed', type: BulkActionResponseDto })
  async executeBulkActionQuiz(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.riddlesService.bulkActionQuizRiddles(dto.ids, dto.action);
  }

  @Post('quiz')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new quiz riddle (Admin only)' })
  createQuizRiddle(@Body() dto: CreateQuizRiddleDto): Promise<QuizRiddle> {
    return this.riddlesService.createQuizRiddle(dto);
  }

  @Post('quiz/bulk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create quiz riddles (Admin only)' })
  async createQuizRiddlesBulk(@Body() dto: CreateQuizRiddleDto[]): Promise<{ count: number; errors: string[] }> {
    const result = await this.riddlesService.createQuizRiddlesBulk(dto);
    return { count: result.count, errors: result.errors };
  }

  @Put('quiz/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quiz riddle (Admin only)' })
  updateQuizRiddle(
    @Param('id') id: string,
    @Body() dto: UpdateQuizRiddleDto,
  ): Promise<QuizRiddle> {
    return this.riddlesService.updateQuizRiddle(id, dto);
  }

  @Delete('quiz/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete quiz riddle (Admin only)' })
  async deleteQuizRiddle(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteQuizRiddle(id);
  }

  // ==================== STATS ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get riddles statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  getStats(): Promise<{
    totalClassicRiddles: number;
    totalCategories: number;
    totalQuizRiddles: number;
    totalSubjects: number;
    totalChapters: number;
    riddlesByDifficulty: Record<string, number>;
  }> {
    return this.riddlesService.getStats();
  }

  // ==================== VALIDATION HELPERS ====================

  /**
   * Validate and parse count parameter
   */
  private validateCount(
    count: string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ): number {
    if (count === undefined || count === '') {
      return defaultValue;
    }

    const parsed = parseInt(count, 10);
    if (isNaN(parsed)) {
      throw new BadRequestException(`Invalid count parameter: ${count}`);
    }
    if (parsed < min) {
      throw new BadRequestException(`Count must be at least ${min}`);
    }
    if (parsed > max) {
      throw new BadRequestException(`Count must not exceed ${max}`);
    }
    return parsed;
  }

  /**
  /**
   * Validate difficulty level for CLASSIC riddles.
   * Classic riddle DB enum only allows: easy | medium | hard.
   * Prevents values like 'expert' or 'extreme' that only belong to quiz riddles.
   */
  private validateClassicDifficulty(level: string): void {
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(level)) {
      throw new BadRequestException(
        `Invalid difficulty level: "${level}". Valid values for classic riddles are: ${validDifficulties.join(', ')}`,
      );
    }
  }

  /**
   * Validate difficulty level for QUIZ riddles.
   * Quiz riddle DB enum allows: easy | medium | hard | expert | extreme.
   */
  private validateQuizDifficulty(level: string): void {
    const validDifficulties = ['easy', 'medium', 'hard', 'expert', 'extreme'];
    if (!validDifficulties.includes(level)) {
      throw new BadRequestException(
        `Invalid difficulty level: "${level}". Valid values for quiz riddles are: ${validDifficulties.join(', ')}`,
      );
    }
  }
}

