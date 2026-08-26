import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Media } from './entities/media.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';

/**
 * Media library module — local-disk uploads with sharp WebP conversion.
 * Ported from the affiliate-website project and adapted to TypeORM.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  controllers: [MediaController],
  providers: [MediaService, StorageService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
