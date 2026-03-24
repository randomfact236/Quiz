import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { RiddleChapter } from './riddle-chapter.entity';
import { RiddleMcq } from './riddle-mcq.entity';

export enum RiddleSubjectCategory {
  ACADEMIC = 'academic',
  PROFESSIONAL = 'professional',
  ENTERTAINMENT = 'entertainment',
}

@Entity('riddle_subjects')
export class RiddleSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: RiddleSubjectCategory,
    default: RiddleSubjectCategory.ENTERTAINMENT,
  })
  category: RiddleSubjectCategory;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  @Index()
  order: number;

  @OneToMany(() => RiddleChapter, (chapter) => chapter.subject)
  chapters: RiddleChapter[];

  @OneToMany(() => RiddleMcq, (riddle) => riddle.subject)
  riddles: RiddleMcq[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
