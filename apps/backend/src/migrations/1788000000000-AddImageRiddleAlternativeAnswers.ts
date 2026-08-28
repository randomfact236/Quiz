import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add the `alternativeAnswers` JSONB column to `image_riddles`.
 *
 * Stores optional accepted synonyms checked in addition to the canonical
 * `answer` when validating a player's guess (image riddles cosmetics plan,
 * answer-matching item). Nullable with a null default so existing rows and
 * inserts that omit it keep working unchanged.
 *
 * Idempotency/safety: guarded with a DO block so re-running against a dev DB
 * that already has the column (e.g. via synchronize) is a no-op.
 */
export class AddImageRiddleAlternativeAnswers1788000000000 implements MigrationInterface {
  name = 'AddImageRiddleAlternativeAnswers1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "image_riddles" ADD COLUMN "alternativeAnswers" jsonb DEFAULT null; EXCEPTION WHEN duplicate_column THEN null; END $$;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "image_riddles" DROP COLUMN IF EXISTS "alternativeAnswers"`
    );
  }
}
