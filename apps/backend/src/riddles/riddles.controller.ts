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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RiddlesService } from './riddles.service';
import {
  CreateRiddleDto,
  CreateRiddleCategoryDto,
  UpdateRiddleCategoryDto,
  PaginationDto,
  SearchRiddlesDto,
  BulkImportResultDto,
  BulkDeleteDto,
} from '../common/dto/base.dto';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Riddles')
@Controller('riddles')
export class RiddlesController {
  constructor(private readonly riddlesService: RiddlesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all riddles with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated riddles' })
  findAll(@Query() pagination: PaginationDto): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.findAllRiddles(pagination);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get a random riddle' })
  @ApiResponse({ status: 200, description: 'Returns a random riddle' })
  @ApiResponse({ status: 404, description: 'No riddles found' })
  findRandom(): Promise<Riddle> {
    return this.riddlesService.findRandomRiddle();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search riddles' })
  @ApiResponse({ status: 200, description: 'Returns filtered riddles' })
  search(@Query() searchDto: SearchRiddlesDto): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.searchRiddles(searchDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all riddle categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  findCategories(): Promise<RiddleCategory[]> {
    return this.riddlesService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID with riddles' })
  @ApiResponse({ status: 200, description: 'Returns category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findCategoryById(@Param('id') id: string): Promise<RiddleCategory> {
    return this.riddlesService.findCategoryById(id);
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'Get riddles by category' })
  @ApiResponse({ status: 200, description: 'Returns riddles in category' })
  findByCategory(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.findRiddlesByCategory(id, pagination);
  }

  @Get('difficulty/:level')
  @ApiOperation({ summary: 'Get riddles by difficulty level' })
  @ApiResponse({ status: 200, description: 'Returns riddles by difficulty' })
  findByDifficulty(
    @Param('level') level: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.findRiddlesByDifficulty(level, pagination);
  }

  // ==================== ADMIN ENDPOINTS - RIDDLES ====================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new riddle (Admin only)' })
  @ApiResponse({ status: 201, description: 'Riddle created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateRiddleDto): Promise<Riddle> {
    return this.riddlesService.createRiddle(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create riddles (Admin only)' })
  @ApiResponse({ status: 201, description: 'Riddles created successfully', type: BulkImportResultDto })
  async createBulk(@Body() dto: CreateRiddleDto[]): Promise<BulkImportResultDto> {
    const count = await this.riddlesService.createRiddlesBulk(dto);
    return { success: count, failed: dto.length - count };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a riddle (Admin only)' })
  @ApiResponse({ status: 200, description: 'Riddle updated successfully' })
  @ApiResponse({ status: 404, description: 'Riddle not found' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateRiddleDto>): Promise<Riddle> {
    return this.riddlesService.updateRiddle(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a riddle (Admin only)' })
  @ApiResponse({ status: 204, description: 'Riddle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Riddle not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteRiddle(id);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete riddles (Admin only)' })
  @ApiResponse({ status: 204, description: 'Riddles deleted successfully' })
  async removeBulk(@Body() dto: BulkDeleteDto): Promise<void> {
    for (const id of dto.ids) {
      await this.riddlesService.deleteRiddle(id);
    }
  }

  // ==================== ADMIN ENDPOINTS - CATEGORIES ====================

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new riddle category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  createCategory(@Body() dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
    return this.riddlesService.createCategory(dto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a riddle category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateRiddleCategoryDto): Promise<RiddleCategory> {
    return this.riddlesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a riddle category and all its riddles (Admin only)' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async removeCategory(@Param('id') id: string): Promise<void> {
    await this.riddlesService.deleteCategory(id);
  }

  // ==================== STATS ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get riddles statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  getStats(): Promise<{ 
    totalRiddles: number; 
    totalCategories: number; 
    riddlesByCategory: Record<string, number>;
    riddlesByDifficulty: Record<string, number>;
  }> {
    return this.riddlesService.getStats();
  }
}
