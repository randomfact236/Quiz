import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { JokeSubject } from './joke-subject.entity';
import { QuizJoke } from './quiz-joke.entity';

@Entity('joke_chapters')
export class JokeChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  chapterNumber: number;

  @ManyToOne(() => JokeSubject, subject => subject.chapters)
  subject: JokeSubject;

  @Column()
  subjectId: string;

  @OneToMany(() => QuizJoke, joke => joke.chapter)
  jokes: QuizJoke[];
}
