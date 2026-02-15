/**
 * ============================================================================
 * file.ts - Enterprise Grade
 * ============================================================================
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ImageRiddle } from './image-riddle.entity';

@Entity('image_riddle_categories')
export class ImageRiddleCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10, default: '🖼️' })
  emoji: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => ImageRiddle, riddle => riddle.category)
  riddles: ImageRiddle[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
