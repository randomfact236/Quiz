import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';

import { RiddleCategory } from './riddle-category.entity';
import { RiddleMcq } from './riddle-mcq.entity';

@Entity('riddle_subjects')
export class RiddleSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column()
  emoji: string;

  @Index()
  @Column({ nullable: true })
  categoryId: string | null;

  @ManyToOne(() => RiddleCategory, (category) => category.subjects, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: RiddleCategory | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => RiddleMcq, (riddle) => riddle.subject)
  riddles: RiddleMcq[];
}
