import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * NOW-08 Daily Challenge — one result row per identity per day.
 *
 * `date` is the CLIENT-LOCAL calendar day ('YYYY-MM-DD'): the client passes
 * its own date on every call, so a streak never breaks on server/client
 * timezone drift. One attempt per day is enforced by two PARTIAL unique
 * indexes — user rows and guest rows never collide in the same index, and
 * an identity without either column can't exist (service-level check).
 */
@Entity('daily_challenge_results')
@Index('uq_daily_user_date', ['date', 'userId'], { unique: true, where: '"userId" IS NOT NULL' })
@Index('uq_daily_guest_date', ['date', 'guestId'], { unique: true, where: '"guestId" IS NOT NULL' })
@Index('ix_daily_identity_dates', ['userId'])
@Index('ix_daily_guest_dates', ['guestId'])
export class DailyChallengeResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  guestId: string | null;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'int' })
  correctCount: number;

  @Column({ type: 'int' })
  total: number;

  @CreateDateColumn()
  createdAt: Date;
}
