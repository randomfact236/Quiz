import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Riddle } from './riddle.entity';
import { RiddleSubject } from './riddle-subject.entity';

@Entity('riddle_categories')
export class RiddleCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({ nullable: true, unique: true })
  slug: string;

  @OneToMany(() => Riddle, (riddle) => riddle.category)
  riddles: Riddle[];

  @OneToMany(() => RiddleSubject, (subject) => subject.category)
  subjects: RiddleSubject[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}