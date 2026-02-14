import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ImageRiddleCategory } from './image-riddle-category.entity';

/**
 * ImageRiddle Entity - Enterprise Grade
 * Stores visual puzzle data with configurable timer settings
 */
@Entity('image_riddles')
export class ImageRiddle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  imageUrl: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'text', nullable: true })
  hint: string | null;

  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' })
  difficulty: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  altText: string | null;

  /**
   * Timer configuration in seconds
   * If null, uses default based on difficulty
   */
  @Column({ type: 'int', nullable: true })
  timerSeconds: number | null;

  /**
   * Whether to show timer to user
   */
  @Column({ type: 'boolean', default: true })
  showTimer: boolean;

  @ManyToOne(() => ImageRiddleCategory, category => category.riddles, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: ImageRiddleCategory;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  /**
   * Get default timer - all difficulties use 90s
   */
  getDefaultTimer(): number {
    return 90;
  }

  /**
   * Get effective timer in seconds
   * Returns custom timer if set, otherwise difficulty-based default
   */
  getEffectiveTimer(): number {
    return this.timerSeconds ?? this.getDefaultTimer();
  }
}
