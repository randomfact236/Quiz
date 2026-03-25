import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

import { RiddleChapter } from './riddle-chapter.entity';
import { RiddleMcqLevel } from '../../common/enums/riddle-mcq-level.enum';

export { RiddleMcqLevel };

export enum RiddleStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  TRASH = 'trash',
}

@Entity('riddle_mcqs')
@Index(['chapterId', 'level', 'status'])
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

  @Index()
  @Column({ type: 'enum', enum: RiddleMcqLevel, default: RiddleMcqLevel.EASY })
  level: RiddleMcqLevel;

  @Index()
  @Column()
  chapterId: string;

  @ManyToOne(() => RiddleChapter, (chapter) => chapter.riddles)
  @JoinColumn({ name: 'chapterId' })
  chapter: RiddleChapter;

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