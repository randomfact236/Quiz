import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';

import { Question } from './question.entity';
import { Subject } from './subject.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  chapterNumber: number;

  @ManyToOne(() => Subject, subject => subject.chapters)
  subject: Subject;

  @Column()
  subjectId: string;

  @OneToMany(() => Question, question => question.chapter)
  questions: Question[];
}