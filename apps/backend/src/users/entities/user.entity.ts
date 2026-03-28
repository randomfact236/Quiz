import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpires: Date;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  sex: 'male' | 'female';

  @Column({ nullable: true })
  ageGroup: string;

  @Column({ nullable: true })
  lastActive: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}