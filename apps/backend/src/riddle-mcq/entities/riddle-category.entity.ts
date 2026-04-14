import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { RiddleSubject } from './riddle-subject.entity';

@Entity('riddle_categories')
export class RiddleCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column()
  emoji: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => RiddleSubject, (subject) => subject.category)
  subjects: RiddleSubject[];
}
