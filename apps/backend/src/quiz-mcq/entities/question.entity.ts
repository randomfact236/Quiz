import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { ContentStatus } from '../../common/enums/content-status.enum';

import { Chapter } from './chapter.entity';

@Entity('questions')
@Index(['chapterId', 'level', 'status'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'jsonb', default: [], nullable: true })
  options: string[] | null;

  @Column()
  correctAnswer: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  correctLetter: string | null;

  @Index()
  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  level: string;

  /** Optional rationale shown in the review UI after answering. */
  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @ManyToOne(() => Chapter, (chapter) => chapter.questions)
  chapter: Chapter;

  @Index()
  @Column()
  chapterId: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Index()
  @Column({ type: 'float8', default: () => 'random()' })
  random_weight: number;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
