import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';

import { RiddleMcq } from './riddle-mcq.entity';
import { RiddleSubject } from './riddle-subject.entity';

@Entity('riddle_chapters')
@Unique(['slug', 'subjectId'])
export class RiddleChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ type: 'int' })
  chapterNumber: number;

  @Column({ type: 'uuid' })
  @Index()
  subjectId: string;

  @ManyToOne(() => RiddleSubject, (subject) => subject.chapters)
  @JoinColumn({ name: 'subjectId' })
  subject: RiddleSubject;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => RiddleMcq, (riddle) => riddle.chapter)
  riddles: RiddleMcq[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
