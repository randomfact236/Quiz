import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { RiddleChapter } from './riddle-chapter.entity';
import { QuizRiddleLevel } from '../../common/enums/quiz-riddle-level.enum';

// Re-export for modules that import the enum alongside the entity
export { QuizRiddleLevel } from '../../common/enums/quiz-riddle-level.enum';

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

  /**
   * Difficulty level — stored as a DB enum, typed as string to remain
   * compatible with DTO inputs. See QuizRiddleLevel for valid values.
   */
  @Column({ type: 'enum', enum: QuizRiddleLevel })
  level: string;

  @ManyToOne(() => RiddleChapter, (chapter) => chapter.riddles)
  @JoinColumn({ name: 'chapterId' })
  chapter: RiddleChapter;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'text', nullable: true })
  hint: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
