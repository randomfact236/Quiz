import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RiddlesService } from './riddles.service';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateRiddleDto, PaginationDto } from '../common/dto/base.dto';

@ApiTags('Riddles')
@Controller('riddles')
export class RiddlesController {
  constructor(private readonly riddlesService: RiddlesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all riddles' })
  async getAllRiddles(@Query() pagination: PaginationDto): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.findAllRiddles(pagination);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get a random riddle' })
  async getRandomRiddle(): Promise<Riddle> {
    return this.riddlesService.findRandomRiddle();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all riddle categories' })
  async getAllCategories(): Promise<RiddleCategory[]> {
    return this.riddlesService.findAllCategories();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get riddles by category' })
  async getRiddlesByCategory(
    @Param('categoryId') categoryId: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.findRiddlesByCategory(categoryId, pagination);
  }

  @Get('difficulty/:difficulty')
  @ApiOperation({ summary: 'Get riddles by difficulty' })
  async getRiddlesByDifficulty(
    @Param('difficulty') difficulty: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    return this.riddlesService.findRiddlesByDifficulty(difficulty, pagination);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new riddle (Admin only)' })
  async createRiddle(@Body() dto: CreateRiddleDto): Promise<Riddle> {
    return this.riddlesService.createRiddle(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create riddles (Admin only)' })
  async createRiddlesBulk(@Body() dto: CreateRiddleDto[]): Promise<{ count: number }> {
    const count = await this.riddlesService.createRiddlesBulk(dto);
    return { count };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update riddle (Admin only)' })
  async updateRiddle(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRiddleDto>,
  ): Promise<Riddle> {
    return this.riddlesService.updateRiddle(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete riddle (Admin only)' })
  async deleteRiddle(@Param('id') id: string): Promise<{ message: string }> {
    await this.riddlesService.deleteRiddle(id);
    return { message: 'Riddle deleted successfully' };
  }

  // ==================== CATEGORY MANAGEMENT ====================

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create riddle category (Admin only)' })
  async createCategory(@Body() dto: { name: string }): Promise<RiddleCategory> {
    return this.riddlesService.createCategory(dto.name);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: { name: string },
  ): Promise<RiddleCategory> {
    return this.riddlesService.updateCategory(id, dto.name);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  async deleteCategory(@Param('id') id: string): Promise<{ message: string }> {
    await this.riddlesService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }
}