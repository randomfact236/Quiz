import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn } from 'typeorm';
import { Chapter } from './chapter.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';

@Entity('questions')
export class Question {
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

  @ManyToOne(() => Chapter, chapter => chapter.questions)
  chapter: Chapter;

  @Column()
  chapterId: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
