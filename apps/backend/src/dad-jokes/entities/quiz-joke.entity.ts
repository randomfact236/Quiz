import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { JokeChapter } from './joke-chapter.entity';

@Entity('quiz_jokes')
export class QuizJoke {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'simple-array' })
  options: string[];

  @Column()
  correctAnswer: string;

  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  level: string;

  @ManyToOne(() => JokeChapter, chapter => chapter.jokes)
  chapter: JokeChapter;

  @Column()
  chapterId: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'text', nullable: true })
  punchline: string;
}
