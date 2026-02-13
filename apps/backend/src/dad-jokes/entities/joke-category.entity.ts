import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DadJoke } from './dad-joke.entity';

@Entity('joke_categories')
export class JokeCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  emoji: string;

  @OneToMany(() => DadJoke, joke => joke.category)
  jokes: DadJoke[];
}