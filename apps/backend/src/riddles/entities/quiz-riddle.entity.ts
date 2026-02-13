import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { RiddleChapter } from './riddle-chapter.entity';

@Entity('quiz_riddles')
export class QuizRiddle {
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

  @ManyToOne(() => RiddleChapter, chapter => chapter.riddles)
  chapter: RiddleChapter;

  @Column()
  chapterId: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'text', nullable: true })
  hint: string;
}
