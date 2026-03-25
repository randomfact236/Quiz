import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('riddle_chapter_slug_history')
export class RiddleChapterSlugHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  chapterId: string;

  @Column()
  oldSlug: string;

  @Column()
  newSlug: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}