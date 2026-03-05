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

import { QuizRiddle } from './quiz-riddle.entity';
import { RiddleSubject } from './riddle-subject.entity';

@Entity('riddle_chapters')
export class RiddleChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  chapterNumber: number;

  @ManyToOne(() => RiddleSubject, (subject) => subject.chapters)
  @JoinColumn({ name: 'subjectId' })
  subject: RiddleSubject;

  @Column()
  subjectId: string;

  @OneToMany(() => QuizRiddle, (riddle) => riddle.chapter)
  riddles: QuizRiddle[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
