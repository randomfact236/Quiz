import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { ContentStatus } from '../../common/enums/content-status.enum';

import { JokeCategory } from './joke-category.entity';

@Entity('dad_jokes')
export class DadJoke {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  joke: string;

  @ManyToOne(() => JokeCategory, category => category.jokes)
  category: JokeCategory;

  @Column({ nullable: true })
  categoryId: string;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  dislikes: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
