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
import { DadJokesService } from './dad-jokes.service';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDadJokeDto, PaginationDto } from '../common/dto/base.dto';

@ApiTags('Dad Jokes')
@Controller('jokes')
export class DadJokesController {
  constructor(private readonly jokesService: DadJokesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all dad jokes' })
  async getAllJokes(@Query() pagination: PaginationDto): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findAllJokes(pagination);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get a random dad joke' })
  async getRandomJoke(): Promise<DadJoke> {
    return this.jokesService.findRandomJoke();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all joke categories' })
  async getAllCategories(): Promise<JokeCategory[]> {
    return this.jokesService.findAllCategories();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get jokes by category' })
  async getJokesByCategory(
    @Param('categoryId') categoryId: string,
    @Query() pagination: PaginationDto,
  ): Promise<{ data: DadJoke[]; total: number }> {
    return this.jokesService.findJokesByCategory(categoryId, pagination);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new dad joke (Admin only)' })
  async createJoke(@Body() dto: CreateDadJokeDto): Promise<DadJoke> {
    return this.jokesService.createJoke(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create jokes (Admin only)' })
  async createJokesBulk(@Body() dto: CreateDadJokeDto[]): Promise<{ count: number }> {
    const count = await this.jokesService.createJokesBulk(dto);
    return { count };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update joke (Admin only)' })
  async updateJoke(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDadJokeDto>,
  ): Promise<DadJoke> {
    return this.jokesService.updateJoke(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete joke (Admin only)' })
  async deleteJoke(@Param('id') id: string): Promise<{ message: string }> {
    await this.jokesService.deleteJoke(id);
    return { message: 'Joke deleted successfully' };
  }

  // ==================== CATEGORY MANAGEMENT ====================

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create joke category (Admin only)' })
  async createCategory(@Body() dto: { name: string }): Promise<JokeCategory> {
    return this.jokesService.createCategory(dto.name);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: { name: string },
  ): Promise<JokeCategory> {
    return this.jokesService.updateCategory(id, dto.name);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  async deleteCategory(@Param('id') id: string): Promise<{ message: string }> {
    await this.jokesService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }
}