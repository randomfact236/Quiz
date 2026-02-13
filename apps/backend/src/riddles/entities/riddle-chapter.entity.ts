import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { RiddleSubject } from './riddle-subject.entity';
import { QuizRiddle } from './quiz-riddle.entity';

@Entity('riddle_chapters')
export class RiddleChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  chapterNumber: number;

  @ManyToOne(() => RiddleSubject, subject => subject.chapters)
  subject: RiddleSubject;

  @Column()
  subjectId: string;

  @OneToMany(() => QuizRiddle, riddle => riddle.chapter)
  riddles: QuizRiddle[];
}
