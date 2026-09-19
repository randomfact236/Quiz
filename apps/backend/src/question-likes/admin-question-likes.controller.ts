/**
 * Admin surface for the internal like buckets (BUG-037): exact-1 / exact-2 /
 * 3+-like question lists, derived by count. Owner-publish workflow consumes
 * these; nothing here is exposed publicly.
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { QuestionLikeBucketsQueryDto } from './dto/question-like.dto';
import { LikeBuckets, QuestionLikesService } from './question-likes.service';

@ApiTags('Admin — Question Likes')
@ApiBearerAuth()
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/question-likes')
export class AdminQuestionLikesController {
  constructor(private readonly likesService: QuestionLikesService) {}

  @Get('buckets')
  @ApiOperation({ summary: 'Internal 1 / 2 / 3+-like question buckets' })
  buckets(@Query() query: QuestionLikeBucketsQueryDto): Promise<LikeBuckets[]> {
    return this.likesService.buckets(query.contentType);
  }
}
