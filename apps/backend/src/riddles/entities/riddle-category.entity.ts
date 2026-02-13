import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Riddle } from './riddle.entity';

@Entity('riddle_categories')
export class RiddleCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  emoji: string;

  @OneToMany(() => Riddle, riddle => riddle.category)
  riddles: Riddle[];
}