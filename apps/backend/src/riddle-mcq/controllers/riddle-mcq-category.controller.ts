import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

import { RiddleCategory } from '../entities/riddle-category.entity';
import { RiddleMcqCategoryService } from '../services/riddle-mcq-category.service';

@ApiTags('Riddle MCQ - Categories')
@Controller('riddle-mcq/categories')
export class RiddleMcqCategoryController {
  constructor(private readonly categoryService: RiddleMcqCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active categories (Public)' })
  async getAllCategories(): Promise<RiddleCategory[]> {
    return this.categoryService.findAllCategories(false);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories including inactive (Admin only)' })
  async getAllCategoriesAdmin(): Promise<RiddleCategory[]> {
    return this.categoryService.findAllCategories(true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID (Public)' })
  async getCategoryById(@Param('id') id: string): Promise<RiddleCategory> {
    return this.categoryService.findCategoryById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new category (Admin only)' })
  async createCategory(
    @Body() dto: { name: string; slug?: string; emoji?: string; isActive?: boolean }
  ): Promise<RiddleCategory> {
    return this.categoryService.createCategory(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  async updateCategory(
    @Param('id') id: string,
    @Body()
    dto: { name?: string; slug?: string; emoji?: string; isActive?: boolean }
  ): Promise<RiddleCategory> {
    return this.categoryService.updateCategory(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  async deleteCategory(@Param('id') id: string): Promise<{ message: string }> {
    await this.categoryService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }
}
