/**
 * ============================================================================
 * Comments Controller — public/guest endpoints
 * ============================================================================
 * Shared /comments surface (comments-system plan §2.2). Guest identity is a
 * client-issued `guestId`; writes are throttled to 20/min (same budget as
 * joke votes). Feeds are served from a short-TTL cache and invalidated on
 * every write. Admin moderation lives in CommentsAdminController.
 * ============================================================================
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { _Public } from '../common/decorators/public.decorator';

import {
  CommentCountsQueryDto,
  CommentFeedQueryDto,
  CreateCommentDto,
  MyCommentsQueryDto,
} from './dto/comments.dto';
import { CommentContentType } from './entities/comment.entity';
import { CommentsService, CommentFeed, PublicComment } from './comments.service';

const CONTENT_TYPES: CommentContentType[] = Object.values(CommentContentType);

class ContentTypeParamDto {
  contentType: CommentContentType;
}

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Literal routes must be registered BEFORE ':contentType/:contentId' or
  // Express shadows them (same ordering rule as image-riddles controller).

  @Get('my')
  @_Public()
  @ApiOperation({ summary: "List the caller's own comments on one content item" })
  findMine(@Query() query: MyCommentsQueryDto): Promise<PublicComment[]> {
    return this.commentsService.findMyComments(query.contentType, query.contentId, query.guestId);
  }

  @Get('counts')
  @_Public()
  @ApiOperation({ summary: 'Comment counts per content ID (for 💬 chips)' })
  counts(@Query() query: CommentCountsQueryDto): Promise<Record<string, number>> {
    const ids = query.ids
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .slice(0, 500);
    return this.commentsService.countByContentIds(
      // The counts endpoint backs the jokes grid; extend per-UI if needed.
      CommentContentType.JOKE,
      ids
    );
  }

  @Get(':contentType/:contentId')
  @_Public()
  @ApiOperation({ summary: 'Public feed for a riddle/joke (masked, with chip tallies)' })
  findFeed(
    @Param('contentType') contentType: CommentContentType,
    @Param('contentId') contentId: string,
    @Query() query: CommentFeedQueryDto
  ): Promise<CommentFeed> {
    if (!CONTENT_TYPES.includes(contentType as CommentContentType)) {
      return Promise.reject(
        new Error(
          `Invalid contentType: ${contentType}. Valid values are: ${CONTENT_TYPES.join(', ')}`
        )
      );
    }
    return this.commentsService.findFeed(
      contentType as CommentContentType,
      contentId,
      query.page ?? 1,
      query.limit ?? 20
    );
  }

  @Post()
  @_Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Post a guess / chip tap / comment (guest, 20/min)' })
  create(@Body() dto: CreateCommentDto & { guestId: string }): Promise<PublicComment> {
    return this.commentsService.create(dto.guestId, dto);
  }

  @Delete(':id')
  @_Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete own comment by guestId (admins use /admin/comments)' })
  remove(@Param('id') id: string, @Query() query: { guestId?: string }): Promise<void> {
    // Missing guestId simply fails the ownership check (403).
    return this.commentsService.removeAsGuest(id, query.guestId ?? '');
  }
}
