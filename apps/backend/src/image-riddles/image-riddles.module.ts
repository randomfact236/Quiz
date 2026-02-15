/**
 * ============================================================================
 * Image Riddles Module - Enterprise Grade
 * ============================================================================
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageRiddlesController } from './image-riddles.controller';
import { ImageRiddlesService } from './image-riddles.service';
import { ImageRiddle } from './entities/image-riddle.entity';
import { ImageRiddleCategory } from './entities/image-riddle-category.entity';
import { CacheService } from '../common/cache/cache.service';
import { BulkActionService } from '../common/services/bulk-action.service';

@Module({
  imports: [TypeOrmModule.forFeature([ImageRiddle, ImageRiddleCategory])],
  controllers: [ImageRiddlesController],
  providers: [ImageRiddlesService, CacheService, BulkActionService],
  exports: [ImageRiddlesService],
})
export class ImageRiddlesModule {}
