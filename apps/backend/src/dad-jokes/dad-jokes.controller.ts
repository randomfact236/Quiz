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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DadJokesService } from './dad-jokes.service';
import {
  CreateDadJokeDto,
  CreateJokeCategoryDto,
  UpdateJokeCategoryDto,
  PaginationDto,
  SearchJokesDto,
  BulkImportResultDto,
} from '../common/dto/base.dto';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BulkActionDto, BulkActionResponseDto, StatusCountResponseDto, StatusFilterDto } from '../common/dto/bulk-action.dto';

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

  @Get('classic')
  @ApiOperation({ summary: 'Get all classic dad jokes with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated dad jokes' })
  findAllClassic(
    @Query() pagination: PaginationDto,
    @Query() filter: StatusFilterDto,
  ): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findAllJokes(pagination, filter.status);
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
  updateClassic(@Param('id') id: string, @Body() dto: UpdateJokeCategoryDto): Promise<DadJoke> {
    // Using UpdateJokeCategoryDto as a safe update DTO (only allows specific fields)
    // The service method handles field mapping
    return this.jokesService.updateJoke(id, dto as Partial<CreateDadJokeDto>);
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
}
