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
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminImageRiddlesService } from './admin-image-riddles.service';
import {
  CreateImageRiddleDto,
  UpdateImageRiddleDto,
  CreateImageRiddleCategoryDto,
  UpdateImageRiddleCategoryDto,
} from '../../common/dto/base.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ImageRiddle } from '../../image-riddles/entities/image-riddle.entity';
import { ImageRiddleCategory } from '../../image-riddles/entities/image-riddle-category.entity';

/**
 * Admin Image Riddles Controller
 * Enterprise-grade admin panel API for managing image riddles
 */
@ApiTags('Admin - Image Riddles')
@Controller('admin/image-riddles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminImageRiddlesController {
  private readonly logger = new Logger(AdminImageRiddlesController.name);

  constructor(private readonly adminService: AdminImageRiddlesService) {}

  // ============================================================================
  // RIDDLE MANAGEMENT
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Get all image riddles with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard', 'expert'] })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in title' })
  @ApiResponse({ status: 200, description: 'Returns paginated riddles' })
  async findAllRiddles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('difficulty') difficulty?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{
    data: ImageRiddle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.debug(`Fetching riddles - page: ${page}, limit: ${limit}`);
    
    const filters = {
      difficulty,
      categoryId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    };

    return this.adminService.findAllRiddles(
      Number(page),
      Number(limit),
      filters,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single image riddle by ID' })
  @ApiResponse({ status: 200, description: 'Returns riddle' })
  @ApiResponse({ status: 404, description: 'Riddle not found' })
  async findRiddleById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ImageRiddle> {
    this.logger.debug(`Fetching riddle: ${id}`);
    return this.adminService.findRiddleById(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create new image riddle' })
  @ApiResponse({ status: 201, description: 'Riddle created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createRiddle(
    @Body() dto: CreateImageRiddleDto,
  ): Promise<ImageRiddle> {
    this.logger.log(`Creating new riddle: ${dto.title}`);
    return this.adminService.createRiddle(dto);
  }

  @Post('bulk')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Bulk create image riddles' })
  @ApiResponse({ status: 201, description: 'Riddles created successfully' })
  async createRiddlesBulk(
    @Body() dtos: CreateImageRiddleDto[],
  ): Promise<{ created: number; failed: number; errors: string[] }> {
    this.logger.log(`Bulk creating ${dtos.length} riddles`);
    return this.adminService.createRiddlesBulk(dtos);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update image riddle' })
  @ApiResponse({ status: 200, description: 'Riddle updated successfully' })
  @ApiResponse({ status: 404, description: 'Riddle not found' })
  async updateRiddle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateImageRiddleDto,
  ): Promise<ImageRiddle> {
    this.logger.log(`Updating riddle: ${id}`);
    return this.adminService.updateRiddle(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete image riddle (soft delete)' })
  @ApiResponse({ status: 204, description: 'Riddle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Riddle not found' })
  async deleteRiddle(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.log(`Deleting riddle: ${id}`);
    await this.adminService.deleteRiddle(id);
  }

  @Post(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle riddle active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  async toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ isActive: boolean }> {
    this.logger.log(`Toggling active status for riddle: ${id}`);
    return this.adminService.toggleActive(id);
  }

  // ============================================================================
  // CATEGORY MANAGEMENT
  // ============================================================================

  @Get('categories/all')
  @ApiOperation({ summary: 'Get all categories with riddle counts' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  async findAllCategories(): Promise<ImageRiddleCategory[]> {
    this.logger.debug('Fetching all categories');
    return this.adminService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Returns category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findCategoryById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ImageRiddleCategory> {
    this.logger.debug(`Fetching category: ${id}`);
    return this.adminService.findCategoryById(id);
  }

  @Post('categories')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(
    @Body() dto: CreateImageRiddleCategoryDto,
  ): Promise<ImageRiddleCategory> {
    this.logger.log(`Creating category: ${dto.name}`);
    return this.adminService.createCategory(dto);
  }

  @Put('categories/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateImageRiddleCategoryDto,
  ): Promise<ImageRiddleCategory> {
    this.logger.log(`Updating category: ${id}`);
    return this.adminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  async deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.log(`Deleting category: ${id}`);
    await this.adminService.deleteCategory(id);
  }

  // ============================================================================
  // DASHBOARD & ANALYTICS
  // ============================================================================

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard stats' })
  async getDashboardStats(): Promise<{
    totalRiddles: number;
    activeRiddles: number;
    totalCategories: number;
    riddlesByDifficulty: Record<string, number>;
    riddlesByCategory: Array<{ categoryId: string; categoryName: string; count: number }>;
    recentRiddles: ImageRiddle[];
    averageTimer: number;
  }> {
    this.logger.debug('Fetching dashboard stats');
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/recent')
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recent items' })
  @ApiOperation({ summary: 'Get recently created/updated riddles' })
  @ApiResponse({ status: 200, description: 'Returns recent riddles' })
  async getRecentRiddles(
    @Query('limit') limit: number = 10,
  ): Promise<ImageRiddle[]> {
    this.logger.debug(`Fetching ${limit} recent riddles`);
    return this.adminService.getRecentRiddles(Number(limit));
  }
}
