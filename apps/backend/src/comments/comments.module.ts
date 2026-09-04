/**
 * ============================================================================
 * Comments Module
 * ============================================================================
 * Polymorphic comment/guess feed shared by image riddles (guesses-as-
 * comments + chip-to-reveal) and dad jokes (💬 replies). See
 * plan/07-comments.md.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheService } from '../common/cache/cache.service';
import { BulkActionService } from '../common/services/bulk-action.service';
import { DadJoke } from '../dad-jokes/entities/dad-joke.entity';
import { GuestUsersModule } from '../guest-users/guest-users.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ImageRiddle } from '../image-riddles/entities/image-riddle.entity';

import { Comment } from './entities/comment.entity';
import { CommentsAdminController } from './comments-admin.controller';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, ImageRiddle, DadJoke]),
    GuestUsersModule,
    AnalyticsModule,
  ],
  controllers: [CommentsController, CommentsAdminController],
  providers: [CommentsService, CacheService, BulkActionService],
  exports: [CommentsService],
})
export class CommentsModule {}
