import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RiddleChapter } from './riddle-chapter.entity';

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

  @OneToMany(() => RiddleChapter, chapter => chapter.subject)
  chapters: RiddleChapter[];
}
