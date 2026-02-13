import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DadJokesController } from './dad-jokes.controller';
import { DadJokesService } from './dad-jokes.service';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DadJoke, JokeCategory])],
  controllers: [DadJokesController],
  providers: [DadJokesService],
  exports: [DadJokesService],
})
export class DadJokesModule {}