import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DadJokesController } from './dad-jokes.controller';
import { DadJokesService } from './dad-jokes.service';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import { JokeSubject } from './entities/joke-subject.entity';
import { JokeChapter } from './entities/joke-chapter.entity';
import { QuizJoke } from './entities/quiz-joke.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DadJoke, JokeCategory, JokeSubject, JokeChapter, QuizJoke])],
  controllers: [DadJokesController],
  providers: [DadJokesService],
  exports: [DadJokesService],
})
export class DadJokesModule {}
