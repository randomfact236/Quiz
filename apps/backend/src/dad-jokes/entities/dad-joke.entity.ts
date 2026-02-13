import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
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
}