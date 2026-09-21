import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ShareCount } from './entities/share-count.entity';
import { ShareCountsController } from './share-counts.controller';
import { ShareCountsService } from './share-counts.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShareCount])],
  controllers: [ShareCountsController],
  providers: [ShareCountsService],
  exports: [ShareCountsService],
})
export class ShareCountsModule {}
