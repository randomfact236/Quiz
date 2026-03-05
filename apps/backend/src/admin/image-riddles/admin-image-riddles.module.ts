import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ImageRiddleCategory } from '../../image-riddles/entities/image-riddle-category.entity';
import { ImageRiddle } from '../../image-riddles/entities/image-riddle.entity';

import { AdminImageRiddlesController } from './admin-image-riddles.controller';
import { AdminImageRiddlesService } from './admin-image-riddles.service';

/**
 * Admin Image Riddles Module
 * Provides admin panel functionality for managing image riddles
 */
@Module({
  imports: [TypeOrmModule.forFeature([ImageRiddle, ImageRiddleCategory])],
  controllers: [AdminImageRiddlesController],
  providers: [AdminImageRiddlesService],
  exports: [AdminImageRiddlesService],
})
export class AdminImageRiddlesModule {}
