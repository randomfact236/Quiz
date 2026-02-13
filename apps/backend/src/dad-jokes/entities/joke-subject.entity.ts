import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { JokeChapter } from './joke-chapter.entity';

@Entity('joke_subjects')
export class JokeSubject {
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

  @OneToMany(() => JokeChapter, chapter => chapter.subject)
  chapters: JokeChapter[];
}
