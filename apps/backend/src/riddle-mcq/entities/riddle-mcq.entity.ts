import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

import { RiddleMcqLevel } from '../../common/enums/riddle-mcq-level.enum';

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

  @ManyToOne('RiddleSubject', 'riddles')
  @JoinColumn({ name: 'subjectId' })
  subject: any;

  @Index()
  @Column({
    type: 'enum',
    enum: RiddleStatus,
    default: RiddleStatus.DRAFT,
  })
  status: RiddleStatus;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
