import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiddlesController } from './riddles.controller';
import { RiddlesService } from './riddles.service';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Riddle, RiddleCategory])],
  controllers: [RiddlesController],
  providers: [RiddlesService],
  exports: [RiddlesService],
})
export class RiddlesModule {}