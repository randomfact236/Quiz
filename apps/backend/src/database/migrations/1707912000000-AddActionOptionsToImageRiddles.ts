/**
 * ============================================================================
 * Migration: Add Action Options to Image Riddles
 * ============================================================================
 * Adds action_options and use_default_actions columns to image_riddles table
 * ============================================================================
 */

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddActionOptionsToImageRiddles1707912000000 implements MigrationInterface {
  name = 'AddActionOptionsToImageRiddles1707912000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add action_options column (JSONB for PostgreSQL)
    await queryRunner.addColumn(
      'image_riddles',
      new TableColumn({
        name: 'action_options',
        type: 'jsonb',
        isNullable: true,
        default: null,
        comment: 'Action options displayed below the question (JSON array)',
      })
    );

    // Add use_default_actions column
    await queryRunner.addColumn(
      'image_riddles',
      new TableColumn({
        name: 'use_default_actions',
        type: 'boolean',
        default: true,
        comment: 'Whether to use default action options when custom not provided',
      })
    );

    // Add index for faster queries on action_options
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_image_riddles_action_options 
      ON image_riddles USING GIN (action_options);
    `);

    // console.log('✅ Added action_options and use_default_actions columns to image_riddles table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_image_riddles_action_options;
    `);

    // Remove columns
    await queryRunner.dropColumn('image_riddles', 'action_options');
    await queryRunner.dropColumn('image_riddles', 'use_default_actions');

    // console.log('✅ Removed action_options columns from image_riddles table');
  }
}
