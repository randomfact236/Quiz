import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

import { RiddleMcqLevel } from '../../common/enums/riddle-mcq-level.enum';
import { RiddleMcqSubject } from './riddle-subject.entity';

export { RiddleMcqLevel };

export enum RiddleStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  TRASH = 'trash',
}

@Entity('riddle_mcqs')
@Index(['subjectId', 'level', 'status'])
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
  explanation: string | null;

  @Column({ type: 'text', nullable: true })
  hint: string | null;

  @Column({ type: 'text', nullable: true })
  answer: string | null;

  @Index()
  @Column({ type: 'enum', enum: RiddleMcqLevel, default: RiddleMcqLevel.EASY })
  level: RiddleMcqLevel;

  @Index()
  @Column()
  subjectId: string;

  @ManyToOne(() => RiddleMcqSubject, 'riddles')
  @JoinColumn({ name: 'subjectId' })
  subject: RiddleMcqSubject;

  @Index()
  @Column({
    type: 'enum',
    enum: RiddleStatus,
    default: RiddleStatus.DRAFT,
  })
  status: RiddleStatus;

  @Index()
  @Column({ type: 'int', nullable: true })
  importOrder: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
