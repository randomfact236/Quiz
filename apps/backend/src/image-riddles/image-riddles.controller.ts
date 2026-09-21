/**
 * ============================================================================
 * Image Riddles Controller
 * ============================================================================
 * Public read endpoints plus the shared admin bulk-action surface (the single
 * status-change surface consumed by the admin panel). Canonical CRUD lives in
 * AdminImageRiddlesController (/admin/image-riddles/*) — see
 * plan/04-image-riddles.md "De-duplicate admin CRUD".
 * Catalog reads go through GET /search (category/difficulty/text filters with
 * pagination); the standalone by-category and by-difficulty lists were
 * superseded by it and removed.
 * ============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SearchImageRiddlesDto } from '../common/dto/base.dto';
import { BulkActionDto, BulkActionResponseDto } from '../common/dto/bulk-action.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import { ImageRiddleCategory } from './entities/image-riddle-category.entity';
import { ImageRiddle } from './entities/image-riddle.entity';
import { ImageRiddlesService } from './image-riddles.service';
import { _Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { EngagementDto } from './dto/engagement.dto';
import { GuessCheckDto } from './dto/guess-check.dto';

@ApiTags('Image Riddles')
@Controller('image-riddles')
export class ImageRiddlesController {
  constructor(private readonly imageRiddlesService: ImageRiddlesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

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
  findCategoryById(@Param('id', ParseUUIDPipe) id: string): Promise<ImageRiddleCategory> {
    return this.imageRiddlesService.findCategoryById(id);
  }

  @_Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post(':id/engage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record an engagement event (view / attempt / solve)' })
  @ApiResponse({ status: 200, description: 'Counter incremented (PUBLISHED riddles only)' })
  async recordEngagement(
    @Param('id') id: string,
    @Body() dto: EngagementDto
  ): Promise<{ recorded: boolean }> {
    await this.imageRiddlesService.recordEngagement(id, dto.type);
    return { recorded: true };
  }

  // ==================== ADMIN: BULK STATUS OPERATIONS ====================
  // Canonical CRUD (create/update/delete/categories) lives under
  // /admin/image-riddles/*; this remains here because it is the single
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

  // NOTE: ':id' route must stay AFTER all literal GET routes (stats/overview)
  // or it shadows them (Express matches in registration order). The UUID pipe
  // keeps removed-literal paths (e.g. /status-counts) as 400s, not DB 500s.
  @_Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get image riddle by ID' })
  @ApiResponse({ status: 200, description: 'Returns image riddle' })
  @ApiResponse({ status: 404, description: 'Image riddle not found' })
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<ImageRiddle> {
    return this.imageRiddlesService.findRiddleById(id);
  }
  /** H1: grade one image-riddle guess server-side. */
  @_Public()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Post('answers/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Grade one image-riddle guess server-side (H1)' })
  checkGuess(@Body() dto: GuessCheckDto) {
    return this.imageRiddlesService.checkGuess(dto.riddleId, dto.guess);
  }
}
