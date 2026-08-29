import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add the optional `authorName` column to `comments` (display-name support).
 *
 * Guests may type any display name when commenting; stored verbatim (length
 * capped by validation). Nullable — older rows and anonymous posts render
 * as "Guest" on the client.
 *
 * Idempotency: guarded so re-running against a dev DB that already has the
 * column (e.g. via synchronize) is a no-op.
 */
export class AddCommentAuthorName1788200000000 implements MigrationInterface {
  name = 'AddCommentAuthorName1788200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "comments" ADD COLUMN "authorName" character varying(50); EXCEPTION WHEN duplicate_column THEN null; END $$;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "authorName"`);
  }
}
