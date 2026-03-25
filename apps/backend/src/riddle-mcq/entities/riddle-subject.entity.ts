import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';

import { RiddleChapter } from './riddle-chapter.entity';
import { RiddleCategory } from './riddle-category.entity';

@Entity('riddle_subjects')
export class RiddleSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column()
  emoji: string;

  @Index()
  @Column({ nullable: true })
  categoryId: string | null;

  @ManyToOne(() => RiddleCategory, (category) => category.subjects, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: RiddleCategory | null;

  @Column({ default: true })
  isActive: boolean;

  @Index()
  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => RiddleChapter, (chapter) => chapter.subject)
  chapters: RiddleChapter[];
}