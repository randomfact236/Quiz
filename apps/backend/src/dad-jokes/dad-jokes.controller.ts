// Watcher trigger
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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateDadJokeDto,
  CreateJokeCategoryDto,
  UpdateDadJokeDto,
  UpdateJokeCategoryDto,
  PaginationDto,
  SearchJokesDto,
  BulkImportResultDto,
} from '../common/dto/base.dto';
import {
  BulkActionDto,
  BulkActionResponseDto,
  StatusCountResponseDto,
} from '../common/dto/bulk-action.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import { DadJokesService } from './dad-jokes.service';
import { _Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';

/**
 * Controller for managing classic dad jokes
 *
 * @description Provides REST API endpoints for classic dad joke operations
 */
@ApiTags('Dad Jokes')
@Controller('jokes')
export class DadJokesController {
  constructor(private readonly jokesService: DadJokesService) {}

  // ==================== CLASSIC FORMAT - PUBLIC ====================

  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('classic')
  @ApiOperation({ summary: 'Get all published classic dad jokes with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated dad jokes' })
  findAllClassic(@Query() pagination: PaginationDto): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findAllJokes(pagination);
  }

  @Get('classic/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all classic dad jokes (all statuses, Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns paginated dad jokes (all statuses)' })
  findAllClassicAll(
    @Query() pagination: PaginationDto
  ): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findAllJokesAll(pagination);
  }

  @_Public()
  @Get('classic/random')
  @ApiOperation({ summary: 'Get a random classic dad joke' })
  @ApiResponse({ status: 200, description: 'Returns a random joke' })
  @ApiResponse({ status: 404, description: 'No jokes found' })
  findRandomClassic(): Promise<DadJoke> {
    return this.jokesService.findRandomJoke();
  }

  @_Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('classic/search')
  @ApiOperation({ summary: 'Search classic dad jokes' })
  @ApiResponse({ status: 200, description: 'Returns filtered jokes' })
  searchClassic(@Query() searchDto: SearchJokesDto): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.searchJokes(searchDto);
  }

  @_Public()
  @Get('classic/categories')
  @ApiOperation({ summary: 'Get all classic joke categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  findCategories(@Query('hasContent') hasContent?: string): Promise<JokeCategory[]> {
    return this.jokesService.findAllCategories(hasContent === 'true');
  }

  @_Public()
  @Get('classic/categories/:id')
  @ApiOperation({ summary: 'Get category by ID with jokes' })
  @ApiResponse({ status: 200, description: 'Returns category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findCategoryById(@Param('id') id: string): Promise<JokeCategory> {
    return this.jokesService.findCategoryById(id);
  }

  @_Public()
  @Get('classic/category/:id')
  @ApiOperation({ summary: 'Get jokes by category' })
  @ApiResponse({ status: 200, description: 'Returns jokes in category' })
  findByCategory(
    @Param('id') id: string,
    @Query() pagination: PaginationDto
  ): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findJokesByCategory(id, pagination);
  }

  @_Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('classic/:id/vote')
  @ApiOperation({ summary: 'Vote on a classic dad joke (one vote per user/guest)' })
  @ApiResponse({ status: 200, description: 'Vote recorded successfully' })
  @ApiResponse({ status: 404, description: 'Joke not found' })
  @ApiResponse({ status: 400, description: 'Invalid vote type' })
  voteClassic(
    @Param('id') id: string,
    @Body() body: { voteType: 'like' | 'dislike'; remove?: boolean; guestId?: string },
    @Req() req?: any
  ): Promise<DadJoke> {
    if (!body?.voteType) {
      throw new BadRequestException('voteType is required');
    }
    // Per-voter persistence (plan/05-dad-jokes.md P1 #1): logged-in users vote
    // under their userId, anonymous voters under the client-issued guestId.
    const voterKey = req?.user?.id
      ? (`user:${req.user.id}` as const)
      : body.guestId
        ? (`guest:${body.guestId}` as const)
        : undefined;
    return this.jokesService.voteForJoke(id, body.voteType, body.remove === true, voterKey);
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
  @ApiResponse({
    status: 201,
    description: 'Jokes created successfully',
    type: BulkImportResultDto,
  })
  async createClassicBulk(@Body() dto: CreateDadJokeDto[]): Promise<BulkImportResultDto> {
    const result = await this.jokesService.createJokesBulk(dto);
    return { success: result.count, failed: result.errors.length, errors: result.errors };
  }

  @Put('classic/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a classic dad joke (Admin only)' })
  @ApiResponse({ status: 200, description: 'Joke updated successfully' })
  @ApiResponse({ status: 404, description: 'Joke not found' })
  updateClassic(@Param('id') id: string, @Body() dto: UpdateDadJokeDto): Promise<DadJoke> {
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

  // ==================== BULK ACTIONS - CLASSIC JOKES ====================

  @Post('classic/bulk-action')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute bulk action on classic dad jokes (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk action executed', type: BulkActionResponseDto })
  async executeBulkActionClassic(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.jokesService.bulkActionClassic(dto.ids, dto.action);
  }

  @Get('classic/status-counts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get classic joke counts by status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns status counts', type: StatusCountResponseDto })
  async getStatusCounts(): Promise<StatusCountResponseDto> {
    return this.jokesService.getStatusCounts();
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
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateJokeCategoryDto
  ): Promise<JokeCategory> {
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
}
