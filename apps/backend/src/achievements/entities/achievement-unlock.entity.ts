import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * A persisted achievement unlock (plan/06-achievements.md P1 #3).
 * Attribution is soft: userId when logged in, guestId otherwise — rows keep
 * whichever identity the client had at unlock time.
 */
@Entity('user_achievements')
@Index(['userId', 'guestId', 'achievementId'], { unique: true })
export class AchievementUnlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  guestId: string | null;

  @Column({ type: 'varchar', length: 64 })
  achievementId: string;

  @Column({ type: 'timestamptz' })
  unlockedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
