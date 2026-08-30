import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: 'user' })
  role: string;

  /** SHA-256 hash of the opaque refresh token — the raw token never touches the DB. */
  @Column({ nullable: true, type: 'varchar' })
  refreshToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  refreshTokenExpiresAt: Date | null;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true, type: 'varchar' })
  passwordResetToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetExpires: Date | null;

  @Column({ nullable: true })
  lastActive: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
