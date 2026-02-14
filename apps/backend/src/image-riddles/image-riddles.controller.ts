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
import { ImageRiddlesService } from './image-riddles.service';
import {
  CreateImageRiddleDto,
  UpdateImageRiddleDto,
  CreateImageRiddleCategoryDto,
  UpdateImageRiddleCategoryDto,
  PaginationDto,
  SearchImageRiddlesDto,
  BulkImportResultDto,
  BulkDeleteDto,
} from '../common/dto/base.dto';
import { ImageRiddle } from './entities/image-riddle.entity';
import { ImageRiddleCategory } from './entities/image-riddle-category.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Image Riddles')
@Controller('image-riddles')
export class ImageRiddlesController {
  constructor(private readonly imageRiddlesService: ImageRiddlesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all image riddles with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated image riddles' })
  findAll(@Query() pagination: PaginationDto): Promise<{ data: ImageRiddle[]; total: number }> {
    return this.imageRiddlesService.findAllRiddles(pagination);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get a random image riddle' })
  @ApiResponse({ status: 200, description: 'Returns a random image riddle' })
  @ApiResponse({ status: 404, description: 'No image riddles found' })
  findRandom(): Promise<ImageRiddle> {
    return this.imageRiddlesService.findRandomRiddle();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search image riddles' })
  @ApiResponse({ status: 200, description: 'Returns filtered image riddles' })
  search(@Query() searchDto: SearchImageRiddlesDto): Promise<{ data: ImageRiddle[]; total: number }> {
    return this.imageRiddlesService.searchRiddles(searchDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all image riddle categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  findCategories(): Promise<ImageRiddleCategory[]> {
    return this.imageRiddlesService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID with riddles' })
  @ApiResponse({ status: 200, description: 'Returns category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findCategoryById(@Param('id') id: string): Promise<ImageRiddleCategory> {
    return this.imageRiddlesService.findCategoryById(id);
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'Get image riddles by category' })
  @ApiResponse({ status: 200, description: 'Returns image riddles in category' })
  findByCategory(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    return this.imageRiddlesService.findRiddlesByCategory(id, pagination);
  }

  @Get('difficulty/:level')
  @ApiOperation({ summary: 'Get image riddles by difficulty level' })
  @ApiParam({ name: 'level', enum: ['easy', 'medium', 'hard', 'expert'] })
  @ApiResponse({ status: 200, description: 'Returns image riddles by difficulty' })
  findByDifficulty(
    @Param('level') level: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    return this.imageRiddlesService.findRiddlesByDifficulty(level, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get image riddle by ID' })
  @ApiResponse({ status: 200, description: 'Returns image riddle' })
  @ApiResponse({ status: 404, description: 'Image riddle not found' })
  findById(@Param('id') id: string): Promise<ImageRiddle> {
    return this.imageRiddlesService.findRiddleById(id);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new image riddle (Admin only)' })
  @ApiResponse({ status: 201, description: 'Image riddle created successfully' })
  create(@Body() dto: CreateImageRiddleDto): Promise<ImageRiddle> {
    return this.imageRiddlesService.createRiddle(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create image riddles (Admin only)' })
  @ApiResponse({ status: 201, description: 'Image riddles created successfully', type: BulkImportResultDto })
  async createBulk(@Body() dto: CreateImageRiddleDto[]): Promise<BulkImportResultDto> {
    const count = await this.imageRiddlesService.createRiddlesBulk(dto);
    return { success: count, failed: dto.length - count };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an image riddle (Admin only)' })
  @ApiResponse({ status: 200, description: 'Image riddle updated successfully' })
  @ApiResponse({ status: 404, description: 'Image riddle not found' })
  update(@Param('id') id: string, @Body() dto: UpdateImageRiddleDto): Promise<ImageRiddle> {
    return this.imageRiddlesService.updateRiddle(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an image riddle (Admin only)' })
  @ApiResponse({ status: 204, description: 'Image riddle deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.imageRiddlesService.deleteRiddle(id);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete image riddles (Admin only)' })
  async removeBulk(@Body() dto: BulkDeleteDto): Promise<void> {
    for (const id of dto.ids) {
      await this.imageRiddlesService.deleteRiddle(id);
    }
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new image riddle category (Admin only)' })
  createCategory(@Body() dto: CreateImageRiddleCategoryDto): Promise<ImageRiddleCategory> {
    return this.imageRiddlesService.createCategory(dto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an image riddle category (Admin only)' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateImageRiddleCategoryDto,
  ): Promise<ImageRiddleCategory> {
    return this.imageRiddlesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an image riddle category and all its riddles (Admin only)' })
  async removeCategory(@Param('id') id: string): Promise<void> {
    await this.imageRiddlesService.deleteCategory(id);
  }

  // ==================== STATS ====================

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
}
