/**
 * ShareCount — aggregated counter for "share this content" clicks (BUG-048).
 *
 * One row per (contentType, contentId, platform); each share target click
 * increments `shares`. Totals are public: GET /share-counts/counts returns
 * the per-content totals shown beside the like/comment counts.
 */

import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Everything that can be shared — broader than question likes. */
export enum ShareContentType {
  QUIZ_QUESTION = 'quiz-question',
  RIDDLE_QUESTION = 'riddle-question',
  QUIZ_SUBJECT = 'quiz-subject',
  RIDDLE_CATEGORY = 'riddle-category',
  IMAGE_RIDDLE = 'image-riddle',
  JOKE = 'joke',
  GAME = 'game',
  HOME = 'home',
}

@Entity('share_counts')
@Index('uq_share_counts_target', ['contentType', 'contentId', 'platform'], { unique: true })
@Index('ix_share_counts_target', ['contentType', 'contentId'])
export class ShareCount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  contentType: string;

  /** UUID for questions/riddles/jokes, slug for games/subjects/categories. */
  @Column({ type: 'varchar', length: 64 })
  contentId: string;

  /** Share target clicked: facebook | x | whatsapp | linkedin | copy | other. */
  @Column({ type: 'varchar', length: 16, default: 'other' })
  platform: string;

  @Column({ type: 'int', default: 1 })
  shares: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
