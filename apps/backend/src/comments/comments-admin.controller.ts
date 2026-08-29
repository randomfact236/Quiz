/**
 * ============================================================================
 * Comments Admin Controller — moderation surfaces
 * ============================================================================
 * /admin/comments/* (comments-system plan §2.2): status-filtered moderation
 * list plus the canonical bulk-action surface (publish/trash/restore/delete)
 * reused from BulkActionService, same pattern as jokes/riddles.
 * ============================================================================
 */

import { Body, Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BulkActionDto, BulkActionResponseDto } from '../common/dto/bulk-action.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import { AdminCommentListQueryDto } from './dto/comments.dto';
import { CommentsService } from './comments.service';

@ApiTags('Comments (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/comments')
export class CommentsAdminController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'Moderation list — all statuses, filterable (Admin only)' })
  list(@Query() query: AdminCommentListQueryDto) {
    return this.commentsService.findAllAdmin(query);
  }

  @Post('bulk-action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk publish/trash/restore/delete comments (Admin only)' })
  bulkAction(@Body() dto: BulkActionDto): Promise<BulkActionResponseDto> {
    return this.commentsService.bulkAction(dto.ids, dto.action);
  }
}
