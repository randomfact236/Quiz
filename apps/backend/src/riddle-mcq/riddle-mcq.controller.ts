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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DEFAULT_PAGE_SIZE } from '../common/constants/app.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { BulkActionDto, BulkActionResponseDto } from '../common/dto/bulk-action.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleMcq, RiddleStatus } from './entities/riddle-mcq.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { RiddleMcqService } from './riddle-mcq.service';

@ApiTags('Riddle MCQ')
@Controller('riddle-mcq')
export class RiddleMcqController {
  constructor(private readonly riddleMcqService: RiddleMcqService) {}

  // ==================== CATEGORIES ====================

  @Get('categories')
  @ApiOperation({ summary: 'Get all active categories (Public)' })
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
  @ApiOperation({ summary: 'Get category by ID (Public)' })
  async getCategoryById(@Param('id') id: string): Promise<RiddleCategory> {
    return this.riddleMcqService.findCategoryById(id);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new category (Admin only)' })
  async createCategory(
    @Body() dto: { name: string; slug?: string; emoji?: string; order?: number; isActive?: boolean }
  ): Promise<RiddleCategory> {
    return this.riddleMcqService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  async updateCategory(
    @Param('id') id: string,
    @Body()
    dto: { name?: string; slug?: string; emoji?: string; order?: number; isActive?: boolean }
  ): Promise<RiddleCategory> {
    return this.riddleMcqService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  async deleteCategory(@Param('id') id: string): Promise<{ message: string }> {
    await this.riddleMcqService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }

  // ==================== SUBJECTS ====================

  @Get('subjects')
  @ApiOperation({ summary: 'Get all active subjects (Public)' })
  async getAllSubjects(@Query('hasContent') hasContent?: string): Promise<RiddleSubject[]> {
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
  @ApiOperation({ summary: 'Get subject by slug (Public)' })
  async getSubjectBySlug(@Param('slug') slug: string): Promise<RiddleSubject> {
    return this.riddleMcqService.findSubjectBySlug(slug);
  }

  @Post('subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new subject (Admin only)' })
  async createSubject(
    @Body()
    dto: {
      name: string;
      slug?: string;
      emoji?: string;
      categoryId?: string | null;
      order?: number;
      isActive?: boolean;
    }
  ): Promise<RiddleSubject> {
    return this.riddleMcqService.createSubject(dto);
  }

  @Patch('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subject (Admin only)' })
  async updateSubject(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      slug?: string;
      emoji?: string;
      categoryId?: string | null;
      order?: number;
      isActive?: boolean;
    }
  ): Promise<RiddleSubject> {
    return this.riddleMcqService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete subject (Admin only)' })
  async deleteSubject(@Param('id') id: string): Promise<{ message: string }> {
    await this.riddleMcqService.deleteSubject(id);
    return { message: 'Subject deleted successfully' };
  }

  // ==================== RIDDLES ====================

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all riddles with filters (Admin only)' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject slug' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by level' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in question text' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getAllRiddles(
    @Query('subject') subject?: string,
    @Query('level') level?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : DEFAULT_PAGE_SIZE,
    };
    return this.riddleMcqService.findAllRiddles({ subject, level, status, search }, pagination);
  }

  @Get('subjects/:subjectId/riddles')
  @ApiOperation({ summary: 'Get riddles by subject ID (Public)' })
  async getRiddlesBySubject(
    @Param('subjectId') subjectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('level') level?: string
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : DEFAULT_PAGE_SIZE,
    };
    return this.riddleMcqService.findRiddlesBySubject(subjectId, pagination, level);
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed riddles from all subjects (Public)' })
  async getMixedRiddles(@Query('count') count?: string): Promise<RiddleMcq[]> {
    const parsedCount = this.validateCount(count, DEFAULT_PAGE_SIZE, 1, 100);
    return this.riddleMcqService.findMixedRiddles(parsedCount);
  }

  @Get('random/:level')
  @ApiOperation({ summary: 'Get random riddles by difficulty level (Public)' })
  @ApiParam({ name: 'level', enum: ['easy', 'medium', 'hard', 'expert'] })
  async getRandomRiddles(
    @Param('level') level: string,
    @Query('count') count?: string
  ): Promise<RiddleMcq[]> {
    const parsedCount = this.validateCount(count, 10, 1, 50);
    this.validateDifficulty(level);
    return this.riddleMcqService.findRandomRiddles(level, parsedCount);
  }

  @Post('riddles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle (Admin only)' })
  async createRiddle(
    @Body()
    dto: {
      question: string;
      options?: string[];
      correctLetter?: string;
      level: string;
      subjectId: string;
      hint?: string;
      explanation?: string;
      answer?: string;
      status?: RiddleStatus;
    }
  ): Promise<RiddleMcq> {
    return this.riddleMcqService.createRiddle(dto);
  }

  @Post('riddles/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create riddles (Admin only)' })
  async createRiddlesBulk(
    @Body()
    dtos: Array<{
      question: string;
      options?: string[];
      correctLetter?: string;
      level: string;
      subjectId: string;
      hint?: string;
      explanation?: string;
      answer?: string;
      status?: RiddleStatus;
    }>
  ): Promise<{ count: number; errors: string[] }> {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('No riddles provided for bulk creation');
    }
    return this.riddleMcqService.createRiddlesBulk(dtos);
  }

  @Patch('riddles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle (Admin only)' })
  async updateRiddle(
    @Param('id') id: string,
    @Body()
    dto: {
      question?: string;
      options?: string[];
      correctLetter?: string;
      level?: string;
      subjectId?: string;
      hint?: string;
      explanation?: string;
      answer?: string;
      status?: RiddleStatus;
    }
  ): Promise<RiddleMcq> {
    return this.riddleMcqService.updateRiddle(id, dto);
  }

  @Delete('riddles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete riddle (Admin only)' })
  async deleteRiddle(@Param('id') id: string): Promise<{ message: string }> {
    await this.riddleMcqService.deleteRiddle(id);
    return { message: 'Riddle deleted successfully' };
  }

  // ==================== BULK ACTIONS ====================

  @Post('riddles/bulk-action')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute bulk action on riddles (Admin only)' })
  async executeBulkAction(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.riddleMcqService.bulkActionRiddles(dto.ids, dto.action);
  }

  // ==================== STATS ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get riddle MCQ statistics (Public)' })
  async getStats(): Promise<{
    totalRiddles: number;
    totalSubjects: number;
    totalCategories: number;
    riddlesByLevel: Record<string, number>;
  }> {
    return this.riddleMcqService.getStats();
  }

  @Get('filter-counts')
  @ApiOperation({ summary: 'Get unified filter counts (Public)' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject slug' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by level' })
  async getFilterCounts(
    @Query('subject') subject?: string,
    @Query('level') level?: string
  ): Promise<{
    categoryCounts: { id: string; name: string; emoji: string; count: number }[];
    subjectCounts: {
      id: string;
      name: string;
      emoji: string;
      categoryId: string | null;
      count: number;
    }[];
    levelCounts: { level: string; count: number }[];
    total: number;
  }> {
    return this.riddleMcqService.getFilterCounts({ subject, level });
  }

  // ==================== VALIDATION HELPERS ====================

  private validateCount(
    count: string | undefined,
    defaultValue: number,
    min: number,
    max: number
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
        `Invalid difficulty level: "${level}". Valid values: ${validDifficulties.join(', ')}`
      );
    }
  }
}
