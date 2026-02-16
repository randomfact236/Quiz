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
import { RiddlesService } from './riddles.service';
import {
  CreateRiddleDto,
  CreateRiddleCategoryDto,
  UpdateRiddleCategoryDto,
  CreateRiddleSubjectDto,
  UpdateRiddleSubjectDto,
  CreateRiddleChapterDto,
  UpdateRiddleChapterDto,
  CreateQuizRiddleDto,
  UpdateQuizRiddleDto,
  PaginationDto,
  SearchRiddlesDto,
  BulkImportResultDto,
} from '../common/dto/base.dto';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { QuizRiddle } from './entities/quiz-riddle.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BulkActionDto, BulkActionResponseDto, StatusCountResponseDto, StatusFilterDto } from '../common/dto/bulk-action.dto';
import { DEFAULT_PAGE_SIZE } from '../common/constants/app.constants';

@ApiTags('Riddles')
@Controller('riddles')
export class RiddlesController {
  constructor(private readonly riddlesService: RiddlesService) {}

  // ==================== CLASSIC FORMAT - PUBLIC ====================

  @Get('classic')
  @ApiOperation({ summary: 'Get all classic riddles with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated riddles' })
  findAllClassic(
    @Query() pagination: PaginationDto,
    @Query() filter: StatusFilterDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.findAllRiddles(pagination, filter.status);
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
  @ApiOperation({ summary: 'Get riddles by difficulty level' })
  @ApiResponse({ status: 200, description: 'Returns riddles by difficulty' })
  findByDifficulty(
    @Param('level') level: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    this.validateDifficulty(level);
    return this.riddlesService.findRiddlesByDifficulty(level, pagination);
  }

  // ==================== CLASSIC FORMAT - ADMIN ====================

  @Post('classic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new classic riddle (Admin only)' })
  @ApiResponse({ status: 201, description: 'Riddle created successfully' })
  createClassic(@Body() dto: CreateRiddleDto): Promise<Riddle> {
    return this.riddlesService.createRiddle(dto);
  }

  @Post('classic/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create classic riddles (Admin only)' })
  @ApiResponse({ status: 201, description: 'Riddles created successfully', type: BulkImportResultDto })
  async createClassicBulk(@Body() dto: CreateRiddleDto[]): Promise<BulkImportResultDto> {
    const result = await this.riddlesService.createRiddlesBulk(dto);
    return { success: result.count, failed: result.errors.length, errors: result.errors };
  }

  @Put('classic/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a classic riddle (Admin only)' })
  @ApiResponse({ status: 200, description: 'Riddle updated successfully' })
  @ApiResponse({ status: 404, description: 'Riddle not found' })
  updateClassic(@Param('id') id: string, @Body() dto: Partial<CreateRiddleDto>): Promise<Riddle> {
    return this.riddlesService.updateRiddle(id, dto);
  }

  @Delete('classic/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a classic riddle (Admin only)' })
  @ApiResponse({ status: 204, description: 'Riddle deleted successfully' })
  async removeClassic(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteRiddle(id);
  }

  // ==================== BULK ACTIONS - CLASSIC RIDDLES ====================

  @Post('classic/bulk-action')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute bulk action on classic riddles (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk action executed', type: BulkActionResponseDto })
  async executeBulkActionClassic(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.riddlesService.bulkActionClassic(dto.ids, dto.action);
  }

  @Get('classic/status-counts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get classic riddle counts by status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns status counts', type: StatusCountResponseDto })
  async getStatusCounts(): Promise<StatusCountResponseDto> {
    return this.riddlesService.getStatusCounts();
  }

  @Post('classic/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new riddle category (Admin only)' })
  createCategory(@Body() dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
    return this.riddlesService.createCategory(dto);
  }

  @Put('classic/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a riddle category (Admin only)' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateRiddleCategoryDto): Promise<RiddleCategory> {
    return this.riddlesService.updateCategory(id, dto);
  }

  @Delete('classic/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a riddle category and all its riddles (Admin only)' })
  async removeCategory(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteCategory(id);
  }

  // ==================== QUIZ FORMAT - PUBLIC ====================

  @Get('subjects')
  @ApiOperation({ summary: 'Get all riddle subjects (Quiz format)' })
  @ApiResponse({ status: 200, description: 'Returns all subjects' })
  findAllSubjects(): Promise<RiddleSubject[]> {
    return this.riddlesService.findAllSubjects();
  }

  @Get('subjects/:slug')
  @ApiOperation({ summary: 'Get subject by slug with chapters (Quiz format)' })
  @ApiParam({ name: 'slug', example: 'brain-teasers' })
  @ApiResponse({ status: 200, description: 'Returns subject' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  findSubjectBySlug(@Param('slug') slug: string): Promise<RiddleSubject> {
    return this.riddlesService.findSubjectBySlug(slug);
  }

  @Get('chapters/:subjectId')
  @ApiOperation({ summary: 'Get chapters by subject ID (Quiz format)' })
  @ApiResponse({ status: 200, description: 'Returns chapters' })
  findChaptersBySubject(@Param('subjectId') subjectId: string): Promise<RiddleChapter[]> {
    return this.riddlesService.findChaptersBySubject(subjectId);
  }

  @Get('quiz/:chapterId')
  @ApiOperation({ summary: 'Get quiz riddles by chapter ID' })
  @ApiResponse({ status: 200, description: 'Returns quiz riddles' })
  findQuizRiddlesByChapter(
    @Param('chapterId') chapterId: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: QuizRiddle[]; total: number }> {
    return this.riddlesService.findQuizRiddlesByChapter(chapterId, pagination);
  }

  @Get('random/:level')
  @ApiOperation({ summary: 'Get random quiz riddles by difficulty level' })
  @ApiParam({ name: 'level', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @ApiResponse({ status: 200, description: 'Returns random riddles' })
  getRandomQuizRiddles(
    @Param('level') level: string,
    @Query('count') count?: string,
  ): Promise<QuizRiddle[]> {
    const parsedCount = this.validateCount(count, 10, 1, 50);
    this.validateDifficulty(level);
    return this.riddlesService.findRandomQuizRiddles(level, parsedCount);
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed quiz riddles from all chapters' })
  @ApiResponse({ status: 200, description: 'Returns mixed riddles' })
  getMixedQuizRiddles(@Query('count') count?: string): Promise<QuizRiddle[]> {
    const parsedCount = this.validateCount(count, DEFAULT_PAGE_SIZE, 1, 100);
    return this.riddlesService.findMixedQuizRiddles(parsedCount);
  }

  // ==================== QUIZ FORMAT - ADMIN ====================

  @Post('subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle subject (Quiz format, Admin only)' })
  createSubject(@Body() dto: CreateRiddleSubjectDto): Promise<RiddleSubject> {
    return this.riddlesService.createSubject(dto);
  }

  @Put('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle subject (Quiz format, Admin only)' })
  updateSubject(
    @Param('id') id: string,
    @Body() dto: UpdateRiddleSubjectDto,
  ): Promise<RiddleSubject> {
    return this.riddlesService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete riddle subject (Quiz format, Admin only)' })
  async deleteSubject(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteSubject(id);
  }

  @Post('chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle chapter (Quiz format, Admin only)' })
  createChapter(@Body() dto: CreateRiddleChapterDto): Promise<RiddleChapter> {
    return this.riddlesService.createChapter(dto);
  }

  @Put('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle chapter (Quiz format, Admin only)' })
  updateChapter(
    @Param('id') id: string,
    @Body() dto: UpdateRiddleChapterDto,
  ): Promise<RiddleChapter> {
    return this.riddlesService.updateChapter(id, dto);
  }

  @Delete('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete riddle chapter (Quiz format, Admin only)' })
  async deleteChapter(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteChapter(id);
  }

  @Post('quiz')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new quiz riddle (Admin only)' })
  createQuizRiddle(@Body() dto: CreateQuizRiddleDto): Promise<QuizRiddle> {
    return this.riddlesService.createQuizRiddle(dto);
  }

  @Post('quiz/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create quiz riddles (Admin only)' })
  async createQuizRiddlesBulk(@Body() dto: CreateQuizRiddleDto[]): Promise<{ count: number; errors: string[] }> {
    const result = await this.riddlesService.createQuizRiddlesBulk(dto);
    return { count: result.count, errors: result.errors };
  }

  @Put('quiz/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quiz riddle (Admin only)' })
  updateQuizRiddle(
    @Param('id') id: string,
    @Body() dto: UpdateQuizRiddleDto,
  ): Promise<QuizRiddle> {
    return this.riddlesService.updateQuizRiddle(id, dto);
  }

  @Delete('quiz/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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
   * Validate difficulty level
   */
  private validateDifficulty(level: string): void {
    const validDifficulties = ['easy', 'medium', 'hard', 'expert', 'extreme'];
    if (!validDifficulties.includes(level)) {
      throw new BadRequestException(
        `Invalid difficulty level: ${level}. Valid values are: ${validDifficulties.join(', ')}`,
      );
    }
  }
}
