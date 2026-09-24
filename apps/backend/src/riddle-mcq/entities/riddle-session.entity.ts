import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * NOW-07 (was HARD-13 item 1): completed riddle sessions, persisted
 * server-side so results/high scores survive device or browser loss — the
 * riddle-side mirror of `quiz_sessions`, and the session identity HARD-15
 * (duel) builds on.
 *
 * Identity is soft: rows carry `userId` when logged in and/or the
 * client-issued `guestId` otherwise. Subject fields are denormalized on
 * purpose so history stays stable if content changes later.
 */
@Entity('riddle_sessions')
@Index(['userId', 'completedAt'])
@Index(['guestId', 'completedAt'])
export class RiddleSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  guestId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subjectSlug: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subjectName: string | null;

  /** easy | medium | hard | expert | extreme. */
  @Column({ type: 'varchar', length: 16, nullable: true })
  difficulty: string | null;

  /** timer | practice (entry mode from the UI). */
  @Column({ type: 'varchar', length: 16, nullable: true })
  mode: string | null;

  @Column({ type: 'int' })
  totalRiddles: number;

  @Column({ type: 'int' })
  correctCount: number;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'int' })
  maxScore: number;

  @Column({ type: 'int', nullable: true })
  timeTaken: number | null;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
