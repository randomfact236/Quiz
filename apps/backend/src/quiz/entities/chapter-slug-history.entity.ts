import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

import { Chapter } from './chapter.entity';

@Entity('chapter_slug_history')
export class ChapterSlugHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  chapterId: string;

  @Index()
  @Column()
  oldSlug: string;

  @Column()
  newSlug: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapterId' })
  chapter: Chapter;
}
