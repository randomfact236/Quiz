import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';

import { RiddleChapter } from './riddle-chapter.entity';
import { RiddleSubject } from './riddle-subject.entity';
import { RiddleMcqLevel } from '../../common/enums/riddle-mcq-level.enum';

export { RiddleMcqLevel };

export enum RiddleStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  TRASH = 'trash',
}

@Entity('riddle_mcqs')
@Index(['chapterId', 'level', 'status'])
@Index(['chapterId'])
@Index(['level'])
@Index(['status'])
export class RiddleMcq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'simple-json', nullable: true })
  options: string[] | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  correctLetter: string | null;

  @Column({ type: 'text', nullable: true })
  correctAnswer: string | null;

  @Column({ type: 'enum', enum: RiddleMcqLevel, default: RiddleMcqLevel.EASY })
  level: RiddleMcqLevel;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ type: 'uuid', nullable: true })
  chapterId: string | null;

  @ManyToOne(() => RiddleChapter, (chapter) => chapter.riddles, { nullable: true })
  @JoinColumn({ name: 'chapterId' })
  chapter: RiddleChapter | null;

  @Column({ type: 'uuid', nullable: true })
  subjectId: string | null;

  @ManyToOne(() => RiddleSubject, (subject) => subject.riddles, { nullable: true })
  @JoinColumn({ name: 'subjectId' })
  subject: RiddleSubject | null;

  @Column({
    type: 'enum',
    enum: RiddleStatus,
    default: RiddleStatus.DRAFT,
  })
  status: RiddleStatus;

  @Column({ type: 'text', nullable: true })
  hint: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
