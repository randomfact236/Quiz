/**
 * ============================================================================
 * file.ts - Enterprise Grade
 * ============================================================================
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  UpdateDateColumn,
} from 'typeorm';

import { ContentStatus } from '../../common/enums/content-status.enum';

import { IActionOption, validateActionOption } from './image-riddle-action.entity';
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

  /**
   * Alternative accepted answers (synonyms) — checked in addition to `answer`
   * when validating a player's guess
   */
  @Column({ type: 'jsonb', nullable: true, default: null })
  alternativeAnswers: string[] | null;

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

  @ManyToOne(() => ImageRiddleCategory, (category) => category.riddles, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: ImageRiddleCategory | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  /**
   * Engagement counters (plan/04-image-riddles.md P1 #1) — incremented via
   * POST /image-riddles/:id/engage. No per-user attribution (aggregate only).
   */
  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 0 })
  solves: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /**
   * Action options - Interactive buttons/actions displayed below the question
   * Stored as JSON array of action option objects
   */
  @Column({ type: 'jsonb', nullable: true, default: null })
  actionOptions: IActionOption[] | null;

  /**
   * Whether to use default action options
   * When true, system will auto-generate standard actions
   */
  @Column({ type: 'boolean', default: true })
  useDefaultActions: boolean;

  /**
   * Validate all action options
   * Returns validation results for enterprise-grade quality assurance
   */
  validateActionOptions(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    actionResults: Map<string, { isValid: boolean; errors: string[]; warnings: string[] }>;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const actionResults = new Map<
      string,
      { isValid: boolean; errors: string[]; warnings: string[] }
    >();

    const actions = this.actionOptions || [];

    // Check for duplicate IDs
    const ids = actions.map((a) => a.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate action IDs found: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Validate each action
    for (const action of actions) {
      const result = validateActionOption(action);
      actionResults.set(action.id, result);

      if (!result.isValid) {
        errors.push(`Action '${action.id}': ${result.errors.join(', ')}`);
      }
      if (result.warnings.length > 0) {
        warnings.push(`Action '${action.id}': ${result.warnings.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      actionResults,
    };
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateBeforeSave(): void {
    // Auto-validate action options before save. Array.isArray (not !== null):
    // the property is undefined (not null) on entities created without the
    // field, which crashed every create with a TypeError (P0, found in the
    // 14-feature pass while bulk-importing).
    if (Array.isArray(this.actionOptions) && this.actionOptions.length > 0) {
      const validation = this.validateActionOptions();
      if (!validation.isValid) {
        throw new Error(`Action options validation failed: ${validation.errors.join('; ')}`);
      }
    }
  }
}
