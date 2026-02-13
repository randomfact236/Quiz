import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { Question } from './entities/question.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateQuestionDto,
  CreateSubjectDto,
  PaginationDto,
} from '../common/dto/base.dto';

@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ==================== SUBJECTS ====================

  @Get('subjects')
  @ApiOperation({ summary: 'Get all subjects' })
  async getAllSubjects(): Promise<Subject[]> {
    return this.quizService.findAllSubjects();
  }

  @Get('subjects/:slug')
  @ApiOperation({ summary: 'Get subject by slug with chapters' })
  @ApiParam({ name: 'slug', example: 'science' })
  async getSubjectBySlug(@Param('slug') slug: string): Promise<Subject> {
    return this.quizService.findSubjectBySlug(slug);
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
    @Body() dto: Partial<CreateSubjectDto>,
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

  @Get('chapters/:subjectId')
  @ApiOperation({ summary: 'Get chapters by subject ID' })
  async getChaptersBySubject(
    @Param('subjectId') subjectId: string,
  ): Promise<Chapter[]> {
    return this.quizService.findChaptersBySubject(subjectId);
  }

  @Post('chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new chapter (Admin only)' })
  async createChapter(
    @Body() dto: { name: string; subjectId: string },
  ): Promise<Chapter> {
    return this.quizService.createChapter(dto.name, dto.subjectId);
  }

  @Put('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update chapter (Admin only)' })
  async updateChapter(
    @Param('id') id: string,
    @Body() dto: { name: string },
  ): Promise<Chapter> {
    return this.quizService.updateChapter(id, dto.name);
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

  @Get('questions/:chapterId')
  @ApiOperation({ summary: 'Get questions by chapter ID' })
  async getQuestionsByChapter(
    @Param('chapterId') chapterId: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: Question[]; total: number }> {
    return this.quizService.findQuestionsByChapter(chapterId, pagination);
  }

  @Get('random/:level')
  @ApiOperation({ summary: 'Get random questions by difficulty level' })
  async getRandomQuestions(
    @Param('level') level: string,
    @Query('count') count?: string,
  ): Promise<Question[]> {
    return this.quizService.findRandomQuestions(level, count ? parseInt(count) : 10);
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed questions from all subjects' })
  async getMixedQuestions(@Query('count') count?: string): Promise<Question[]> {
    return this.quizService.findMixedQuestions(count ? parseInt(count) : 20);
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
  @ApiOperation({ summary: 'Bulk create questions (Admin only)' })
  async createQuestionsBulk(@Body() dto: CreateQuestionDto[]): Promise<{ count: number }> {
    const count = await this.quizService.createQuestionsBulk(dto);
    return { count };
  }

  @Put('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update question (Admin only)' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() dto: Partial<CreateQuestionDto>,
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
}