import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Online duel match (mobile-app plan/17-online-duel.md, backend gap #7).
 * Race mode: both participants get the SAME fixed question set (ids frozen at
 * creation) and play separate instances at their own pace. The server grades
 * every pick (`POST answer`) and computes final results — answers never leave
 * the server.
 */
@Entity('duel_matches')
@Index(['code'], { unique: true })
@Index(['status'])
export class DuelMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 6-char join code (deep link aiquiz://duel/:code). */
  @Column({ type: 'varchar', length: 6 })
  code: string;

  @Column({ type: 'varchar', length: 16 })
  level: string;

  /** Frozen question ids for both participants (server keeps the answers). */
  @Column({ type: 'jsonb' })
  questionIds: string[];

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
