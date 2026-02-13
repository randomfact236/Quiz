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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DadJokesService } from './dad-jokes.service';
import {
  CreateDadJokeDto,
  CreateJokeCategoryDto,
  UpdateJokeCategoryDto,
  CreateJokeSubjectDto,
  UpdateJokeSubjectDto,
  CreateJokeChapterDto,
  UpdateJokeChapterDto,
  CreateQuizJokeDto,
  UpdateQuizJokeDto,
  PaginationDto,
  SearchJokesDto,
  BulkImportResultDto,
  BulkDeleteDto,
} from '../common/dto/base.dto';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import { JokeSubject } from './entities/joke-subject.entity';
import { JokeChapter } from './entities/joke-chapter.entity';
import { QuizJoke } from './entities/quiz-joke.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Dad Jokes')
@Controller('jokes')
export class DadJokesController {
  constructor(private readonly jokesService: DadJokesService) {}

  // ==================== CLASSIC FORMAT - PUBLIC ====================

  @Get('classic')
  @ApiOperation({ summary: 'Get all classic dad jokes with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated dad jokes' })
  findAllClassic(@Query() pagination: PaginationDto): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findAllJokes(pagination);
  }

  @Get('classic/random')
  @ApiOperation({ summary: 'Get a random classic dad joke' })
  @ApiResponse({ status: 200, description: 'Returns a random joke' })
  @ApiResponse({ status: 404, description: 'No jokes found' })
  findRandomClassic(): Promise<DadJoke> {
    return this.jokesService.findRandomJoke();
  }

  @Get('classic/search')
  @ApiOperation({ summary: 'Search classic dad jokes' })
  @ApiResponse({ status: 200, description: 'Returns filtered jokes' })
  searchClassic(@Query() searchDto: SearchJokesDto): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.searchJokes(searchDto);
  }

  @Get('classic/categories')
  @ApiOperation({ summary: 'Get all classic joke categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  findCategories(): Promise<JokeCategory[]> {
    return this.jokesService.findAllCategories();
  }

  @Get('classic/categories/:id')
  @ApiOperation({ summary: 'Get category by ID with jokes' })
  @ApiResponse({ status: 200, description: 'Returns category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findCategoryById(@Param('id') id: string): Promise<JokeCategory> {
    return this.jokesService.findCategoryById(id);
  }

  @Get('classic/category/:id')
  @ApiOperation({ summary: 'Get jokes by category' })
  @ApiResponse({ status: 200, description: 'Returns jokes in category' })
  findByCategory(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findJokesByCategory(id, pagination);
  }

  // ==================== CLASSIC FORMAT - ADMIN ====================

  @Post('classic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new classic dad joke (Admin only)' })
  @ApiResponse({ status: 201, description: 'Joke created successfully' })
  createClassic(@Body() dto: CreateDadJokeDto): Promise<DadJoke> {
    return this.jokesService.createJoke(dto);
  }

  @Post('classic/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create classic dad jokes (Admin only)' })
  @ApiResponse({ status: 201, description: 'Jokes created successfully', type: BulkImportResultDto })
  async createClassicBulk(@Body() dto: CreateDadJokeDto[]): Promise<BulkImportResultDto> {
    const count = await this.jokesService.createJokesBulk(dto);
    return { success: count, failed: dto.length - count };
  }

  @Put('classic/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a classic dad joke (Admin only)' })
  @ApiResponse({ status: 200, description: 'Joke updated successfully' })
  @ApiResponse({ status: 404, description: 'Joke not found' })
  updateClassic(@Param('id') id: string, @Body() dto: Partial<CreateDadJokeDto>): Promise<DadJoke> {
    return this.jokesService.updateJoke(id, dto);
  }

  @Delete('classic/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a classic dad joke (Admin only)' })
  @ApiResponse({ status: 204, description: 'Joke deleted successfully' })
  async removeClassic(@Param('id') id: string): Promise<void> {
    await this.jokesService.deleteJoke(id);
  }

  @Post('classic/bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete classic dad jokes (Admin only)' })
  async removeClassicBulk(@Body() dto: BulkDeleteDto): Promise<void> {
    for (const id of dto.ids) {
      await this.jokesService.deleteJoke(id);
    }
  }

  @Post('classic/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new joke category (Admin only)' })
  createCategory(@Body() dto: CreateJokeCategoryDto): Promise<JokeCategory> {
    return this.jokesService.createCategory(dto);
  }

  @Put('classic/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a joke category (Admin only)' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateJokeCategoryDto): Promise<JokeCategory> {
    return this.jokesService.updateCategory(id, dto);
  }

  @Delete('classic/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a joke category and all its jokes (Admin only)' })
  async removeCategory(@Param('id') id: string): Promise<void> {
    await this.jokesService.deleteCategory(id);
  }

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
  @ApiParam({ name: 'level', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  @ApiResponse({ status: 200, description: 'Returns random jokes' })
  getRandomQuizJokes(
    @Param('level') level: string,
    @Query('count') count?: string,
  ): Promise<QuizJoke[]> {
    return this.jokesService.findRandomQuizJokes(level, count ? parseInt(count) : 10);
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed quiz jokes from all chapters' })
  @ApiResponse({ status: 200, description: 'Returns mixed jokes' })
  getMixedQuizJokes(@Query('count') count?: string): Promise<QuizJoke[]> {
    return this.jokesService.findMixedQuizJokes(count ? parseInt(count) : 20);
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
  async createQuizJokesBulk(@Body() dto: CreateQuizJokeDto[]): Promise<{ count: number }> {
    const count = await this.jokesService.createQuizJokesBulk(dto);
    return { count };
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

  // ==================== STATS ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get dad jokes statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  getStats(): Promise<{
    totalClassicJokes: number;
    totalCategories: number;
    totalQuizJokes: number;
    totalSubjects: number;
    totalChapters: number;
  }> {
    return this.jokesService.getStats();
  }
}
