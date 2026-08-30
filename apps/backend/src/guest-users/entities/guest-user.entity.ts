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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastActive: Date;
}
