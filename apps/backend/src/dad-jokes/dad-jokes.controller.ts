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
import { DadJokesService } from './dad-jokes.service';
import {
  CreateDadJokeDto,
  CreateJokeCategoryDto,
  UpdateJokeCategoryDto,
  PaginationDto,
  SearchJokesDto,
  BulkImportResultDto,
  BulkDeleteDto,
} from '../common/dto/base.dto';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Dad Jokes')
@Controller('jokes')
export class DadJokesController {
  constructor(private readonly jokesService: DadJokesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all dad jokes with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated dad jokes' })
  findAll(@Query() pagination: PaginationDto): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findAllJokes(pagination);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get a random dad joke' })
  @ApiResponse({ status: 200, description: 'Returns a random joke' })
  @ApiResponse({ status: 404, description: 'No jokes found' })
  findRandom(): Promise<DadJoke> {
    return this.jokesService.findRandomJoke();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search dad jokes' })
  @ApiResponse({ status: 200, description: 'Returns filtered jokes' })
  search(@Query() searchDto: SearchJokesDto): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.searchJokes(searchDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all joke categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  findCategories(): Promise<JokeCategory[]> {
    return this.jokesService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID with jokes' })
  @ApiResponse({ status: 200, description: 'Returns category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findCategoryById(@Param('id') id: string): Promise<JokeCategory> {
    return this.jokesService.findCategoryById(id);
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'Get jokes by category' })
  @ApiResponse({ status: 200, description: 'Returns jokes in category' })
  findByCategory(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findJokesByCategory(id, pagination);
  }

  // ==================== ADMIN ENDPOINTS - JOKES ====================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new dad joke (Admin only)' })
  @ApiResponse({ status: 201, description: 'Joke created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateDadJokeDto): Promise<DadJoke> {
    return this.jokesService.createJoke(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create dad jokes (Admin only)' })
  @ApiResponse({ status: 201, description: 'Jokes created successfully', type: BulkImportResultDto })
  async createBulk(@Body() dto: CreateDadJokeDto[]): Promise<BulkImportResultDto> {
    const count = await this.jokesService.createJokesBulk(dto);
    return { success: count, failed: dto.length - count };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a dad joke (Admin only)' })
  @ApiResponse({ status: 200, description: 'Joke updated successfully' })
  @ApiResponse({ status: 404, description: 'Joke not found' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateDadJokeDto>): Promise<DadJoke> {
    return this.jokesService.updateJoke(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a dad joke (Admin only)' })
  @ApiResponse({ status: 204, description: 'Joke deleted successfully' })
  @ApiResponse({ status: 404, description: 'Joke not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.jokesService.deleteJoke(id);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete dad jokes (Admin only)' })
  @ApiResponse({ status: 204, description: 'Jokes deleted successfully' })
  async removeBulk(@Body() dto: BulkDeleteDto): Promise<void> {
    for (const id of dto.ids) {
      await this.jokesService.deleteJoke(id);
    }
  }

  // ==================== ADMIN ENDPOINTS - CATEGORIES ====================

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new joke category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  createCategory(@Body() dto: CreateJokeCategoryDto): Promise<JokeCategory> {
    return this.jokesService.createCategory(dto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a joke category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateJokeCategoryDto): Promise<JokeCategory> {
    return this.jokesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a joke category and all its jokes (Admin only)' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async removeCategory(@Param('id') id: string): Promise<void> {
    await this.jokesService.deleteCategory(id);
  }

  // ==================== STATS ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get dad jokes statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  getStats(): Promise<{ totalJokes: number; totalCategories: number; jokesByCategory: Record<string, number> }> {
    return this.jokesService.getStats();
  }
}
