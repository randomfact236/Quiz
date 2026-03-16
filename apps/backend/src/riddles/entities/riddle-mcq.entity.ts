import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

import { RiddleMcqLevel } from '../../common/enums/riddle-mcq-level.enum';

import { RiddleChapter } from './riddle-chapter.entity';
import { RiddleSubject } from './riddle-subject.entity';

// Re-export for modules that import the enum alongside the entity
export { RiddleMcqLevel } from '../../common/enums/riddle-mcq-level.enum';

@Entity('riddle_mcqs')
export class RiddleMcq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'simple-array', nullable: true })
  options: string[] | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  correctLetter: string | null;

  @Column()
  correctAnswer: string;

  /**
   * Difficulty level — stored as a DB enum, typed as string to remain
   * compatible with DTO inputs. See RiddleMcqLevel for valid values.
   */
  @Column({ type: 'enum', enum: RiddleMcqLevel })
  level: string;

  @Column({ nullable: true })
  subjectId: string;

  @ManyToOne(() => RiddleSubject, (subject) => subject.riddles, { nullable: true })
  @JoinColumn({ name: 'subjectId' })
  subject: RiddleSubject;

  @Column({ nullable: true })
  chapterId: string;

  @ManyToOne(() => RiddleChapter, (chapter) => chapter.riddles, { nullable: true })
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
