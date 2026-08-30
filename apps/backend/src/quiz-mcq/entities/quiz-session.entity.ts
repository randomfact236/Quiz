import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Completed quiz sessions, persisted server-side so results/high scores
 * survive device or browser loss (plan/02-mcq-quiz.md P1 #1).
 *
 * Identity is soft: rows carry `userId` when the player was logged in and/or
 * the client-issued `guestId` otherwise (same convention as comments/guest
 * play). Subject/chapter are stored as slugs/names — denormalized on purpose,
 * so history stays stable even if content is later deleted.
 */
@Entity('quiz_sessions')
@Index(['userId', 'completedAt'])
@Index(['guestId', 'completedAt'])
export class QuizSession {
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  chapterName: string | null;

  /** easy | medium | hard | expert | extreme (matches questions.level). */
  @Column({ type: 'varchar', length: 16, nullable: true })
  level: string | null;

  /** quiz | challenge | practice — free-form label from the entry mode. */
  @Column({ type: 'varchar', length: 16, nullable: true })
  mode: string | null;

  @Column({ type: 'int' })
  totalQuestions: number;

  @Column({ type: 'int' })
  correctCount: number;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'int' })
  maxScore: number;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number | null;

  @CreateDateColumn()
  completedAt: Date;
}
