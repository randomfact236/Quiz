import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Unique,
  Index,
  JoinColumn,
} from 'typeorm';

import { RiddleMcq } from './riddle-mcq.entity';
import { RiddleSubject } from './riddle-subject.entity';

@Entity('riddle_chapters')
@Unique(['name', 'subjectId'])
export class RiddleChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  chapterNumber: number;

  @Index()
  @Column()
  subjectId: string;

  @ManyToOne(() => RiddleSubject, (subject) => subject.chapters)
  @JoinColumn({ name: 'subjectId' })
  subject: RiddleSubject;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => RiddleMcq, (riddle) => riddle.chapter)
  riddles: RiddleMcq[];
}