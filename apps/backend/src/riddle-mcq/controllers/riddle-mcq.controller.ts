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

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DEFAULT_PAGE_SIZE } from '../../common/constants/app.constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { BulkActionDto, BulkActionResponseDto } from '../../common/dto/bulk-action.dto';
import { RolesGuard } from '../../common/guards/roles.guard';

import { RiddleMcq, RiddleStatus } from '../entities/riddle-mcq.entity';
import { RiddleMcqQuestionService } from '../services/riddle-mcq-question.service';
import { RiddleMcqBulkService } from '../services/riddle-mcq-bulk.service';
import { RiddleMcqStatsService } from '../services/riddle-mcq-stats.service';

@ApiTags('Riddle MCQ')
@Controller('riddle-mcq')
export class RiddleMcqController {
  constructor(
    private readonly questionService: RiddleMcqQuestionService,
    private readonly bulkService: RiddleMcqBulkService,
    private readonly statsService: RiddleMcqStatsService
  ) {}

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
    return this.questionService.findAllRiddles({ subject, level, status, search }, pagination);
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
    return this.questionService.findRiddlesBySubject(subjectId, pagination, level);
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed riddles from all subjects (Public)' })
  async getMixedRiddles(@Query('count') count?: string): Promise<RiddleMcq[]> {
    const parsedCount = this.validateCount(count, DEFAULT_PAGE_SIZE, 1, 100);
    return this.questionService.findMixedRiddles(parsedCount);
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
    return this.questionService.findRandomRiddles(level, parsedCount);
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
    return this.questionService.createRiddle(dto);
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
    return this.bulkService.createRiddlesBulk(dtos);
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
    return this.bulkService.bulkActionRiddles(dto.ids, dto.action);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get riddle MCQ statistics (Public)' })
  async getStats(): Promise<{
    totalRiddles: number;
    totalSubjects: number;
    totalCategories: number;
    riddlesByLevel: Record<string, number>;
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
