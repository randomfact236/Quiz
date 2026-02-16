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
import { DadJokesService } from './dad-jokes.service';
import {
  DEFAULT_RANDOM_JOKES_COUNT,
  DEFAULT_MIXED_JOKES_COUNT,
} from '../common/constants/app.constants';
import {
  CreateJokeSubjectDto,
  UpdateJokeSubjectDto,
  CreateJokeChapterDto,
  UpdateJokeChapterDto,
  CreateQuizJokeDto,
  UpdateQuizJokeDto,
  PaginationDto,
} from '../common/dto/base.dto';
import { JokeSubject } from './entities/joke-subject.entity';
import { JokeChapter } from './entities/joke-chapter.entity';
import { QuizJoke } from './entities/quiz-joke.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Controller for managing quiz format dad jokes
 * 
 * @description Provides REST API endpoints for quiz format joke operations
 */
@ApiTags('Dad Jokes - Quiz Format')
@Controller('jokes')
export class DadJokesQuizController {
  constructor(private readonly jokesService: DadJokesService) {}

  // ==================== QUIZ FORMAT - PUBLIC ====================

  @Get('subjects')
  @ApiOperation({ summary: 'Get all joke subjects (Quiz format)' })
  @ApiResponse({ status: 200, description: 'Returns all subjects' })
  findAllSubjects(): Promise<JokeSubject[]> {
    return this.jokesService.findAllSubjects();
  }

  @Get('subjects/:slug')
  @ApiOperation({ summary: 'Get subject by slug with chapters (Quiz format)' })
  @ApiParam({ name: 'slug', example: 'dad-jokes' })
  @ApiResponse({ status: 200, description: 'Returns subject' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  findSubjectBySlug(@Param('slug') slug: string): Promise<JokeSubject> {
    return this.jokesService.findSubjectBySlug(slug);
  }

  @Get('chapters/:subjectId')
  @ApiOperation({ summary: 'Get chapters by subject ID (Quiz format)' })
  @ApiResponse({ status: 200, description: 'Returns chapters' })
  findChaptersBySubject(@Param('subjectId') subjectId: string): Promise<JokeChapter[]> {
    return this.jokesService.findChaptersBySubject(subjectId);
  }

  @Get('quiz/:chapterId')
  @ApiOperation({ summary: 'Get quiz jokes by chapter ID' })
  @ApiResponse({ status: 200, description: 'Returns quiz jokes' })
  findQuizJokesByChapter(
    @Param('chapterId') chapterId: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: QuizJoke[]; total: number }> {
    return this.jokesService.findQuizJokesByChapter(chapterId, pagination);
  }

  @Get('random/:level')
  @ApiOperation({ summary: 'Get random quiz jokes by difficulty level' })
  @ApiResponse({ status: 200, description: 'Returns random jokes' })
  getRandomQuizJokes(
    @Param('level') level: string,
    @Query('count') count?: string,
  ): Promise<QuizJoke[]> {
    const parsedCount = this.validateCount(count, DEFAULT_RANDOM_JOKES_COUNT, 1, 50);
    return this.jokesService.findRandomQuizJokes(level, parsedCount);
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed quiz jokes from all chapters' })
  @ApiResponse({ status: 200, description: 'Returns mixed jokes' })
  getMixedQuizJokes(@Query('count') count?: string): Promise<QuizJoke[]> {
    const parsedCount = this.validateCount(count, DEFAULT_MIXED_JOKES_COUNT, 1, 100);
    return this.jokesService.findMixedQuizJokes(parsedCount);
  }

  // ==================== QUIZ FORMAT - ADMIN ====================

  @Post('subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new joke subject (Quiz format, Admin only)' })
  createSubject(@Body() dto: CreateJokeSubjectDto): Promise<JokeSubject> {
    return this.jokesService.createSubject(dto);
  }

  @Put('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update joke subject (Quiz format, Admin only)' })
  updateSubject(
    @Param('id') id: string,
    @Body() dto: UpdateJokeSubjectDto,
  ): Promise<JokeSubject> {
    return this.jokesService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete joke subject (Quiz format, Admin only)' })
  async deleteSubject(@Param('id') id: string): Promise<void> {
    await this.jokesService.deleteSubject(id);
  }

  @Post('chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new joke chapter (Quiz format, Admin only)' })
  createChapter(@Body() dto: CreateJokeChapterDto): Promise<JokeChapter> {
    return this.jokesService.createChapter(dto);
  }

  @Put('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update joke chapter (Quiz format, Admin only)' })
  updateChapter(
    @Param('id') id: string,
    @Body() dto: UpdateJokeChapterDto,
  ): Promise<JokeChapter> {
    return this.jokesService.updateChapter(id, dto);
  }

  @Delete('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete joke chapter (Quiz format, Admin only)' })
  async deleteChapter(@Param('id') id: string): Promise<void> {
    await this.jokesService.deleteChapter(id);
  }

  @Post('quiz')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new quiz joke (Admin only)' })
  createQuizJoke(@Body() dto: CreateQuizJokeDto): Promise<QuizJoke> {
    return this.jokesService.createQuizJoke(dto);
  }

  @Post('quiz/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create quiz jokes (Admin only)' })
  async createQuizJokesBulk(@Body() dto: CreateQuizJokeDto[]): Promise<{ count: number; errors: string[] }> {
    const result = await this.jokesService.createQuizJokesBulk(dto);
    return { count: result.count, errors: result.errors };
  }

  @Put('quiz/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quiz joke (Admin only)' })
  updateQuizJoke(
    @Param('id') id: string,
    @Body() dto: UpdateQuizJokeDto,
  ): Promise<QuizJoke> {
    return this.jokesService.updateQuizJoke(id, dto);
  }

  @Delete('quiz/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete quiz joke (Admin only)' })
  async deleteQuizJoke(@Param('id') id: string): Promise<void> {
    await this.jokesService.deleteQuizJoke(id);
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
}
