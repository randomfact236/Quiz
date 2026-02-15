import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn } from 'typeorm';
import { RiddleCategory } from './riddle-category.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';

@Entity('riddles')
export class Riddle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty: string;

  @ManyToOne(() => RiddleCategory, category => category.riddles)
  category: RiddleCategory;

  @Column({ nullable: true })
  categoryId: string;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
