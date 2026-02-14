import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageRiddlesController } from './image-riddles.controller';
import { ImageRiddlesService } from './image-riddles.service';
import { ImageRiddle } from './entities/image-riddle.entity';
import { ImageRiddleCategory } from './entities/image-riddle-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ImageRiddle, ImageRiddleCategory])],
  controllers: [ImageRiddlesController],
  providers: [ImageRiddlesService],
  exports: [ImageRiddlesService],
})
export class ImageRiddlesModule {}
