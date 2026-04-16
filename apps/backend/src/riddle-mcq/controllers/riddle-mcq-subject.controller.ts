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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

import { RiddleMcqSubject } from '../entities/riddle-subject.entity';
import { RiddleMcqSubjectService } from '../services/riddle-mcq-subject.service';
import { CreateRiddleSubjectDto, UpdateRiddleSubjectDto } from '../dto/riddle-mcq.dto';

@ApiTags('Riddle MCQ - Subjects')
@Controller('riddle-mcq/subjects')
export class RiddleMcqSubjectController {
  constructor(private readonly subjectService: RiddleMcqSubjectService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active subjects (Public)' })
  async getAllSubjects(@Query('hasContent') hasContent?: string): Promise<RiddleMcqSubject[]> {
    return this.subjectService.findAllSubjects(false, hasContent === 'true');
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subjects including inactive (Admin only)' })
  async getAllSubjectsAdmin(): Promise<RiddleMcqSubject[]> {
    return this.subjectService.findAllSubjects(true);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get subject by slug (Public)' })
  async getSubjectBySlug(@Param('slug') slug: string): Promise<RiddleMcqSubject> {
    return this.subjectService.findSubjectBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new subject (Admin only)' })
  async createSubject(@Body() dto: CreateRiddleSubjectDto): Promise<RiddleMcqSubject> {
    return this.subjectService.createSubject(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subject (Admin only)' })
  async updateSubject(
    @Param('id') id: string,
    @Body() dto: UpdateRiddleSubjectDto
  ): Promise<RiddleMcqSubject> {
    return this.subjectService.updateSubject(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete subject (Admin only)' })
  async deleteSubject(@Param('id') id: string): Promise<{ message: string }> {
    await this.subjectService.deleteSubject(id);
    return { message: 'Subject deleted successfully' };
  }
}
