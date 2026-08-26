/**
 * ============================================================================
 * Image Riddles Controller
 * ============================================================================
 * Public read endpoints plus the shared admin surfaces for status/bulk
 * operations (bulk-action, status-counts). Canonical CRUD lives in
 * AdminImageRiddlesController (/admin/image-riddles/*) — see docs/features/
 * image-riddles.md "De-duplicate admin CRUD".
 * ============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto, SearchImageRiddlesDto } from '../common/dto/base.dto';
import {
  BulkActionDto,
  BulkActionResponseDto,
  StatusCountResponseDto,
} from '../common/dto/bulk-action.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import { ImageRiddleCategory } from './entities/image-riddle-category.entity';
import { ImageRiddle } from './entities/image-riddle.entity';
import { ImageRiddlesService } from './image-riddles.service';
import { _Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Image Riddles')
@Controller('image-riddles')
export class ImageRiddlesController {
  constructor(private readonly imageRiddlesService: ImageRiddlesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get()
  @ApiOperation({ summary: 'Get all published image riddles with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated image riddles' })
  findAll(@Query() pagination: PaginationDto): Promise<{ data: ImageRiddle[]; total: number }> {
    return this.imageRiddlesService.findAllRiddles(pagination);
  }

  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('random')
  @ApiOperation({ summary: 'Get a random image riddle' })
  @ApiResponse({ status: 200, description: 'Returns a random image riddle' })
  @ApiResponse({ status: 404, description: 'No image riddles found' })
  findRandom(): Promise<ImageRiddle> {
    return this.imageRiddlesService.findRandomRiddle();
  }

  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('search')
  @ApiOperation({ summary: 'Search image riddles' })
  @ApiResponse({ status: 200, description: 'Returns filtered image riddles' })
  search(
    @Query() searchDto: SearchImageRiddlesDto
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    return this.imageRiddlesService.searchRiddles(searchDto);
  }

  @_Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all image riddle categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  findCategories(): Promise<ImageRiddleCategory[]> {
    return this.imageRiddlesService.findAllCategories();
  }

  @_Public()
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID with riddles' })
  @ApiResponse({ status: 200, description: 'Returns category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findCategoryById(@Param('id') id: string): Promise<ImageRiddleCategory> {
    return this.imageRiddlesService.findCategoryById(id);
  }

  @_Public()
  @Get('category/:id')
  @ApiOperation({ summary: 'Get image riddles by category' })
  @ApiResponse({ status: 200, description: 'Returns image riddles in category' })
  findByCategory(
    @Param('id') id: string,
    @Query() pagination: PaginationDto
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    return this.imageRiddlesService.findRiddlesByCategory(id, pagination);
  }

  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('difficulty/:level')
  @ApiOperation({ summary: 'Get image riddles by difficulty level' })
  @ApiResponse({ status: 200, description: 'Returns image riddles by difficulty' })
  findByDifficulty(
    @Param('level') level: string,
    @Query() pagination: PaginationDto
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    // Validate difficulty level
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
    if (!validDifficulties.includes(level)) {
      throw new BadRequestException(
        `Invalid difficulty level: ${level}. Valid values are: ${validDifficulties.join(', ')}`
      );
    }
    return this.imageRiddlesService.findRiddlesByDifficulty(level, pagination);
  }

  // ==================== ADMIN: BULK STATUS OPERATIONS ====================
  // Canonical CRUD (create/update/delete/categories) lives under
  // /admin/image-riddles/*; these two remain here because they are the single
  // status-change surface consumed by the admin panel.

  @Post('bulk-action')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute bulk action on image riddles (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk action executed', type: BulkActionResponseDto })
  async executeBulkAction(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.imageRiddlesService.bulkAction(dto.ids, dto.action);
  }

  @Get('status-counts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get image riddle counts by status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns status counts', type: StatusCountResponseDto })
  async getStatusCounts(): Promise<StatusCountResponseDto> {
    return this.imageRiddlesService.getStatusCounts();
  }

  // ==================== STATS ====================

  @_Public()
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get image riddles statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  getStats(): Promise<{
    totalRiddles: number;
    totalCategories: number;
    riddlesByDifficulty: Record<string, number>;
    averageTimer: number;
  }> {
    return this.imageRiddlesService.getStats();
  }

  // NOTE: ':id' route must stay AFTER all literal GET routes (status-counts,
  // stats/overview) or it shadows them (Express matches in registration order).
  @_Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get image riddle by ID' })
  @ApiResponse({ status: 200, description: 'Returns image riddle' })
  @ApiResponse({ status: 404, description: 'Image riddle not found' })
  findById(@Param('id') id: string): Promise<ImageRiddle> {
    return this.imageRiddlesService.findRiddleById(id);
  }
}
