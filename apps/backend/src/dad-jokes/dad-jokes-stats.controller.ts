import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DadJokesService } from './dad-jokes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Controller for dad jokes statistics
 * 
 * @description Provides REST API endpoints for dad jokes statistics
 */
@ApiTags('Dad Jokes - Stats')
@Controller('jokes')
export class DadJokesStatsController {
  constructor(private readonly jokesService: DadJokesService) {}

  /**
   * Get dad jokes statistics
   * 
   * @description Returns aggregated statistics about all dad joke content
   * including counts of classic jokes, categories, quiz jokes, subjects, and chapters.
   * 
   * @returns {Promise<Object>} Statistics object with various counts
   */
  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dad jokes statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  getStats(): Promise<{
    totalClassicJokes: number;
    totalCategories: number;
    totalQuizJokes: number;
    totalSubjects: number;
    totalChapters: number;
  }> {
    return this.jokesService.getStats();
  }
}
