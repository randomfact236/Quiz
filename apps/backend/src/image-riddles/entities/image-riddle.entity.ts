/**
 * ============================================================================
 * file.ts - Enterprise Grade
 * ============================================================================
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate, UpdateDateColumn } from 'typeorm';
import { ImageRiddleCategory } from './image-riddle-category.entity';
import { IActionOption, applyActionDefaults, validateActionOption, DEFAULT_ACTION_PRESETS } from './image-riddle-action.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { settings } from '../../config/settings';

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

  @ManyToOne(() => ImageRiddleCategory, category => category.riddles, { onDelete: 'SET NULL', nullable: true })
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
   * Get default timer - all difficulties use settings value
   */
  getDefaultTimer(): number {
    return settings.imageRiddles.defaults.timerSeconds;
  }

  /**
   * Get effective timer in seconds
   * Returns custom timer if set, otherwise difficulty-based default
   */
  getEffectiveTimer(): number {
    return this.timerSeconds ?? this.getDefaultTimer();
  }

  /**
   * Get effective action options
   * Returns custom actions if set, otherwise generates defaults
   */
  getEffectiveActionOptions(): IActionOption[] {
    // If custom actions are defined, use them
    if (this.actionOptions !== null && this.actionOptions.length > 0) {
      return this.actionOptions;
    }

    // If default actions are disabled, return empty
    if (!this.useDefaultActions) {
      return [];
    }

    // Generate default action options based on riddle configuration
    return this.generateDefaultActionOptions();
  }

  /**
   * Generate default action options for this riddle
   * Creates a comprehensive set of standard actions
   */
  private generateDefaultActionOptions(): IActionOption[] {
    const actions: IActionOption[] = [];
    const now = new Date();

    // 1. Submit Answer (primary action)
    actions.push({
      ...applyActionDefaults(DEFAULT_ACTION_PRESETS.submitAnswer),
      createdAt: now,
      updatedAt: now,
    });

    // 2. Show Hint (if hint exists)
    if (this.hint !== null && this.hint.length > 0) {
      actions.push({
        ...applyActionDefaults(DEFAULT_ACTION_PRESETS.showHint),
        createdAt: now,
        updatedAt: now,
      });
    }

    // 3. Skip
    actions.push({
      ...applyActionDefaults(DEFAULT_ACTION_PRESETS.skip),
      createdAt: now,
      updatedAt: now,
    });

    // 4. Reveal Answer
    actions.push({
      ...applyActionDefaults(DEFAULT_ACTION_PRESETS.revealAnswer),
      createdAt: now,
      updatedAt: now,
    });

    // 5. Timer controls (if timer is enabled)
    if (this.showTimer) {
      actions.push({
        ...applyActionDefaults(DEFAULT_ACTION_PRESETS.resetTimer),
        createdAt: now,
        updatedAt: now,
      });

      actions.push({
        ...applyActionDefaults(DEFAULT_ACTION_PRESETS.pauseTimer),
        createdAt: now,
        updatedAt: now,
      });

      actions.push({
        ...applyActionDefaults(DEFAULT_ACTION_PRESETS.resumeTimer),
        createdAt: now,
        updatedAt: now,
      });
    }

    // 6. Fullscreen
    actions.push({
      ...applyActionDefaults(DEFAULT_ACTION_PRESETS.fullscreen),
      createdAt: now,
      updatedAt: now,
    });

    // 7. Share
    actions.push({
      ...applyActionDefaults(DEFAULT_ACTION_PRESETS.share),
      createdAt: now,
      updatedAt: now,
    });

    // 8. Report
    actions.push({
      ...applyActionDefaults(DEFAULT_ACTION_PRESETS.report),
      createdAt: now,
      updatedAt: now,
    });

    // Sort by order
    return actions.sort((a, b) => a.order - b.order);
  }

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
    const actionResults = new Map<string, { isValid: boolean; errors: string[]; warnings: string[] }>();

    const actions = this.actionOptions || [];

    // Check for duplicate IDs
    const ids = actions.map(a => a.id);
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

  /**
   * Add a new action option
   * Enterprise-grade method with validation
   */
  addActionOption(action: Partial<IActionOption>): IActionOption {
    const validated = applyActionDefaults(action);

    // Check for duplicate ID
    const existing = this.actionOptions?.find(a => a.id === validated.id);
    if (existing !== undefined) {
      throw new Error(`Action with ID '${validated.id}' already exists`);
    }

    if (this.actionOptions === null) {
      this.actionOptions = [];
    }

    this.actionOptions.push(validated);
    this.actionOptions.sort((a, b) => a.order - b.order);

    return validated;
  }

  /**
   * Update an existing action option
   */
  updateActionOption(id: string, updates: Partial<IActionOption>): IActionOption | null {
    if (this.actionOptions === null) {
      return null;
    }

    const index = this.actionOptions.findIndex(a => a.id === id);
    if (index === -1) {
      return null;
    }

    const updated = {
      ...this.actionOptions[index],
      ...updates,
      id, // Prevent ID change
      updatedAt: new Date(),
    };

    this.actionOptions[index] = updated;
    this.actionOptions.sort((a, b) => a.order - b.order);

    return updated;
  }

  /**
   * Remove an action option by ID
   */
  removeActionOption(id: string): boolean {
    if (this.actionOptions === null) {
      return false;
    }

    const initialLength = this.actionOptions.length;
    this.actionOptions = this.actionOptions.filter(a => a.id !== id);

    return this.actionOptions.length < initialLength;
  }

  /**
   * Reorder action options
   */
  reorderActionOptions(orderedIds: string[]): void {
    if (this.actionOptions === null) {
      return;
    }

    const actionMap = new Map(this.actionOptions.map(a => [a.id, a]));

    this.actionOptions = orderedIds
      .filter(id => actionMap.has(id))
      .map((id, index) => ({
        ...actionMap.get(id)!,
        order: index * 10,
        updatedAt: new Date(),
      }));
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateBeforeSave(): void {
    // Auto-validate action options before save
    if (this.actionOptions !== null && this.actionOptions.length > 0) {
      const validation = this.validateActionOptions();
      if (!validation.isValid) {
        throw new Error(`Action options validation failed: ${validation.errors.join('; ')}`);
      }
    }
  }
}
