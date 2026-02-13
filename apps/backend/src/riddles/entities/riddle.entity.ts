import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { RiddleCategory } from './riddle-category.entity';

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
}