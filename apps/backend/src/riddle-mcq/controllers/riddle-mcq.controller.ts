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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DEFAULT_PAGE_SIZE } from '../../common/constants/app.constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { BulkActionDto, BulkActionResponseDto } from '../../common/dto/bulk-action.dto';
import { RolesGuard } from '../../common/guards/roles.guard';

import { RiddleMcq, RiddleStatus } from '../entities/riddle-mcq.entity';
import { RiddleMcqQuestionService } from '../services/riddle-mcq-question.service';
import { _Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { RiddleMcqImportService } from '../services/riddle-mcq-import.service';
import { RiddleMcqBulkActionsService } from '../services/riddle-mcq-bulk-actions.service';
import { RiddleMcqStatsService } from '../services/riddle-mcq-stats.service';
import { PaginationValidator } from '../validators/pagination.validator';
import { DifficultyValidator } from '../validators/difficulty.validator';
import { CreateRiddleMcqDto, UpdateRiddleMcqDto, BulkCreateRiddleDto } from '../dto/riddle-mcq.dto';

@ApiTags('Riddle MCQ')
@Controller('riddle-mcq')
export class RiddleMcqController {
  private readonly paginationValidator = new PaginationValidator();
  private readonly difficultyValidator = new DifficultyValidator();

  constructor(
    private readonly questionService: RiddleMcqQuestionService,
    private readonly importService: RiddleMcqImportService,
    private readonly bulkActionsService: RiddleMcqBulkActionsService,
    private readonly statsService: RiddleMcqStatsService
  ) {}

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all riddles with filters (Admin only)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category slug' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject slug' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by level' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in question text' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getAllRiddles(
    @Query('category') category?: string,
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
    return this.questionService.findAllRiddles(
      { category, subject, level, status, search },
      pagination
    );
  }

  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
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
    return this.questionService.findRiddlesBySubject(subjectId, pagination, level);
  }

  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed riddles from all subjects (Public)' })
  async getMixedRiddles(@Query('count') count?: string): Promise<RiddleMcq[]> {
    const parsedCount = this.paginationValidator.validateCount(count, DEFAULT_PAGE_SIZE, 1, 100);
    return this.questionService.findMixedRiddles(parsedCount);
  }

  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('random/:level')
  @ApiOperation({ summary: 'Get random riddles by difficulty level (Public)' })
  @ApiParam({ name: 'level', enum: ['easy', 'medium', 'hard', 'expert'] })
  async getRandomRiddles(
    @Param('level') level: string,
    @Query('count') count?: string
  ): Promise<RiddleMcq[]> {
    const parsedCount = this.paginationValidator.validateCount(count, 10, 1, 50);
    this.difficultyValidator.validate(level);
    return this.questionService.findRandomRiddles(level, parsedCount);
  }

  @Post('riddles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle (Admin only)' })
  async createRiddle(@Body() dto: CreateRiddleMcqDto): Promise<RiddleMcq> {
    return this.questionService.createRiddle(dto);
  }

  @Post('riddles/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create riddles (Admin only)' })
  async createRiddlesBulk(
    @Body() dtos: BulkCreateRiddleDto[]
  ): Promise<{ count: number; errors: string[] }> {
    return this.importService.createRiddlesBulk(dtos);
  }

  @Patch('riddles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle (Admin only)' })
  async updateRiddle(@Param('id') id: string, @Body() dto: UpdateRiddleMcqDto): Promise<RiddleMcq> {
    return this.questionService.updateRiddle(id, dto);
  }

  @Delete('riddles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete riddle (Admin only)' })
  async deleteRiddle(@Param('id') id: string): Promise<{ message: string }> {
    await this.questionService.deleteRiddle(id);
    return { message: 'Riddle deleted successfully' };
  }

  @Post('riddles/bulk-action')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute bulk action on riddles (Admin only)' })
  async executeBulkAction(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.bulkActionsService.bulkAction(dto.ids, dto.action);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export riddles as CSV (Admin only)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category slug' })
  async exportRiddles(
    @Query('category') category?: string
  ): Promise<{ csv: string; filename: string }> {
    return this.importService.exportRiddlesToCSV({ category });
  }

  @_Public()
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get riddle MCQ statistics (Public)' })
  async getStats(): Promise<{
    totalRiddleMcqs: number;
    totalSubjects: number;
    totalCategories: number;
    mcqsByLevel: Record<string, number>;
  }> {
    return this.statsService.getStats();
  }

  @Get('filter-counts')
  @ApiOperation({ summary: 'Get unified filter counts (Public)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category slug' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject slug' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by level' })
  async getFilterCounts(
    @Query('category') category?: string,
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
    return this.statsService.getFilterCounts({ category, subject, level });
  }

  @Get('stats/status-counts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get riddle counts by status for a subject (Admin only)' })
  @ApiQuery({ name: 'subject', required: true, description: 'Subject slug or ID' })
  async getStatusCountsBySubject(
    @Query('subject') subject?: string
  ): Promise<{ total: number; published: number; draft: number; trash: number }> {
    if (!subject) {
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }
    return this.statsService.getStatusCountsBySubject(subject);
  }
}
