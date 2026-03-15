import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

import { RiddleCategory } from './riddle-category.entity';
import { RiddleChapter } from './riddle-chapter.entity';
import { QuizRiddle } from './quiz-riddle.entity';

@Entity('riddle_subjects')
export class RiddleSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column()
  emoji: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => RiddleCategory, (category) => category.subjects, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: RiddleCategory;

  @OneToMany(() => RiddleChapter, (chapter) => chapter.subject)
  chapters: RiddleChapter[];

  @OneToMany(() => QuizRiddle, (riddle) => riddle.subject)
  riddles: QuizRiddle[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
