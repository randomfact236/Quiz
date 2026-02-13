import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Subject } from './subject.entity';
import { Question } from './question.entity';

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