/**
 * ============================================================================
 * Comment Entity — polymorphic comment/guess feed
 * ============================================================================
 * One table backs both "guesses-as-comments" feeds on image riddles and
 * 💬 replies on dad jokes (comments-system plan §2.1). `kind` separates
 * riddle guesses / reveal-chip taps / free-text comments; `isCorrect` is
 * set server-side only at guess time and is never exposed to clients —
 * correct guesses are masked in public responses by the service layer.
 * ============================================================================
 */

import { Entity, PrimaryGeneratedColumn, Column, Index, UpdateDateColumn } from 'typeorm';

import { ContentStatus } from '../../common/enums/content-status.enum';

/** Content surfaces that own a comment feed. */
export enum CommentContentType {
  IMAGE_RIDDLE = 'image-riddle',
  JOKE = 'joke',
}

/** Feed entry kinds: riddle guesses, reveal-chip taps, plain comments. */
export enum CommentKind {
  GUESS = 'guess',
  CHIP = 'chip',
  COMMENT = 'comment',
}

/** Allow-list for chip-to-reveal taps (comments-system plan §1). */
export enum CommentChip {
  NEVER_GOT = 'never-got',
  SO_OBVIOUS = 'so-obvious',
  SO_CLOSE = 'so-close',
}

@Entity('comments')
@Index(['contentType', 'contentId', 'status', 'createdAt'])
@Index(['guestId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CommentContentType })
  contentType: CommentContentType;

  @Column({ type: 'uuid' })
  contentId: string;

  /** FK → guest_users.guestId (client-issued guest identity). */
  @Column({ type: 'varchar', length: 64 })
  guestId: string;

  /** Set when the author was logged in (plan/07-comments.md P1 #1). */
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  /** Raised by the public flag path; surfaced for admin moderation. */
  @Column({ default: false })
  flagged: boolean;

  /** Optional display name (guest-typed); null renders as "Guest" client-side. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  authorName: string | null;

  @Column({ type: 'enum', enum: CommentKind })
  kind: CommentKind;

  /** Guess/comment body; null for chip taps. */
  @Column({ type: 'text', nullable: true })
  text: string | null;

  /** Chip value for kind='chip'; null otherwise. */
  @Column({ type: 'varchar', length: 32, nullable: true })
  chip: string | null;

  /** Server-set at guess time; never serialized to public responses. */
  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  /** Default PUBLISHED (auto-publish moderation); TRASH = admin-hidden. */
  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.PUBLISHED })
  status: ContentStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
