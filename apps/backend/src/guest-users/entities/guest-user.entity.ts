import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Guest identity is client-issued (frontend `lib/guest-id.ts`, localStorage key
 * `aiquiz:guest-id`) and attributes anonymous play + analytics. The display name
 * used for comments comes from the same guest-id helper — it is a comments-only
 * convention, not a column here; guests are otherwise anonymous (no PII).
 */
@Entity('guest_users')
export class GuestUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  guestId: string;

  @Column({ nullable: true, default: 0 })
  quizAttempts: number;

  @Column({ nullable: true, default: 0 })
  totalScore: number;

  /** Nickname shown in duels and the online players list (plan/17). */
  @Column({ type: 'varchar', length: 32, nullable: true })
  displayName: string | null;

  /** Opt-out toggle for the challengeable-players list (default on). */
  @Column({ default: true })
  showInList: boolean;

  /**
   * Public, non-secret handle for cross-player targeting (duel challenges).
   * Unlike guestId — which authorizes guest writes and must never be shared —
   * publicId is safe to expose in the online-players list
   * (security-audit-2026-09-09.md A3).
   */
  @Column({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' })
  publicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastActive: Date;
}
