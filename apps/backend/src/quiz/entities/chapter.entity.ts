import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Unique, Index } from 'typeorm';

import { Question } from './question.entity';
import { Subject } from './subject.entity';

@Entity('chapters')
@Unique(['name', 'subjectId'])
@Unique(['slug', 'subjectId'])
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index()
  @Column({ nullable: false })
  slug: string;

  @Column({ type: 'int' })
  chapterNumber: number;

  @ManyToOne(() => Subject, subject => subject.chapters)
  subject: Subject;

  @Index()
  @Column()
  subjectId: string;

  @OneToMany(() => Question, question => question.chapter)
  questions: Question[];
}