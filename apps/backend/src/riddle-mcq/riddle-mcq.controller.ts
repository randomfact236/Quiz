import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DEFAULT_PAGE_SIZE } from '../common/constants/app.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { BulkActionDto, BulkActionResponseDto } from '../common/dto/bulk-action.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { RiddleMcq } from './entities/riddle-mcq.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { RiddleMcqService } from './riddle-mcq.service';
import {
  CreateRiddleCategoryDto,
  CreateRiddleMcqChapterDto,
  CreateRiddleMcqDto,
  CreateRiddleMcqSubjectDto,
  RiddleMcqPaginationDto,
  UpdateRiddleCategoryDto,
  UpdateRiddleMcqChapterDto,
  UpdateRiddleMcqDto,
  UpdateRiddleMcqSubjectDto,
} from './dto/riddle-mcq.dto';

@ApiTags('Riddle MCQ')
@Controller('riddle-mcq')
export class RiddleMcqController {
  constructor(private readonly riddleMcqService: RiddleMcqService) {}

  // ==================== CATEGORIES ====================

  @Get('categories')
  @ApiOperation({ summary: 'Get all active riddle categories' })
  async getAllCategories(): Promise<RiddleCategory[]> {
    return this.riddleMcqService.findAllCategories(false);
  }

  @Get('categories/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories including inactive (Admin only)' })
  async getAllCategoriesAdmin(): Promise<RiddleCategory[]> {
    return this.riddleMcqService.findAllCategories(true);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategoryById(@Param('id') id: string): Promise<RiddleCategory> {
    return this.riddleMcqService.findCategoryById(id);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle category (Admin only)' })
  async createCategory(@Body() dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
    return this.riddleMcqService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle category (Admin only)' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateRiddleCategoryDto,
  ): Promise<RiddleCategory> {
    return this.riddleMcqService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete riddle category (Admin only)' })
  async deleteCategory(@Param('id') id: string): Promise<{ message: string }> {
    await this.riddleMcqService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }

  // ==================== SUBJECTS ====================

  @Get('subjects')
  @ApiOperation({ summary: 'Get all active riddle subjects' })
  async getAllSubjects(
    @Query('hasContent') hasContent?: string,
  ): Promise<RiddleSubject[]> {
    return this.riddleMcqService.findAllSubjects(false, hasContent === 'true');
  }

  @Get('subjects/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subjects including inactive (Admin only)' })
  async getAllSubjectsAdmin(): Promise<RiddleSubject[]> {
    return this.riddleMcqService.findAllSubjects(true);
  }

  @Get('subjects/:slug')
  @ApiOperation({ summary: 'Get subject by slug with chapters' })
  @ApiParam({ name: 'slug', example: 'brain-teasers' })
  async getSubjectBySlug(@Param('slug') slug: string): Promise<RiddleSubject> {
    return this.riddleMcqService.findSubjectBySlug(slug);
  }

  @Post('subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle subject (Admin only)' })
  async createSubject(@Body() dto: CreateRiddleMcqSubjectDto): Promise<RiddleSubject> {
    return this.riddleMcqService.createSubject(dto);
  }

  @Patch('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle subject (Admin only)' })
  async updateSubject(
    @Param('id') id: string,
    @Body() dto: UpdateRiddleMcqSubjectDto,
  ): Promise<RiddleSubject> {
    return this.riddleMcqService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete riddle subject (Admin only)' })
  async deleteSubject(@Param('id') id: string): Promise<{ message: string }> {
    await this.riddleMcqService.deleteSubject(id);
    return { message: 'Subject deleted successfully' };
  }

  // ==================== CHAPTERS ====================

  @Get('chapters/active/all')
  @ApiOperation({ summary: 'Get all chapters across all subjects that have content' })
  async getAllActiveChapters(): Promise<RiddleChapter[]> {
    return this.riddleMcqService.findAllActiveChapters();
  }

  @Get('chapters/:subjectId')
  @ApiOperation({ summary: 'Get chapters by subject ID' })
  async getChaptersBySubject(
    @Param('subjectId') subjectId: string,
    @Query('hasContent') hasContent?: string,
  ): Promise<RiddleChapter[]> {
    return this.riddleMcqService.findChaptersBySubject(subjectId, hasContent === 'true');
  }

  @Post('chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle chapter (Admin only)' })
  async createChapter(@Body() dto: CreateRiddleMcqChapterDto): Promise<RiddleChapter> {
    return this.riddleMcqService.createChapter(dto);
  }

  @Patch('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle chapter (Admin only)' })
  async updateChapter(
    @Param('id') id: string,
    @Body() dto: UpdateRiddleMcqChapterDto,
  ): Promise<RiddleChapter> {
    return this.riddleMcqService.updateChapter(id, dto);
  }

  @Delete('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete riddle chapter (Admin only)' })
  async deleteChapter(@Param('id') id: string): Promise<{ message: string }> {
    await this.riddleMcqService.deleteChapter(id);
    return { message: 'Chapter deleted successfully' };
  }

  // ==================== MCQs ====================

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all riddle MCQs (Admin only)' })
  async getAllRiddleMcqsAdmin(): Promise<RiddleMcq[]> {
    return this.riddleMcqService.findAllRiddleMcqsAdmin();
  }

  @Get('subjects/:subjectId/mcqs')
  @ApiOperation({ summary: 'Get riddle MCQs by subject ID' })
  async getRiddleMcqsBySubject(
    @Param('subjectId') subjectId: string,
    @Query() pagination: RiddleMcqPaginationDto,
    @Query('level') level?: string,
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    return this.riddleMcqService.findRiddleMcqsBySubject(subjectId, pagination, level);
  }

  @Get('mcqs/:chapterId')
  @ApiOperation({ summary: 'Get riddle MCQs by chapter ID' })
  async getRiddleMcqsByChapter(
    @Param('chapterId') chapterId: string,
    @Query() pagination: RiddleMcqPaginationDto,
    @Query('level') level?: string,
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    return this.riddleMcqService.findRiddleMcqsByChapter(chapterId, pagination, level);
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed riddle MCQs from all chapters' })
  async getMixedRiddleMcqs(@Query('count') count?: string): Promise<RiddleMcq[]> {
    const parsedCount = this.validateCount(count, DEFAULT_PAGE_SIZE, 1, 100);
    return this.riddleMcqService.findMixedRiddleMcqs(parsedCount);
  }

  @Get('random/:level')
  @ApiOperation({ summary: 'Get random riddle MCQs by difficulty level' })
  @ApiParam({ name: 'level', enum: ['easy', 'medium', 'hard', 'expert'] })
  async getRandomRiddleMcqs(
    @Param('level') level: string,
    @Query('count') count?: string,
  ): Promise<RiddleMcq[]> {
    const parsedCount = this.validateCount(count, 10, 1, 50);
    this.validateDifficulty(level);
    return this.riddleMcqService.findRandomRiddleMcqs(level, parsedCount);
  }

  @Post('mcqs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle MCQ (Admin only)' })
  async createRiddleMcq(@Body() dto: CreateRiddleMcqDto): Promise<RiddleMcq> {
    return this.riddleMcqService.createRiddleMcq(dto);
  }

  @Post('mcqs/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create riddle MCQs (Admin only)' })
  async createRiddleMcqsBulk(
    @Body() dtos: CreateRiddleMcqDto[],
  ): Promise<{ count: number; errors: string[] }> {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('No riddles provided for bulk creation');
    }
    return this.riddleMcqService.createRiddleMcqsBulk(dtos);
  }

  @Patch('mcqs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle MCQ (Admin only)' })
  async updateRiddleMcq(
    @Param('id') id: string,
    @Body() dto: UpdateRiddleMcqDto,
  ): Promise<RiddleMcq> {
    return this.riddleMcqService.updateRiddleMcq(id, dto);
  }

  @Delete('mcqs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete riddle MCQ (Admin only)' })
  async deleteRiddleMcq(@Param('id') id: string): Promise<{ message: string }> {
    await this.riddleMcqService.deleteRiddleMcq(id);
    return { message: 'Riddle MCQ deleted successfully' };
  }

  // ==================== BULK ACTIONS ====================

  @Post('mcqs/bulk-action')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute bulk action on riddle MCQs (Admin only)' })
  async executeBulkAction(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.riddleMcqService.bulkActionRiddleMcqs(dto.ids, dto.action);
  }

  // ==================== STATS ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get riddle MCQ statistics' })
  async getStats(): Promise<{
    totalRiddleMcqs: number;
    totalSubjects: number;
    totalChapters: number;
    mcqsByLevel: Record<string, number>;
  }> {
    return this.riddleMcqService.getStats();
  }

  @Get('filter-counts')
  @ApiOperation({ summary: 'Get unified filter counts' })
  async getFilterCounts(): Promise<{
    subjectCounts: { id: string; name: string; count: number }[];
    chapterCounts: { id: string; name: string; count: number; subjectId: string }[];
    levelCounts: { level: string; count: number }[];
    total: number;
  }> {
    return this.riddleMcqService.getFilterCounts();
  }

  // ==================== VALIDATION HELPERS ====================

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

  private validateDifficulty(level: string): void {
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
    if (!validDifficulties.includes(level)) {
      throw new BadRequestException(
        `Invalid difficulty level: "${level}". Valid values: ${validDifficulties.join(', ')}`,
      );
    }
  }
}