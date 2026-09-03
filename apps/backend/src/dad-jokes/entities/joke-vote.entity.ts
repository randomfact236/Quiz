import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * One vote per voter per joke (plan/05-dad-jokes.md P1 #1).
 * `voterKey` is `user:<uuid>` or `guest:<guestId>` — see CreateJokeVotes
 * migration. voteType is 'like' | 'dislike'.
 */
@Entity('joke_votes')
@Index(['jokeId', 'voterKey'], { unique: true })
export class JokeVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  jokeId: string;

  @Column({ type: 'varchar', length: 128 })
  voterKey: string;

  @Column({ type: 'varchar', length: 8 })
  voteType: 'like' | 'dislike';

  @CreateDateColumn()
  createdAt: Date;
}

export type VoterKey = `user:${string}` | `guest:${string}`;
