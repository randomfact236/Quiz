/**
 * ============================================================================
 * QuestionLikes Controller — public one-tap capture (BUG-037)
 * ============================================================================
 * Guests tap a heart on a question; capture is idempotent per guest. Buckets
 * (1 / 2 / 3+) are internal — admin controller only.
 * ============================================================================
 */

import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { _Public } from '../common/decorators/public.decorator';
import { CreateQuestionLikeDto, MyQuestionLikeQueryDto } from './dto/question-like.dto';
import { QuestionLikeContentType } from './entities/question-like.entity';
import { QuestionLikesService } from './question-likes.service';

@ApiTags('Question Likes')
@Controller('question-likes')
export class QuestionLikesController {
  constructor(private readonly likesService: QuestionLikesService) {}

  @Post()
  @_Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Like a question (idempotent per guest)' })
  like(
    @Body() dto: CreateQuestionLikeDto,
    @Req() req: { user?: { id?: string } }
  ): Promise<{ liked: boolean; alreadyLiked: boolean }> {
    return this.likesService.like(
      dto.contentType,
      dto.questionId,
      dto.guestId,
      req.user?.id ?? null
    );
  }

  @Get('counts')
  @_Public()
  @ApiOperation({ summary: 'Public like totals per question id (BUG-048)' })
  counts(
    @Query('contentType') contentType: QuestionLikeContentType,
    @Query('ids') ids: string
  ): Promise<Record<string, number>> {
    return this.likesService.likeCounts(contentType, ids);
  }

  @Get('my')
  @_Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Whether the caller already liked a question (guest or account)' })
  likedByMe(
    @Query() query: MyQuestionLikeQueryDto,
    @Req() req: { user?: { id?: string } }
  ): Promise<boolean> {
    return this.likesService.likedByMe(
      query.contentType,
      query.questionId,
      query.guestId,
      req.user?.id ?? null
    );
  }
}
