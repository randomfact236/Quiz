import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('guest_users')
export class GuestUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  guestId: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  sex: 'male' | 'female';

  @Column({ nullable: true })
  ageGroup: string;

  @Column({ nullable: true, default: 0 })
  quizAttempts: number;

  @Column({ nullable: true, default: 0 })
  totalScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastActive: Date;
}
