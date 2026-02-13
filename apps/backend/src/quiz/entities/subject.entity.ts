import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Chapter } from './chapter.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column()
  emoji: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => Chapter, chapter => chapter.subject)
  chapters: Chapter[];
}