/**
 * QuestionLike — one player's like on a quiz/riddle question (BUG-037).
 *
 * Internal-only feature: likes are COLLECTED here and classified into
 * 1-like / 2-like / 3+-like buckets for the owner (derived by count, never
 * stored). Nothing like-related is exposed on the public site beyond the
 * one-tap capture itself. Dedupe: one row per (contentType, questionId,
 * guestId); logged-in likes additionally record the account id.
 */

import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Question family being liked — mirrors the two question sources. */
export enum QuestionLikeContentType {
  QUIZ = 'quiz',
  RIDDLE = 'riddle',
}

@Entity('question_likes')
@Index('uq_question_likes_dedupe', ['contentType', 'questionId', 'guestId'], { unique: true })
@Index('ix_question_likes_target', ['contentType', 'questionId'])
export class QuestionLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: QuestionLikeContentType })
  contentType: QuestionLikeContentType;

  @Column({ type: 'uuid' })
  questionId: string;

  /** Client-issued guest identity (same convention as comments). */
  @Column({ type: 'varchar', length: 64 })
  guestId: string;

  /** Account id when the liker was logged in; null for guests. */
  @Column({ type: 'uuid', nullable: true })
  userId: string | null = null;

  @UpdateDateColumn()
  updatedAt: Date;
}
